from django.db import migrations

# The four home-page prose columns move into the site_text override table, so
# every piece of editable copy has one storage path and one editor. Their
# shipped defaults now live in the frontend text registry; the columns' current
# contents become overrides, which keeps an existing site rendering identically.
FIELD_TO_KEY = {
    "mission_title": "home.mission.heading",
    "mission_text": "home.mission.body",
    "method_title": "home.methods.heading",
    "method_text": "home.methods.body",
}
LOCALE = "en"


def columns_to_site_text(apps, schema_editor):
    AdminSettings = apps.get_model("admin_panel", "AdminSettings")
    SiteText = apps.get_model("admin_panel", "SiteText")
    for settings in AdminSettings.objects.all():
        for field, key in FIELD_TO_KEY.items():
            value = getattr(settings, field, None)
            # A blank column was never a customization. Leaving the key absent
            # lets the registry default show instead of pinning an empty string.
            if not value:
                continue
            SiteText.objects.update_or_create(
                key=key, locale=LOCALE, defaults={"value": value}
            )


def site_text_to_columns(apps, schema_editor):
    """Reverse: put the overrides back in the columns and drop the rows."""
    AdminSettings = apps.get_model("admin_panel", "AdminSettings")
    SiteText = apps.get_model("admin_panel", "SiteText")
    rows = SiteText.objects.filter(key__in=FIELD_TO_KEY.values(), locale=LOCALE)
    stored = dict(rows.values_list("key", "value"))
    for settings in AdminSettings.objects.all():
        for field, key in FIELD_TO_KEY.items():
            setattr(settings, field, stored.get(key))
        settings.save(update_fields=list(FIELD_TO_KEY))
    rows.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("admin_panel", "0005_sitetext_sitetext_site_text_key_locale_uniq"),
    ]

    operations = [
        # Copy before dropping, so reversing this migration restores the values.
        migrations.RunPython(columns_to_site_text, site_text_to_columns),
        migrations.RemoveField(model_name="adminsettings", name="mission_title"),
        migrations.RemoveField(model_name="adminsettings", name="mission_text"),
        migrations.RemoveField(model_name="adminsettings", name="method_title"),
        migrations.RemoveField(model_name="adminsettings", name="method_text"),
    ]
