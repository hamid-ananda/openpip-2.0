from django.db import models
from proteins.models import Protein, Annotation, Domain


class InteractionCategory(models.Model):
    admin_settings = models.ForeignKey(
        "admin_panel.AdminSettings",
        on_delete=models.SET_NULL,
        null=True,
        db_column="admin_settings_id",
        related_name="interaction_categories",
    )
    category_name = models.CharField(max_length=200, null=True)
    order = models.CharField(max_length=200, null=True)
    color_scheme = models.CharField(max_length=200, null=True)
    description = models.CharField(max_length=1000, null=True)
    selected_by_default = models.CharField(max_length=10, null=True)
    include_in_home_page_count = models.CharField(max_length=10, null=True)

    class Meta:
        db_table = "interaction_category"

    def __str__(self):
        return self.category_name or str(self.pk)


class Interaction(models.Model):
    interactor_A = models.ForeignKey(
        Protein,
        on_delete=models.CASCADE,
        db_column="interactor_A",
        related_name="interactions_as_A",
    )
    interactor_B = models.ForeignKey(
        Protein,
        on_delete=models.CASCADE,
        db_column="interactor_B",
        related_name="interactions_as_B",
    )
    score = models.CharField(max_length=10, null=True)
    binding_start = models.CharField(max_length=10, null=True)
    binding_end = models.CharField(max_length=10, null=True)
    removed = models.CharField(max_length=10, default="0")
    domain = models.IntegerField(null=True)

    class Meta:
        db_table = "interaction"

    def __str__(self):
        return f"{self.interactor_A} — {self.interactor_B}"


class InteractionDataset(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column="interaction_id",
        related_name="interaction_datasets",
    )
    dataset = models.ForeignKey(
        "datasets.Dataset",
        on_delete=models.CASCADE,
        db_column="dataset_id",
        related_name="interaction_datasets",
    )

    class Meta:
        db_table = "interaction_dataset"


class InteractionInteractionCategory(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column="interaction_id",
        related_name="interaction_categories",
    )
    interaction_category = models.ForeignKey(
        InteractionCategory,
        on_delete=models.CASCADE,
        db_column="interaction_category_id",
        related_name="interaction_categories",
    )

    class Meta:
        db_table = "interaction_interaction_category"


class InteractionDomain(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column="interaction_id",
        related_name="interaction_domains",
    )
    domain = models.ForeignKey(
        Domain,
        on_delete=models.CASCADE,
        db_column="domain_id",
        related_name="interaction_domains",
    )

    class Meta:
        db_table = "interaction_domain"


class AnnotationInteraction(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column="interaction_id",
        related_name="annotation_interactions",
    )
    annotation = models.ForeignKey(
        Annotation,
        on_delete=models.CASCADE,
        db_column="annotation_id",
        related_name="annotation_interactions",
    )

    class Meta:
        db_table = "annotation_interaction"


class InteractionNetwork(models.Model):
    name = models.CharField(max_length=100, null=True)
    interactor_query_string = models.CharField(max_length=3000, null=True)
    score_parameter = models.CharField(max_length=100, null=True)
    category_array = models.CharField(max_length=100, null=True)
    tissue_expression_array = models.CharField(max_length=100, null=True)
    query = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "interaction_network"

    def __str__(self):
        return self.name or str(self.pk)


class InteractionInteractionNetworks(models.Model):
    interaction_network = models.ForeignKey(
        InteractionNetwork,
        on_delete=models.CASCADE,
        db_column="interaction_network_id",
        related_name="network_interactions",
    )
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column="interaction_id",
        related_name="network_memberships",
    )

    class Meta:
        db_table = "interaction_interaction_networks"


class SupportInformation(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "support_information"

    def __str__(self):
        return self.name


class InteractionSupportInformation(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        null=True,
        db_column="interaction_id",
        related_name="support_info",
    )
    support_information = models.ForeignKey(
        SupportInformation,
        on_delete=models.CASCADE,
        null=True,
        db_column="support_information_id",
        related_name="interaction_support",
    )
    value = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = "interaction_support_information"
