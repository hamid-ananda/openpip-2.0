from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # [{"question": "...", "answer": "<hashed>"}, ...] — see core.views
    security_questions = models.JSONField(default=list, blank=True)
    # Null (not blank) so the unique index ignores password-only accounts.
    orcid_id = models.CharField(max_length=19, unique=True, null=True, blank=True)

    class Meta:
        db_table = "user"

    def __str__(self):
        return self.username


class UserDataset(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="user_datasets",
    )
    dataset = models.ForeignKey(
        "datasets.Dataset",
        on_delete=models.CASCADE,
        db_column="dataset_id",
        related_name="user_datasets",
    )

    class Meta:
        db_table = "user_datasets"


class UserInteractionNetwork(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="user_networks",
    )
    interaction_network = models.ForeignKey(
        "interactions.InteractionNetwork",
        on_delete=models.CASCADE,
        db_column="interaction_network_id",
        related_name="user_networks",
    )

    class Meta:
        db_table = "user_interaction_networks"


class UserProtein(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="user_proteins",
    )
    protein = models.ForeignKey(
        "proteins.Protein",
        on_delete=models.CASCADE,
        db_column="protein_id",
        related_name="user_proteins",
    )

    class Meta:
        db_table = "user_protein"
