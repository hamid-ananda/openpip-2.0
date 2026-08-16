from django.http import HttpResponse, JsonResponse
from django.views import View

from .miql import parse_miql
from .tab25 import format_queryset_tab25

# Formats this service answers to. `tab25` and `count` are PSICQUIC spec names;
# `json` is an openPIP extension for browser callers that do not want to parse
# tab-separated text.
#
# TAB 2.6/2.7/2.8 are deliberately absent rather than aliased to 2.5: every
# column they add would be "-" for openPIP today, and advertising a format we
# answer with empty columns is worse than not offering it. See tab25.py.
SUPPORTED_FORMATS = ("tab25", "count", "json")

# The PSICQUIC REST specification level implemented, not the openPIP release.
# The registry at EBI reads this to decide how to talk to the service.
REST_VERSION = "1.3"


def _plain(content: str, status: int = 200) -> HttpResponse:
    return HttpResponse(
        content, status=status, content_type="text/plain; charset=utf-8"
    )


class PsicquicQueryView(View):
    def get(self, request):
        query = request.GET.get("q", "*")
        fmt = request.GET.get("format", "tab25").lower()

        if fmt not in SUPPORTED_FORMATS:
            # The spec's answer for a format the service cannot produce. Falling
            # through to TAB — as this view used to — meant format=xml25 got
            # tab-separated text labelled as the caller's requested format.
            return _plain(
                f"Unsupported format: {fmt}. "
                f"Supported formats: {', '.join(SUPPORTED_FORMATS)}\n",
                status=406,
            )

        matches = parse_miql(query)
        if fmt == "count":
            return _plain(str(matches.count()))

        try:
            first = int(request.GET.get("firstResult", 0))
            max_results = int(request.GET.get("maxResults", 200))
        except ValueError:
            return _plain("firstResult and maxResults must be integers\n", status=400)
        if first < 0 or max_results < 0:
            return _plain(
                "firstResult and maxResults must not be negative\n", status=400
            )

        qs = matches[first : first + max_results]

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

        return _plain(format_queryset_tab25(qs))


class PsicquicCountView(View):
    def get(self, request):
        query = request.GET.get("q", "*")
        return _plain(str(parse_miql(query).count()))


class PsicquicFormatsView(View):
    """The formats this service can return, one per line.

    The EBI registry polls this to learn what a service supports; without it a
    listing cannot be validated.
    """

    def get(self, request):
        return _plain("\n".join(SUPPORTED_FORMATS) + "\n")


class PsicquicVersionView(View):
    """The PSICQUIC REST specification level implemented."""

    def get(self, request):
        return _plain(REST_VERSION + "\n")
