from django.http import HttpResponse, JsonResponse
from django.views import View
from .miql import parse_miql
from .tab25 import format_queryset_tab25


class PsicquicQueryView(View):
    def get(self, request):
        query = request.GET.get("q", "*")
        fmt = request.GET.get("format", "tab25").lower()
        first = int(request.GET.get("firstResult", 0))
        max_results = int(request.GET.get("maxResults", 200))

        qs = parse_miql(query)[first : first + max_results]

        if fmt == "json":
            data = [
                {
                    "interactor_a": {
                        "uniprot_id": i.interactor_A.uniprot_id,
                        "gene_name": i.interactor_A.gene_name,
                    },
                    "interactor_b": {
                        "uniprot_id": i.interactor_B.uniprot_id,
                        "gene_name": i.interactor_B.gene_name,
                    },
                    "score": i.score,
                    "interaction_id": i.pk,
                }
                for i in qs.select_related("interactor_A", "interactor_B")
            ]
            return JsonResponse(data, safe=False)

        content = format_queryset_tab25(qs)
        return HttpResponse(content, content_type="text/plain; charset=utf-8")


class PsicquicCountView(View):
    def get(self, request):
        query = request.GET.get("q", "*")
        count = parse_miql(query).count()
        return HttpResponse(str(count), content_type="text/plain; charset=utf-8")
