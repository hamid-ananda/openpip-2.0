from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admin_panel", "0002_adminsettings_logo"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminsettings",
            name="nav_style",
            field=models.CharField(
                blank=True, default="solid", max_length=20, null=True
            ),
        ),
        migrations.AddField(
            model_name="adminsettings",
            name="main_color_scheme_2",
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="adminsettings",
            name="gradient_angle",
            field=models.IntegerField(default=135, null=True, blank=True),
        ),
    ]
