from django.contrib import admin
from .models import Interaction, InteractionCategory, InteractionNetwork

admin.site.register(Interaction)
admin.site.register(InteractionCategory)
admin.site.register(InteractionNetwork)
