from django.contrib import admin
from .models import Protein, Identifier, Organism, Domain, Annotation, AnnotationType

admin.site.register(Protein)
admin.site.register(Identifier)
admin.site.register(Organism)
admin.site.register(Domain)
admin.site.register(Annotation)
admin.site.register(AnnotationType)
