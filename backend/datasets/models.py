from django.db import models


class Dataset(models.Model):
    PUBLICATION_STATUS_CHOICES = [
        ("published", "Published"),
        ("preprint", "Preprint"),
        ("unpublished", "Unpublished"),
    ]

    name = models.CharField(max_length=100, null=True)
    pubmed_id = models.CharField(max_length=100, null=True)
    author = models.CharField(max_length=100, null=True)
    year = models.CharField(max_length=10, null=True)
    interaction_status = models.CharField(max_length=100, null=True)
    description = models.CharField(max_length=1000, null=True)
    number_of_interactions = models.CharField(max_length=100, null=True)
    file_path = models.CharField(max_length=100, null=True)

    # ── Citation ──────────────────────────────────────────────────────────
    # Legacy carried only pubmed_id/author/year, which is too thin to render a
    # real reference. These are all nullable: an unpublished dataset is a
    # first-class case, not a row with holes in it.
    title = models.CharField(max_length=500, null=True, blank=True)
    journal = models.CharField(max_length=300, null=True, blank=True)
    doi = models.CharField(max_length=200, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    publication_status = models.CharField(
        max_length=20,
        choices=PUBLICATION_STATUS_CHOICES,
        default="unpublished",
    )

    # ── About page narrative ──────────────────────────────────────────────
    # The long-form "what this screen was" prose. Lives here rather than in the
    # site-text registry so that an admin can write it for a dataset they just
    # uploaded, without a code change to declare a new registry key.
    about_heading = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="About-page heading. Falls back to the dataset name.",
    )
    about_body = models.TextField(null=True, blank=True)
    show_on_about = models.BooleanField(default=True)
    about_order = models.IntegerField(default=0)

    class Meta:
        db_table = "dataset"

    def __str__(self):
        return self.name or str(self.pk)


class DataFile(models.Model):
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        db_column="dataset_id",
        related_name="data_files",
    )
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)

    class Meta:
        db_table = "data_file"

    def __str__(self):
        return self.file_name


class DatasetRequest(models.Model):
    email = models.EmailField()
    request = models.TextField()
    md5 = models.CharField(max_length=32, null=True)

    class Meta:
        db_table = "dataset_request"


class DatasetRequestDataset(models.Model):
    dataset_request = models.ForeignKey(
        DatasetRequest,
        on_delete=models.CASCADE,
        db_column="dataset_request_id",
        related_name="request_datasets",
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        db_column="dataset_id",
        related_name="dataset_requests",
    )

    class Meta:
        db_table = "dataset_request_dataset"


class UploadFiles(models.Model):
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)
    file_size = models.IntegerField(default=0)
    show = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "upload_files"

    def __str__(self):
        return self.file_name
