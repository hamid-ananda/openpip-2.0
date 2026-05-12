from django.db import models


class Protein(models.Model):
    gene_name = models.CharField(max_length=100, null=True, db_index=True)
    protein_name = models.CharField(max_length=200, null=True)
    uniprot_id = models.CharField(max_length=100, null=True, db_index=True)
    ensembl_id = models.CharField(max_length=100, null=True)
    entrez_id = models.CharField(max_length=100, null=True)
    sequence = models.TextField(null=True)
    description = models.CharField(max_length=10000, null=True)
    number_of_interactions_in_database = models.IntegerField(null=True)

    class Meta:
        db_table = 'protein'

    def __str__(self):
        return self.gene_name or self.uniprot_id or str(self.pk)


class Identifier(models.Model):
    identifier = models.CharField(max_length=100, null=True, db_index=True)
    naming_convention = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'identifier'

    def __str__(self):
        return self.identifier or str(self.pk)


class ProteinIdentifier(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='protein_identifiers')
    identifier = models.ForeignKey(Identifier, on_delete=models.CASCADE, db_column='identifier_id',
                                   related_name='protein_identifiers')

    class Meta:
        db_table = 'protein_identifier'


class Organism(models.Model):
    name = models.CharField(max_length=200)
    taxonomy_id = models.CharField(max_length=100)

    class Meta:
        db_table = 'organism'

    def __str__(self):
        return self.name


class ProteinOrganism(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='protein_organisms')
    organism = models.ForeignKey(Organism, on_delete=models.CASCADE, db_column='organism_id',
                                 related_name='protein_organisms')

    class Meta:
        db_table = 'protein_organism'


class ProteinIsoform(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='isoform_links')
    isoform = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='isoform_id',
                                related_name='isoform_of_links')

    class Meta:
        db_table = 'protein_isoform'


class Domain(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='domains')
    type = models.CharField(max_length=100, null=True)
    name = models.CharField(max_length=100, null=True)
    start_position = models.CharField(max_length=100, null=True)
    end_position = models.CharField(max_length=100, null=True)
    description = models.CharField(max_length=100, null=True)
    sequence = models.CharField(max_length=1000, null=True)

    class Meta:
        db_table = 'domain'

    def __str__(self):
        return self.name or str(self.pk)


class Complex(models.Model):
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=500, null=True)

    class Meta:
        db_table = 'complex'

    def __str__(self):
        return self.name


class ComplexProtein(models.Model):
    complex = models.ForeignKey(Complex, on_delete=models.CASCADE, db_column='complex_id',
                                related_name='complex_proteins')
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='complex_proteins')

    class Meta:
        db_table = 'complex_protein'


class AnnotationType(models.Model):
    type = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    description = models.TextField()
    fields = models.TextField()
    show_in_filter = models.CharField(max_length=10)
    show_in_table = models.CharField(max_length=10)

    class Meta:
        db_table = 'annotation_type'

    def __str__(self):
        return self.label


class Annotation(models.Model):
    annotation = models.CharField(max_length=5000, null=True)
    identifier = models.IntegerField(null=True)
    annotation_type = models.IntegerField(null=True)
    type_name = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'annotation'

    def __str__(self):
        return self.type_name or str(self.pk)


class AnnotationProtein(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE, db_column='annotation_id',
                                   related_name='annotation_proteins')
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='annotation_proteins')

    class Meta:
        db_table = 'annotation_protein'


class ExternalLink(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='external_links')
    url = models.TextField()
    name = models.CharField(max_length=200)

    class Meta:
        db_table = 'external_link'

    def __str__(self):
        return self.name
