from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="uploadfiles",
            name="file_size",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="uploadfiles",
            name="show",
            field=models.BooleanField(default=True),
        ),
    ]
