from django.db import migrations


def fix_audit_data(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        # Issue 1: HuRI (id=15) — link 45,816 orphaned interactions and set count
        cursor.execute(
            """
            INSERT INTO interaction_dataset (interaction_id, dataset_id)
            SELECT id, 15 FROM interaction WHERE id > 76563
            ON CONFLICT DO NOTHING
            """
        )
        cursor.execute(
            "UPDATE dataset SET number_of_interactions = '45816' WHERE id = 15"
        )

        # Issue 2: HI-III (id=8) — clear dataset name stored in pubmed_id
        cursor.execute("UPDATE dataset SET pubmed_id = NULL WHERE id = 8")

        # Issue 3: Test-Space (id=2) — replace empty string with valid status
        cursor.execute(
            "UPDATE dataset SET interaction_status = 'validated' WHERE id = 2"
        )


def reverse_fix_audit_data(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM interaction_dataset WHERE dataset_id = 15 AND interaction_id > 76563"
        )
        cursor.execute("UPDATE dataset SET number_of_interactions = NULL WHERE id = 15")
        cursor.execute("UPDATE dataset SET pubmed_id = 'HI-III' WHERE id = 8")
        cursor.execute("UPDATE dataset SET interaction_status = '' WHERE id = 2")


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0002_uploadfiles_file_size_uploadfiles_show"),
        ("interactions", "0005_restore_search_indexes"),
    ]

    operations = [
        migrations.RunPython(fix_audit_data, reverse_code=reverse_fix_audit_data),
    ]
