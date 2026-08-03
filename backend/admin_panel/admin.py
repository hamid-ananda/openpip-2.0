from django.contrib import admin
from .models import AdminSettings, Announcement, SiteText

admin.site.register(AdminSettings)
admin.site.register(Announcement)


@admin.register(SiteText)
class SiteTextAdmin(admin.ModelAdmin):
    list_display = ("key", "locale", "updated_at")
    list_filter = ("locale",)
    search_fields = ("key", "value")
