"""Link proteins to their organism using UniProt.

Legacy never populated `organism` or `protein_organism` — the tables are in the
schema but `dev10.0_huri.sql` has no rows for either — so every protein that
arrived through the bulk table copy has no taxonomy. Proteins uploaded through
openPIP 2.0's own parser do, because upload_parser._handle_taxon links them at
ingest. This command closes the gap for the historical rows.

Without it, PSI-MI TAB columns 9 and 10 (taxon interactor A/B) are "-" for most
of the PSICQUIC feed.

Idempotent: only touches proteins that have no organism link, so a partial or
interrupted run can simply be repeated.

    python manage.py backfill_protein_organisms --dry-run
    python manage.py backfill_protein_organisms
"""

import time

from django.core.management.base import BaseCommand
from django.db import transaction

from proteins.models import Organism, Protein, ProteinOrganism
from proteins.uniprot import (
    BATCH_SIZE,
    base_accession,
    extract_taxon,
    fetch_uniprot_data,
)


class Command(BaseCommand):
    help = "Link proteins with no organism to one, resolved from UniProt."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing anything.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Only process this many proteins (for a trial run).",
        )
        parser.add_argument(
            "--sleep",
            type=float,
            default=1.0,
            help="Seconds between UniProt batches (default 1.0). Be polite.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        sleep_between = options["sleep"]

        proteins = list(
            Protein.objects.filter(protein_organisms__isnull=True)
            .exclude(uniprot_id__isnull=True)
            .exclude(uniprot_id="")
            .only("id", "uniprot_id")[: options["limit"]]
            if options["limit"]
            else Protein.objects.filter(protein_organisms__isnull=True)
            .exclude(uniprot_id__isnull=True)
            .exclude(uniprot_id="")
            .only("id", "uniprot_id")
        )
        if not proteins:
            self.stdout.write("Nothing to do — every protein already has an organism.")
            return

        # Several isoforms collapse to one accession, so this is fewer lookups
        # than proteins.
        wanted = sorted({base_accession(p.uniprot_id) for p in proteins})
        batches = range(0, len(wanted), BATCH_SIZE)
        self.stdout.write(
            f"{len(proteins)} proteins to resolve, "
            f"{len(wanted)} distinct accessions, {len(batches)} batches."
        )

        entries: dict[str, dict] = {}
        for n, start in enumerate(batches, 1):
            batch = wanted[start : start + BATCH_SIZE]
            try:
                entries.update(fetch_uniprot_data(batch))
            except Exception as exc:  # noqa: BLE001 — one bad batch must not abort
                self.stderr.write(f"  batch {n} failed ({exc}); continuing")
            self.stdout.write(f"  batch {n}/{len(batches)} — {len(entries)} resolved")
            if sleep_between and n < len(batches):
                time.sleep(sleep_between)

        taxa = {acc: extract_taxon(entry) for acc, entry in entries.items()}
        resolved = {acc: taxon for acc, taxon in taxa.items() if taxon}

        links = []
        unresolved = []
        organisms: dict[str, Organism] = {}
        for protein in proteins:
            taxon = resolved.get(base_accession(protein.uniprot_id))
            if not taxon:
                unresolved.append(protein.uniprot_id)
                continue
            taxonomy_id, scientific_name = taxon
            if taxonomy_id not in organisms:
                organisms[taxonomy_id] = self._organism(
                    taxonomy_id, scientific_name, dry_run
                )
            links.append(
                ProteinOrganism(protein=protein, organism=organisms[taxonomy_id])
            )

        self.stdout.write("")
        self.stdout.write(f"resolved:   {len(links)}")
        self.stdout.write(f"unresolved: {len(unresolved)}")
        if unresolved:
            self.stdout.write(f"  e.g. {unresolved[:10]}")
        for taxonomy_id, organism in sorted(organisms.items()):
            self.stdout.write(
                f"  taxid {taxonomy_id}: {organism.scientific_name or organism.name}"
            )

        if dry_run:
            self.stdout.write(self.style.WARNING("dry run — nothing written"))
            return

        with transaction.atomic():
            ProteinOrganism.objects.bulk_create(links, batch_size=1000)
        self.stdout.write(self.style.SUCCESS(f"linked {len(links)} proteins"))

    def _organism(self, taxonomy_id: str, scientific_name: str, dry_run: bool):
        """Find-or-create the Organism, filling scientific_name if it is missing.

        taxonomy_id is unique (migration 0006), so an existing row is reused
        rather than duplicated. Legacy rows carry a common name ("human") and no
        scientific name; UniProt supplies the latter, which is what PSI-MI TAB
        wants in the taxon columns.
        """
        organism = Organism.objects.filter(taxonomy_id=taxonomy_id).first()
        if organism:
            if scientific_name and not organism.scientific_name:
                # Set in memory either way, so a dry run reports the name the
                # real run would write rather than the stale one.
                organism.scientific_name = scientific_name
                if not dry_run:
                    organism.save(update_fields=["scientific_name"])
            return organism
        if dry_run:
            return Organism(
                taxonomy_id=taxonomy_id,
                name=scientific_name,
                scientific_name=scientific_name,
            )
        return Organism.objects.create(
            taxonomy_id=taxonomy_id,
            name=scientific_name,
            scientific_name=scientific_name,
        )
