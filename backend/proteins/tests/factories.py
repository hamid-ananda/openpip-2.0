import factory
from proteins.models import Protein, Identifier, ProteinIdentifier, Organism


class ProteinFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Protein

    gene_name = factory.Sequence(lambda n: f'GENE{n}')
    protein_name = factory.Sequence(lambda n: f'Protein {n}')
    uniprot_id = factory.Sequence(lambda n: f'P{n:05d}')
    ensembl_id = factory.Sequence(lambda n: f'ENSG{n:011d}')
    entrez_id = factory.Sequence(lambda n: str(n + 1000))
    sequence = 'MSEQSEQ'
    description = 'Test protein'
    number_of_interactions_in_database = 0


class IdentifierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Identifier

    identifier = factory.Sequence(lambda n: f'IDENT{n}')
    naming_convention = 'gene_name'


class ProteinIdentifierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProteinIdentifier

    protein = factory.SubFactory(ProteinFactory)
    identifier = factory.SubFactory(IdentifierFactory)


class OrganismFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organism

    name = 'Homo sapiens'
    taxonomy_id = '9606'
