from django.db import models


class Dataset(models.Model):
    name = models.CharField(max_length=100, null=True)
    pubmed_id = models.CharField(max_length=100, null=True)
    author = models.CharField(max_length=100, null=True)
    year = models.CharField(max_length=10, null=True)
    interaction_status = models.CharField(max_length=100, null=True)
    description = models.CharField(max_length=1000, null=True)
    number_of_interactions = models.CharField(max_length=100, null=True)
    file_path = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'dataset'

    def __str__(self):
        return self.name or str(self.pk)


class DataFile(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, db_column='dataset_id',
                                related_name='data_files')
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)

    class Meta:
        db_table = 'data_file'

    def __str__(self):
        return self.file_name


class DatasetRequest(models.Model):
    email = models.EmailField()
    request = models.TextField()
    md5 = models.CharField(max_length=32, null=True)

    class Meta:
        db_table = 'dataset_request'


class DatasetRequestDataset(models.Model):
    dataset_request = models.ForeignKey(
        DatasetRequest,
        on_delete=models.CASCADE,
        db_column='dataset_request_id',
        related_name='request_datasets',
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        db_column='dataset_id',
        related_name='dataset_requests',
    )

    class Meta:
        db_table = 'dataset_request_dataset'


class UploadFiles(models.Model):
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'upload_files'

    def __str__(self):
        return self.file_name
