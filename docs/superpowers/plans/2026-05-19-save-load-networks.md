# Save / Load Interaction Networks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated users save the current visible interaction network and reload it from their profile page.

**Architecture:** Backend stores visible (post-filter) interaction IDs in the existing `InteractionInteractionNetworks` join table, linked to `InteractionNetwork` (query/filter metadata) and `UserInteractionNetwork` (ownership). Four new endpoints under `interactions/urls.py`. Frontend adds a Save button to the SearchSidebar Tools section and a Saved Networks card to ProfilePage.

**Tech Stack:** Django 5 + DRF, factory_boy + pytest-django, React 18 + TypeScript, TanStack Query, Zustand, MSW

---

## File Map

**Create:**
- `backend/interactions/serializers.py` — `SaveNetworkInputSerializer`, `SavedNetworkListSerializer`
- `backend/interactions/tests/test_networks.py` — all backend network tests
- `frontend/src/api/networks.ts` — `useSavedNetworks`, `useSaveNetwork`, `useDeleteNetwork`
- `frontend/src/mocks/handlers/networks.ts` — stateful MSW handler
- `frontend/src/api/networks.test.ts` — hook tests against MSW

**Modify:**
- `backend/interactions/models.py:125` — add `created_at` to `InteractionNetwork`
- `backend/interactions/search_service.py` — add `build_result_from_interaction_ids`
- `backend/interactions/views.py` — add `SavedNetworkListView`, `SavedNetworkDetailView`
- `backend/interactions/urls.py` — register two new routes
- `frontend/src/types/api.ts` — add `SavedNetwork` interface
- `frontend/src/features/search/SearchSidebar.tsx` — save button in Tools section; accept `visibleInteractionIds` prop
- `frontend/src/features/search/SearchResultsPage.tsx` — compute + pass `visibleInteractionIds` to sidebar
- `frontend/src/features/auth/ProfilePage.tsx` — Saved Networks card
- `frontend/src/mocks/handlers/index.ts` — register `networksHandlers`

---

## Task 1: Add `created_at` to `InteractionNetwork` + generate migration

**Files:**
- Modify: `backend/interactions/models.py:133` (inside `InteractionNetwork` class body)

- [ ] **Step 1: Add the field**

  In `backend/interactions/models.py`, add `created_at` to `InteractionNetwork` (after `query`, before the `class Meta` block):

  ```python
  class InteractionNetwork(models.Model):
      name = models.CharField(max_length=100, null=True)
      interactor_query_string = models.CharField(max_length=3000, null=True)
      score_parameter = models.CharField(max_length=100, null=True)
      category_array = models.CharField(max_length=100, null=True)
      tissue_expression_array = models.CharField(max_length=100, null=True)
      query = models.CharField(max_length=100, null=True)
      created_at = models.DateTimeField(auto_now_add=True, null=True)

      class Meta:
          db_table = "interaction_network"

      def __str__(self):
          return self.name or str(self.pk)
  ```

- [ ] **Step 2: Generate migration**

  ```bash
  cd backend && python manage.py makemigrations interactions --name interactionnetwork_created_at
  ```

  Expected output: `Migrations for 'interactions': interactions/migrations/0002_interactionnetwork_created_at.py`

- [ ] **Step 3: Apply migration**

  ```bash
  python manage.py migrate
  ```

  Expected: `Applying interactions.0002_interactionnetwork_created_at... OK`

- [ ] **Step 4: Commit**

  ```bash
  git add backend/interactions/models.py backend/interactions/migrations/0002_interactionnetwork_created_at.py
  git commit -m "migrate: add created_at to InteractionNetwork"
  ```

---

## Task 2: Backend serializers

**Files:**
- Create: `backend/interactions/serializers.py`

- [ ] **Step 1: Create the serializers file**

  ```python
  # backend/interactions/serializers.py
  from rest_framework import serializers
  from .models import InteractionNetwork


  class SaveNetworkInputSerializer(serializers.Serializer):
      name = serializers.CharField(max_length=100)
      query = serializers.CharField(max_length=100)
      score_parameter = serializers.CharField(max_length=100, default="0.00")
      category_array = serializers.CharField(max_length=100, allow_blank=True, default="")
      tissue_expression_array = serializers.CharField(
          max_length=100, allow_blank=True, default=""
      )
      interaction_ids = serializers.ListField(
          child=serializers.IntegerField(), allow_empty=False
      )


  class SavedNetworkListSerializer(serializers.ModelSerializer):
      interaction_count = serializers.SerializerMethodField()

      def get_interaction_count(self, obj):
          return obj.network_interactions.count()

      class Meta:
          model = InteractionNetwork
          fields = ["id", "name", "query", "interaction_count", "created_at"]
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add backend/interactions/serializers.py
  git commit -m "feat: add SaveNetworkInputSerializer and SavedNetworkListSerializer"
  ```

---

## Task 3: `build_result_from_interaction_ids` in search_service

**Files:**
- Modify: `backend/interactions/search_service.py`

- [ ] **Step 1: Add the function at the end of search_service.py**

  Append after the `execute_search` function:

  ```python
  def build_result_from_interaction_ids(interaction_ids: list, query: str) -> dict:
      """
      Reconstruct a SearchResult-shaped dict from a stored list of interaction IDs.
      Used when loading a saved network — returns the same shape as execute_search().
      """
      if not interaction_ids:
          return {
              "all_proteins": [],
              "all_interactions": [],
              "domains": "",
              "complexes": "",
              "query_protein_id_array": [],
              "search_term": query,
              "found_protein_summary": query,
              "unfound_protein_summary": "",
          }

      interactions_list = list(Interaction.objects.filter(id__in=interaction_ids))

      protein_id_set: set = set()
      for ix in interactions_list:
          protein_id_set.add(ix.interactor_A_id)
          protein_id_set.add(ix.interactor_B_id)
      protein_ids = list(protein_id_set)

      terms = {t.strip().upper() for t in query.split(",") if t.strip()}
      protein_map = {p.id: p for p in Protein.objects.filter(id__in=protein_ids)}
      query_protein_id_set = {
          pid
          for pid, p in protein_map.items()
          if p.gene_name and p.gene_name.upper() in terms
      }
      query_protein_ids = list(query_protein_id_set)

      ann_protein_links = AnnotationProtein.objects.filter(
          protein_id__in=protein_ids
      ).select_related("annotation")
      annotations_by_protein: dict = {}
      for ap in ann_protein_links:
          ann = ap.annotation
          if ann.type_name:
              annotations_by_protein.setdefault(ap.protein_id, {})[
                  ann.type_name
              ] = ann.annotation or ""

      non_query_proteins, query_proteins = [], []
      for pid, p in protein_map.items():
          obj = _build_protein_dict(p, annotations_by_protein)
          if pid in query_protein_id_set:
              query_proteins.append(obj)
          else:
              non_query_proteins.append(obj)
      all_proteins = non_query_proteins + query_proteins

      datasets_by_interaction: dict = {}
      for id_obj in InteractionDataset.objects.filter(
          interaction_id__in=interaction_ids
      ).select_related("dataset"):
          datasets_by_interaction.setdefault(id_obj.interaction_id, []).append(
              id_obj.dataset
          )

      categories_by_interaction: dict = {}
      for ic in InteractionInteractionCategory.objects.filter(
          interaction_id__in=interaction_ids
      ).select_related("interaction_category"):
          categories_by_interaction.setdefault(ic.interaction_id, []).append(
              ic.interaction_category
          )

      annotations_by_interaction: dict = {}
      for ann in Annotation.objects.filter(identifier__in=interaction_ids):
          annotations_by_interaction.setdefault(ann.identifier, []).append(ann)

      multi_query_edges, query_edges, interactor_edges = [], [], []
      for ix in interactions_list:
          a_protein = protein_map.get(ix.interactor_A_id)
          b_protein = protein_map.get(ix.interactor_B_id)
          if a_protein is None or b_protein is None:
              continue

          a_is_query = ix.interactor_A_id in query_protein_id_set
          b_is_query = ix.interactor_B_id in query_protein_id_set

          if a_is_query and b_is_query:
              edge_type, a_side, b_side = "multi", a_protein, b_protein
          elif a_is_query:
              edge_type, a_side, b_side = "query", a_protein, b_protein
          elif b_is_query:
              edge_type, a_side, b_side = "query", b_protein, a_protein
          else:
              edge_type, a_side, b_side = "interactor", a_protein, b_protein

          edge = _build_interaction_dict(
              ix,
              a_side,
              b_side,
              datasets_by_interaction,
              categories_by_interaction,
              annotations_by_interaction,
          )

          if edge_type == "multi":
              multi_query_edges.append(edge)
          elif edge_type == "query":
              query_edges.append(edge)
          else:
              interactor_edges.append(edge)

      return {
          "all_proteins": all_proteins,
          "all_interactions": multi_query_edges + query_edges + interactor_edges,
          "domains": "",
          "complexes": "",
          "query_protein_id_array": query_protein_ids,
          "search_term": query,
          "found_protein_summary": query,
          "unfound_protein_summary": "",
      }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add backend/interactions/search_service.py
  git commit -m "feat: add build_result_from_interaction_ids to search_service"
  ```

---

## Task 4: Backend views — SavedNetworkListView + SavedNetworkDetailView

**Files:**
- Modify: `backend/interactions/views.py`

- [ ] **Step 1: Add imports at the top of views.py**

  Add these imports after the existing imports:

  ```python
  from django.http import Http404
  from rest_framework.exceptions import PermissionDenied
  from rest_framework.permissions import IsAuthenticated

  from core.models import UserInteractionNetwork
  from .models import InteractionNetwork, InteractionInteractionNetworks
  from .serializers import SaveNetworkInputSerializer, SavedNetworkListSerializer
  from .search_service import build_result_from_interaction_ids
  ```

- [ ] **Step 2: Add the two view classes at the end of views.py**

  ```python
  class SavedNetworkListView(APIView):
      permission_classes = [IsAuthenticated]

      def get(self, request):
          network_ids = UserInteractionNetwork.objects.filter(
              user=request.user
          ).values_list("interaction_network_id", flat=True)
          networks = InteractionNetwork.objects.filter(
              id__in=network_ids
          ).order_by("-id")
          serializer = SavedNetworkListSerializer(networks, many=True)
          return Response(serializer.data)

      def post(self, request):
          serializer = SaveNetworkInputSerializer(data=request.data)
          serializer.is_valid(raise_exception=True)
          data = serializer.validated_data

          network = InteractionNetwork.objects.create(
              name=data["name"],
              query=data["query"],
              interactor_query_string=data["query"],
              score_parameter=data["score_parameter"],
              category_array=data["category_array"],
              tissue_expression_array=data.get("tissue_expression_array", ""),
          )
          InteractionInteractionNetworks.objects.bulk_create(
              [
                  InteractionInteractionNetworks(
                      interaction_network=network,
                      interaction_id=iid,
                  )
                  for iid in data["interaction_ids"]
              ]
          )
          UserInteractionNetwork.objects.create(
              user=request.user,
              interaction_network=network,
          )
          return Response(
              {
                  "id": network.id,
                  "name": network.name,
                  "interaction_count": len(data["interaction_ids"]),
              },
              status=201,
          )


  class SavedNetworkDetailView(APIView):
      permission_classes = [IsAuthenticated]

      def _get_owned_network(self, request, pk: int) -> InteractionNetwork:
          try:
              network = InteractionNetwork.objects.get(pk=pk)
          except InteractionNetwork.DoesNotExist:
              raise Http404
          if not UserInteractionNetwork.objects.filter(
              user=request.user, interaction_network=network
          ).exists():
              raise PermissionDenied
          return network

      def get(self, request, pk: int):
          network = self._get_owned_network(request, pk)
          interaction_ids = list(
              network.network_interactions.values_list("interaction_id", flat=True)
          )
          result = build_result_from_interaction_ids(
              interaction_ids, network.query or ""
          )
          return Response(
              {
                  "id": network.id,
                  "name": network.name,
                  "query": network.query,
                  "score_parameter": network.score_parameter,
                  "category_array": network.category_array,
                  **result,
              }
          )

      def delete(self, request, pk: int):
          network = self._get_owned_network(request, pk)
          network.delete()
          return Response(status=204)
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add backend/interactions/views.py
  git commit -m "feat: add SavedNetworkListView and SavedNetworkDetailView"
  ```

---

## Task 5: Backend URLs

**Files:**
- Modify: `backend/interactions/urls.py`

- [ ] **Step 1: Register the new views**

  Replace the contents of `backend/interactions/urls.py` with:

  ```python
  from django.urls import path
  from .views import (
      HomeNetworkView,
      InteractionCategoryListView,
      SearchView,
      SearchInteractorsView,
      SavedNetworkListView,
      SavedNetworkDetailView,
  )

  urlpatterns = [
      path("interactions/categories", InteractionCategoryListView.as_view()),
      path("home/network", HomeNetworkView.as_view()),
      path("search", SearchView.as_view()),
      path("search/interactors", SearchInteractorsView.as_view()),
      path("networks", SavedNetworkListView.as_view()),
      path("networks/<int:pk>", SavedNetworkDetailView.as_view()),
  ]
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add backend/interactions/urls.py
  git commit -m "feat: register /networks and /networks/<pk> endpoints"
  ```

---

## Task 6: Backend tests

**Files:**
- Create: `backend/interactions/tests/test_networks.py`

- [ ] **Step 1: Write the test file**

  ```python
  # backend/interactions/tests/test_networks.py
  import pytest
  from core.models import UserInteractionNetwork
  from interactions.models import (
      InteractionNetwork,
      InteractionInteractionNetworks,
  )
  from interactions.tests.factories import InteractionFactory
  from proteins.tests.factories import (
      IdentifierFactory,
      ProteinFactory,
      ProteinIdentifierFactory,
  )


  def _make_protein(gene_name: str):
      p = ProteinFactory(gene_name=gene_name)
      id_ = IdentifierFactory(identifier=gene_name, naming_convention="gene_name")
      ProteinIdentifierFactory(protein=p, identifier=id_)
      return p


  # ── Save (POST /networks) ─────────────────────────────────────────────────────

  @pytest.mark.django_db
  def test_save_network_creates_db_rows(user_auth_client, regular_user):
      p1 = _make_protein("TP53")
      p2 = _make_protein("MDM2")
      ix = InteractionFactory(interactor_A=p1, interactor_B=p2, removed="0")

      resp = user_auth_client.post(
          "/api/networks",
          {
              "name": "Test Network",
              "query": "TP53",
              "score_parameter": "0.50",
              "category_array": "Published",
              "tissue_expression_array": "",
              "interaction_ids": [ix.id],
          },
          format="json",
      )

      assert resp.status_code == 201
      data = resp.json()
      assert data["name"] == "Test Network"
      assert data["interaction_count"] == 1
      assert InteractionNetwork.objects.count() == 1
      assert InteractionInteractionNetworks.objects.count() == 1
      assert UserInteractionNetwork.objects.filter(user=regular_user).count() == 1


  @pytest.mark.django_db
  def test_save_network_requires_auth(api_client):
      resp = api_client.post(
          "/api/networks",
          {
              "name": "Test",
              "query": "TP53",
              "score_parameter": "0.0",
              "category_array": "",
              "tissue_expression_array": "",
              "interaction_ids": [1],
          },
          format="json",
      )
      assert resp.status_code == 401


  @pytest.mark.django_db
  def test_save_network_rejects_empty_interaction_ids(user_auth_client):
      resp = user_auth_client.post(
          "/api/networks",
          {
              "name": "Test",
              "query": "TP53",
              "score_parameter": "0.0",
              "category_array": "",
              "tissue_expression_array": "",
              "interaction_ids": [],
          },
          format="json",
      )
      assert resp.status_code == 400


  # ── List (GET /networks) ──────────────────────────────────────────────────────

  @pytest.mark.django_db
  def test_list_networks_returns_only_own(user_auth_client, regular_user, admin_user):
      my_net = InteractionNetwork.objects.create(name="My Net", query="TP53")
      UserInteractionNetwork.objects.create(
          user=regular_user, interaction_network=my_net
      )
      other_net = InteractionNetwork.objects.create(name="Other Net", query="BRCA1")
      UserInteractionNetwork.objects.create(
          user=admin_user, interaction_network=other_net
      )

      resp = user_auth_client.get("/api/networks")
      assert resp.status_code == 200
      data = resp.json()
      assert len(data) == 1
      assert data[0]["name"] == "My Net"
      assert "interaction_count" in data[0]
      assert "created_at" in data[0]


  @pytest.mark.django_db
  def test_list_networks_requires_auth(api_client):
      resp = api_client.get("/api/networks")
      assert resp.status_code == 401


  # ── Load (GET /networks/<pk>) ─────────────────────────────────────────────────

  @pytest.mark.django_db
  def test_load_network_returns_result_shape(user_auth_client, regular_user):
      p1 = _make_protein("TP53")
      p2 = _make_protein("MDM2")
      ix = InteractionFactory(interactor_A=p1, interactor_B=p2, removed="0")

      network = InteractionNetwork.objects.create(name="My Net", query="TP53")
      InteractionInteractionNetworks.objects.create(
          interaction_network=network, interaction=ix
      )
      UserInteractionNetwork.objects.create(
          user=regular_user, interaction_network=network
      )

      resp = user_auth_client.get(f"/api/networks/{network.id}")
      assert resp.status_code == 200
      data = resp.json()
      assert data["name"] == "My Net"
      assert data["query"] == "TP53"
      assert "all_proteins" in data
      assert "all_interactions" in data
      assert "query_protein_id_array" in data
      assert len(data["all_interactions"]) == 1
      assert len(data["all_proteins"]) == 2


  @pytest.mark.django_db
  def test_load_network_403_for_non_owner(user_auth_client, admin_user):
      network = InteractionNetwork.objects.create(name="Admin Net", query="TP53")
      UserInteractionNetwork.objects.create(
          user=admin_user, interaction_network=network
      )

      resp = user_auth_client.get(f"/api/networks/{network.id}")
      assert resp.status_code == 403


  @pytest.mark.django_db
  def test_load_network_404_for_missing(user_auth_client):
      resp = user_auth_client.get("/api/networks/99999")
      assert resp.status_code == 404


  # ── Delete (DELETE /networks/<pk>) ───────────────────────────────────────────

  @pytest.mark.django_db
  def test_delete_network_removes_all_rows(user_auth_client, regular_user):
      p1 = _make_protein("TP53")
      p2 = _make_protein("MDM2")
      ix = InteractionFactory(interactor_A=p1, interactor_B=p2, removed="0")
      network = InteractionNetwork.objects.create(name="My Net", query="TP53")
      InteractionInteractionNetworks.objects.create(
          interaction_network=network, interaction=ix
      )
      UserInteractionNetwork.objects.create(
          user=regular_user, interaction_network=network
      )

      resp = user_auth_client.delete(f"/api/networks/{network.id}")
      assert resp.status_code == 204
      assert InteractionNetwork.objects.count() == 0
      assert InteractionInteractionNetworks.objects.count() == 0
      assert UserInteractionNetwork.objects.count() == 0


  @pytest.mark.django_db
  def test_delete_network_403_for_non_owner(user_auth_client, admin_user):
      network = InteractionNetwork.objects.create(name="Admin Net", query="TP53")
      UserInteractionNetwork.objects.create(
          user=admin_user, interaction_network=network
      )

      resp = user_auth_client.delete(f"/api/networks/{network.id}")
      assert resp.status_code == 403
  ```

- [ ] **Step 2: Run tests — verify they pass**

  ```bash
  cd backend && pytest interactions/tests/test_networks.py -v
  ```

  Expected: all 10 tests PASS. If any fail, fix the implementation before proceeding.

- [ ] **Step 3: Run full backend suite to check for regressions**

  ```bash
  pytest --tb=short -q
  ```

  Expected: all tests pass.

- [ ] **Step 4: Lint**

  ```bash
  ruff check . && black --check .
  ```

  Fix any issues, then:

- [ ] **Step 5: Commit**

  ```bash
  git add backend/interactions/tests/test_networks.py
  git commit -m "test: add backend tests for save/load/delete interaction networks"
  ```

---

## Task 7: Frontend types + API hooks

**Files:**
- Modify: `frontend/src/types/api.ts`
- Create: `frontend/src/api/networks.ts`

- [ ] **Step 1: Add `SavedNetwork` type to api.ts**

  Append to the end of `frontend/src/types/api.ts`:

  ```typescript
  export interface SavedNetwork {
    id: number
    name: string
    query: string
    interaction_count: number
    created_at: string | null
  }
  ```

- [ ] **Step 2: Create `frontend/src/api/networks.ts`**

  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
  import { apiClient } from './client'
  import { useAuthStore } from '../store/authStore'
  import type { SavedNetwork } from '../types/api'

  export function useSavedNetworks() {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
    return useQuery<SavedNetwork[]>({
      queryKey: ['networks'],
      queryFn: () => apiClient.get('/networks').then((r) => r.data),
      enabled: isLoggedIn,
      staleTime: 60 * 1000,
    })
  }

  export function useSaveNetwork() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (body: {
        name: string
        query: string
        score_parameter: string
        category_array: string
        tissue_expression_array: string
        interaction_ids: number[]
      }) => apiClient.post('/networks', body).then((r) => r.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['networks'] })
      },
    })
  }

  export function useDeleteNetwork() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: number) =>
        apiClient.delete(`/networks/${id}`).then((r) => r.data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['networks'] })
      },
    })
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/types/api.ts frontend/src/api/networks.ts
  git commit -m "feat: add SavedNetwork type and useSavedNetworks/useSaveNetwork/useDeleteNetwork hooks"
  ```

---

## Task 8: MSW handler + register

**Files:**
- Create: `frontend/src/mocks/handlers/networks.ts`
- Modify: `frontend/src/mocks/handlers/index.ts`

- [ ] **Step 1: Create `frontend/src/mocks/handlers/networks.ts`**

  ```typescript
  import { http, HttpResponse } from 'msw'
  import type { SavedNetwork } from '../../types/api'

  let nextId = 1
  let store: SavedNetwork[] = []

  export function resetNetworkStore() {
    nextId = 1
    store = []
  }

  export const networksHandlers = [
    http.get('/api/networks', ({ request }) => {
      const auth = request.headers.get('Authorization')
      if (!auth) return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
      return HttpResponse.json([...store])
    }),

    http.post('/api/networks', async ({ request }) => {
      const auth = request.headers.get('Authorization')
      if (!auth) return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
      const body = (await request.json()) as {
        name: string
        query: string
        interaction_ids: number[]
      }
      const network: SavedNetwork = {
        id: nextId++,
        name: body.name,
        query: body.query,
        interaction_count: body.interaction_ids.length,
        created_at: new Date().toISOString(),
      }
      store.push(network)
      return HttpResponse.json(
        { id: network.id, name: network.name, interaction_count: network.interaction_count },
        { status: 201 }
      )
    }),

    http.delete('/api/networks/:id', ({ params, request }) => {
      const auth = request.headers.get('Authorization')
      if (!auth) return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 })
      const id = Number(params.id)
      const idx = store.findIndex((n) => n.id === id)
      if (idx === -1) return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
      store.splice(idx, 1)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
  ```

- [ ] **Step 2: Register in `frontend/src/mocks/handlers/index.ts`**

  ```typescript
  import { settingsHandlers } from './settings'
  import { announcementsHandlers } from './announcements'
  import { countsHandlers } from './counts'
  import { authHandlers } from './auth'
  import { searchHandlers } from './search'
  import { downloadHandlers } from './downloads'
  import { contactHandlers } from './contact'
  import { datasetHandlers } from './datasets'
  import { proteinHandlers } from './proteins'
  import { networksHandlers } from './networks'

  export const handlers = [
    ...settingsHandlers,
    ...announcementsHandlers,
    ...countsHandlers,
    ...authHandlers,
    ...searchHandlers,
    ...downloadHandlers,
    ...contactHandlers,
    ...datasetHandlers,
    ...proteinHandlers,
    ...networksHandlers,
  ]
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/mocks/handlers/networks.ts frontend/src/mocks/handlers/index.ts
  git commit -m "feat: add MSW networks handler"
  ```

---

## Task 9: Frontend hook tests

**Files:**
- Create: `frontend/src/api/networks.test.ts`

- [ ] **Step 1: Create the test file**

  The existing test pattern (see `frontend/src/api/settings.test.ts`) uses an inline `wrapper` function with `QueryClientProvider`. Auth is handled by setting `localStorage` directly because `apiClient` reads `openpip_access_token` from `localStorage`.

  ```typescript
  // frontend/src/api/networks.test.ts
  import { describe, it, expect, beforeEach, afterEach } from 'vitest'
  import { renderHook, waitFor, act } from '@testing-library/react'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { createElement } from 'react'
  import { useAuthStore } from '../store/authStore'
  import { resetNetworkStore } from '../mocks/handlers/networks'
  import { useSavedNetworks, useSaveNetwork, useDeleteNetwork } from './networks'

  function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return createElement(QueryClientProvider, { client: qc }, children)
  }

  const SAVE_BODY = {
    name: 'Test Net',
    query: 'TP53',
    score_parameter: '0.50',
    category_array: 'Published',
    tissue_expression_array: '',
    interaction_ids: [1, 2, 3],
  }

  beforeEach(() => {
    resetNetworkStore()
    localStorage.setItem('openpip_access_token', 'mock-token')
    useAuthStore.setState({ isLoggedIn: true, token: 'mock-token' })
  })

  afterEach(() => {
    localStorage.removeItem('openpip_access_token')
    useAuthStore.setState({ isLoggedIn: false, token: null, refreshToken: null, isAdmin: false })
  })

  describe('useSavedNetworks', () => {
    it('returns empty array when no networks saved', async () => {
      const { result } = renderHook(() => useSavedNetworks(), { wrapper })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })

    it('is disabled when not authenticated', () => {
      useAuthStore.setState({ isLoggedIn: false, token: null })
      const { result } = renderHook(() => useSavedNetworks(), { wrapper })
      expect(result.current.fetchStatus).toBe('idle')
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useSaveNetwork', () => {
    it('posts to /networks and returns id + interaction_count', async () => {
      const { result } = renderHook(() => useSaveNetwork(), { wrapper })
      await act(async () => {
        await result.current.mutateAsync(SAVE_BODY)
      })
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.data).toMatchObject({
        name: 'Test Net',
        interaction_count: 3,
      })
    })
  })

  describe('useDeleteNetwork', () => {
    it('deletes by id', async () => {
      // First save a network
      const saveHook = renderHook(() => useSaveNetwork(), { wrapper })
      await act(async () => {
        await saveHook.result.current.mutateAsync(SAVE_BODY)
      })
      const savedId = (saveHook.result.current.data as { id: number }).id

      // Then delete it
      const { result } = renderHook(() => useDeleteNetwork(), { wrapper })
      await act(async () => {
        await result.current.mutateAsync(savedId)
      })
      expect(result.current.isSuccess).toBe(true)
    })
  })
  ```

- [ ] **Step 2: Run the tests**

  ```bash
  cd frontend && npm run test -- networks.test
  ```

  Expected: all 4 tests pass.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/api/networks.test.ts
  git commit -m "test: add useSavedNetworks/useSaveNetwork/useDeleteNetwork hook tests"
  ```

---

## Task 10: SearchResultsPage — pass visibleInteractionIds to SearchSidebar

**Files:**
- Modify: `frontend/src/features/search/SearchResultsPage.tsx`

- [ ] **Step 1: Compute `visibleInteractionIds` and pass to sidebar**

  In `SearchResultsPage.tsx`, the `interactions` variable (line ~185) already holds the post-filter set.
  Compute the IDs and pass them as a new prop to `SearchSidebar`.

  Find the line:
  ```tsx
  const { proteins: filteredProteins, interactions } = filterProteinsAndInteractions(
  ```

  After that block (after the `proteins` variable), add:
  ```tsx
  const visibleInteractionIds = interactions.map((ix) => ix.interaction_id)
  ```

  Then update the sidebar render (find `<SearchSidebar key={term} term={term} />`):
  ```tsx
  <SearchSidebar key={term} term={term} visibleInteractionIds={visibleInteractionIds} />
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add frontend/src/features/search/SearchResultsPage.tsx
  git commit -m "feat: compute visibleInteractionIds and pass to SearchSidebar"
  ```

---

## Task 11: SearchSidebar — Save Network button

**Files:**
- Modify: `frontend/src/features/search/SearchSidebar.tsx`

- [ ] **Step 1: Add imports at the top of SearchSidebar.tsx**

  After the existing imports, add:

  ```typescript
  import { useSaveNetwork } from '../../api/networks'
  ```

- [ ] **Step 2: Update `SearchSidebarProps` to accept `visibleInteractionIds`**

  Replace:
  ```typescript
  interface SearchSidebarProps {
    term: string
  }
  ```
  With:
  ```typescript
  interface SearchSidebarProps {
    term: string
    visibleInteractionIds: number[]
  }
  ```

- [ ] **Step 3: Update function signature and add save state**

  Replace:
  ```typescript
  export function SearchSidebar({ term }: SearchSidebarProps) {
  ```
  With:
  ```typescript
  export function SearchSidebar({ term, visibleInteractionIds }: SearchSidebarProps) {
  ```

  After the existing `const isLoggedIn = useAuthStore(...)` line, add:

  ```typescript
  const { mutateAsync: saveNetwork, isPending: isSaving } = useSaveNetwork()
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState(term)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  async function handleSaveNetwork() {
    setSaveError('')
    if (!saveName.trim()) {
      setSaveError('Name is required')
      return
    }
    try {
      const activeCategories = Object.entries(categoryFilter)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(',')
      await saveNetwork({
        name: saveName.trim(),
        query: term,
        score_parameter: scoreFilter.toFixed(2),
        category_array: activeCategories,
        tissue_expression_array: '',
        interaction_ids: visibleInteractionIds,
      })
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveOpen(false)
        setSaveName(term)
        setSaveSuccess(false)
      }, 1500)
    } catch {
      setSaveError('Failed to save. Try again.')
    }
  }
  ```

- [ ] **Step 4: Add the Save button inside the `{term && (...)}` block**

  Find the closing `</div>` of the Tools section (line ~416 — the one that closes `<div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>`).

  Insert before that closing `</div>`:

  ```tsx
  {isLoggedIn && (
    <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
      {!saveOpen ? (
        <button
          type="button"
          onClick={() => { setSaveOpen(true); setSaveName(term) }}
          className="op-btn"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '7px' }}
        >
          Save Network
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            className="op-input"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Network name"
            style={{ fontSize: 12 }}
            autoFocus
          />
          {saveError && (
            <div style={{ fontSize: 11, color: 'var(--warn)' }}>{saveError}</div>
          )}
          {saveSuccess && (
            <div style={{ fontSize: 11, color: 'var(--success, #22c55e)' }}>Saved!</div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => { setSaveOpen(false); setSaveError(''); setSaveSuccess(false) }}
              className="op-btn"
              style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNetwork}
              disabled={isSaving || visibleInteractionIds.length === 0}
              className="op-btn primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: 11, padding: '6px' }}
            >
              {isSaving ? '…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )}
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/features/search/SearchSidebar.tsx
  git commit -m "feat: add Save Network button to SearchSidebar"
  ```

---

## Task 12: ProfilePage — Saved Networks card

**Files:**
- Modify: `frontend/src/features/auth/ProfilePage.tsx`

- [ ] **Step 1: Add imports**

  After the existing imports at the top of `ProfilePage.tsx`, add:

  ```typescript
  import { useNavigate } from 'react-router-dom'
  import { useSavedNetworks, useDeleteNetwork } from '../../api/networks'
  ```

  (Note: `useNavigate` is already imported — only add what's missing.)

- [ ] **Step 2: Add hooks inside `ProfilePage`**

  After `const { mutate: logout, isPending } = useLogout()`, add:

  ```typescript
  const { data: networks, isLoading: networksLoading } = useSavedNetworks()
  const { mutate: deleteNetwork } = useDeleteNetwork()
  ```

- [ ] **Step 3: Insert the Saved Networks card**

  Insert a new card between the Account card (closing `</div>` at line ~93) and the Admin Settings section. Place it directly after the Account card's closing `</div>`:

  ```tsx
  {/* Saved Networks */}
  <div className="op-card" style={{ padding: 28, marginBottom: 20 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        marginBottom: 16,
      }}
    >
      Saved Networks
    </div>

    {networksLoading ? (
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
    ) : !networks || networks.length === 0 ? (
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No saved networks yet.</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {networks.map((net) => (
          <div
            key={net.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                {net.name}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  className="op-chip"
                  style={{ fontFamily: 'var(--mono)', fontSize: 11 }}
                >
                  {net.query}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {net.interaction_count} interactions
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/search/${encodeURIComponent(net.query)}`)}
              className="op-btn"
              style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}
            >
              Load
            </button>
            <button
              onClick={() => deleteNetwork(net.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 16,
                lineHeight: 1,
                padding: '4px',
                flexShrink: 0,
              }}
              aria-label={`Delete ${net.name}`}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/features/auth/ProfilePage.tsx
  git commit -m "feat: add Saved Networks card to ProfilePage"
  ```

---

## Task 13: Final verification

- [ ] **Step 1: Run full frontend test suite**

  ```bash
  cd frontend && npm run test
  ```

  Expected: all tests pass.

- [ ] **Step 2: Run frontend lint**

  ```bash
  npm run lint
  ```

  Fix any errors before proceeding.

- [ ] **Step 3: Run frontend build**

  ```bash
  npm run build
  ```

  Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Run full backend test suite**

  ```bash
  cd backend && pytest --tb=short -q
  ```

  Expected: all tests pass.

- [ ] **Step 5: Run backend lint**

  ```bash
  ruff check . && black --check .
  ```

  Fix any issues.

- [ ] **Step 6: Final commit (if any lint fixes needed)**

  ```bash
  git add -p && git commit -m "chore: lint fixes for save/load networks"
  ```
