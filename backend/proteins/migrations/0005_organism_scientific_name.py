from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("proteins", "0004_add_search_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="organism",
            name="scientific_name",
            field=models.CharField(max_length=200, null=True),
        ),
    ]
