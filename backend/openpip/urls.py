from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('admin_panel.urls')),
    path('api/', include('core.urls')),
    path('api/', include('proteins.urls')),
    path('api/', include('datasets.urls')),
    path('api/', include('interactions.urls')),
]
