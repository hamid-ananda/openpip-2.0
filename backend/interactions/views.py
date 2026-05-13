from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import InteractionCategory
from .search_service import execute_search


class InteractionCategoryListView(APIView):
    """Return all InteractionCategory rows ordered by their 'order' field."""

    permission_classes = [AllowAny]

    def get(self, request):
        categories = InteractionCategory.objects.all().order_by("order")
        data = [
            {"id": cat.id, "category_name": cat.category_name, "order": cat.order}
            for cat in categories
        ]
        return Response(data)


class SearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "")
        filter_parameter = request.query_params.get("filter", "None")
        result = execute_search(q=q, filter_parameter=filter_parameter)
        return Response(result)


class SearchInteractorsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        search_term = request.data.get("searchTerm", "")
        filter_parameter = request.data.get("filterParameter", "None")
        if filter_parameter == "query_interactor":
            filter_parameter = "query_query"
        result = execute_search(q=search_term, filter_parameter=filter_parameter)
        return Response(result)
