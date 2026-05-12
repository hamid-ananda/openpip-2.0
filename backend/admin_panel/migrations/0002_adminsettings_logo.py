from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admin_panel", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminsettings",
            name="logo",
            field=models.FileField(blank=True, null=True, upload_to="logos/"),
        ),
    ]
