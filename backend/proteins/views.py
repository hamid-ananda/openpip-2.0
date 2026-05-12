from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Identifier


class AutocompleteView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response([])
        matching = (
            Identifier.objects.filter(identifier__icontains=q)
            .values_list("identifier", flat=True)
            .distinct()[:20]
        )
        return Response(list(matching))
