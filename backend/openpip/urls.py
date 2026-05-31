from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from interactions.views import InteractionCategoryListView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/", include("admin_panel.urls")),
    path("api/", include("core.urls")),
    path("api/", include("proteins.urls")),
    path("api/", include("datasets.urls")),
    path("api/", include("interactions.urls")),
    path("api/interactions/categories", InteractionCategoryListView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
