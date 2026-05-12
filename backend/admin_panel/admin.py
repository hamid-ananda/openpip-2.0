from django.contrib import admin
from .models import AdminSettings, Announcement

admin.site.register(AdminSettings)
admin.site.register(Announcement)
