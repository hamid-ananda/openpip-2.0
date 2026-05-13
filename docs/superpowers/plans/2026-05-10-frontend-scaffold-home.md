# openPIP 2.0 Frontend — Plan 1: Scaffold + Infrastructure + Home Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the React + TypeScript + Vite frontend with Tailwind CSS, MSW mocks, a typed API layer, ThemeProvider (CSS custom properties), shared layout components, and a fully functional Home page that matches legacy openpip.usask.ca.

**Architecture:** Vite SPA served from `frontend/`. All API calls go through TanStack Query hooks; MSW intercepts them in dev and test. ThemeProvider fetches `/api/settings` on mount and injects CSS custom properties into `:root` — every component reads dynamic colors via `var(--color-main)` etc. Auth state lives in a Zustand store backed by `localStorage` JWT. React Router v7 with `createBrowserRouter`.

**Tech Stack:** React 18, TypeScript 5, Vite, Tailwind CSS v4, TanStack Query v5, Zustand v4, React Router v7, MSW v2, axios, vitest + React Testing Library, react-cytoscapejs, @tsparticles/react v3

---

## Scope note

The frontend has three independent subsystems. This plan covers **subsystem 1** only:

| Plan | Subsystem | Depends on |
|------|-----------|------------|
| **Plan 1 (this)** | Scaffold + Infrastructure + Home Page | nothing |
| Plan 2 | Search Results Page | Plan 1 |
| Plan 3 | Admin Settings + Auth + Static Pages | Plan 1 |

---

## File Structure

All paths relative to `frontend/`.

**Config & entry:**
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `.env.development`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`

**Types:**
- `src/types/api.ts` — AdminSettings, Protein, Interaction, Announcement, Counts, DatasetRef, CategoryEntry
- `src/types/search.ts` — SearchResult, QueryParameters, FilterState

**Lib:**
- `src/lib/theme.ts` — `injectCSSVars(settings: AdminSettings): void`

**Stores:**
- `src/store/authStore.ts` — isLoggedIn, isAdmin, token, login(), logout()

**API:**
- `src/api/client.ts` — axios instance with Bearer token interceptor
- `src/api/settings.ts` — `useSettings()`
- `src/api/announcements.ts` — `useAnnouncements()`
- `src/api/counts.ts` — `useCounts()`
- `src/api/proteins.ts` — `useAutocomplete(q)`
- `src/api/auth.ts` — `useLogin()`, `useLogout()`

**MSW:**
- `src/mocks/browser.ts` — MSW worker (browser)
- `src/mocks/server.ts` — MSW server (vitest)
- `src/mocks/fixtures/settings.ts`
- `src/mocks/fixtures/announcements.ts`
- `src/mocks/fixtures/counts.ts`
- `src/mocks/handlers/settings.ts`
- `src/mocks/handlers/announcements.ts`
- `src/mocks/handlers/counts.ts`
- `src/mocks/handlers/auth.ts`
- `src/mocks/handlers/index.ts`
- `src/test/setup.ts` — vitest global setup

**Shared components:**
- `src/components/ThemeProvider.tsx`
- `src/components/Layout.tsx`
- `src/components/TopBar.tsx`
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`

**Home feature:**
- `src/features/home/HomePage.tsx`
- `src/features/home/HeroSection.tsx`
- `src/features/home/ParticleBackground.tsx`
- `src/features/home/StatsCounter.tsx`
- `src/features/home/MissionSection.tsx`
- `src/features/home/MiniNetworkGraph.tsx`
- `src/features/home/AnnouncementsList.tsx`
- `src/features/home/ImageCarousel.tsx`
- `src/features/home/MethodsSection.tsx`

**Route stubs** (placeholder pages wired into the router — built out in Plans 2 & 3):
- `src/features/search/SearchResultsPage.tsx`
- `src/features/admin/AdminSettingsPage.tsx`
- `src/features/admin/AdminRoute.tsx`
- `src/features/auth/LoginPage.tsx`
- `src/features/auth/RegisterPage.tsx`
- `src/features/auth/ProfilePage.tsx`
- `src/features/static/DownloadPage.tsx`
- `src/features/static/AboutPage.tsx`
- `src/features/static/FAQPage.tsx`
- `src/features/static/ContactPage.tsx`
- `src/features/static/DocumentationPage.tsx`

---

## Task 1: Scaffold Vite Project + Install Dependencies

**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/index.css`, `.env.development`

- [ ] **Step 1: Initialize Vite inside the existing frontend/ directory**

```bash
cd ~/openpip-2.0/frontend
npm create vite@latest . -- --template react-ts
# Prompt: "Current directory is not empty. Remove existing files and continue?"
# → Choose: "Ignore files and continue"
```

Expected: Vite scaffold files created alongside existing CLAUDE.md and FRONTEND_DOCUMENTATION.md.

- [ ] **Step 2: Install all dependencies**

```bash
cd ~/openpip-2.0/frontend
npm install

# Routing, data fetching, state
npm install react-router-dom @tanstack/react-query zustand

# Network viz
npm install cytoscape react-cytoscapejs cytoscape-cola cytoscape-expand-collapse cytoscape-panzoom
npm install @types/cytoscape

# Particles
npm install @tsparticles/react @tsparticles/slim

# Slider + table
npm install rc-slider @tanstack/react-table

# HTTP
npm install axios

# Tailwind v4
npm install tailwindcss @tailwindcss/vite

# Mocks (dev only)
npm install --save-dev msw

# Testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Replace vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
```

- [ ] **Step 4: Update tsconfig.json to include vitest globals**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Replace src/index.css**

```css
/* src/index.css */
@import "tailwindcss";

/* Default color values — overwritten at runtime by ThemeProvider */
:root {
  --color-main: #a51c30;
  --color-header: #ffffff;
  --color-logo: #ffffff;
  --color-button: #a51c30;
  --color-query-node: #cc0000;
  --color-interactor-node: #3c78d8;
  --color-edge-published: #38761d;
  --color-edge-validated: #1155cc;
  --color-edge-verified: #cc0000;
  --color-edge-literature: #ff9900;
  --color-edge-mixed: #ff55dd;
}

body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

- [ ] **Step 6: Create .env.development**

```
VITE_API_BASE_URL=http://localhost:8000/api
```

- [ ] **Step 7: Verify scaffold runs**

```bash
npm run dev
```

Open http://localhost:5173. Expected: default Vite + React page loads without errors.

- [ ] **Step 8: Commit**

```bash
cd ~/openpip-2.0
git add frontend/
git commit -m "feat: scaffold Vite + React + TypeScript + Tailwind v4 frontend"
```

---

## Task 2: Set Up MSW (Mock Service Worker)

**Files:** `src/mocks/browser.ts`, `src/mocks/server.ts`, `src/mocks/handlers/index.ts`, `src/test/setup.ts`
Modified: `src/main.tsx`

- [ ] **Step 1: Generate the service worker file**

```bash
cd ~/openpip-2.0/frontend
npx msw init public/ --save
```

Expected: `public/mockServiceWorker.js` created. `package.json` gains `"msw": { "workerDirectory": ["public"] }`.

- [ ] **Step 2: Create placeholder handlers index**

```typescript
// src/mocks/handlers/index.ts
export const handlers: any[] = []
```

- [ ] **Step 3: Create MSW browser worker**

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers/index'

export const worker = setupWorker(...handlers)
```

- [ ] **Step 4: Create MSW server for vitest**

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers/index'

export const server = setupServer(...handlers)
```

- [ ] **Step 5: Create vitest setup file**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 6: Wire MSW into main.tsx (dev only)**

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function prepare() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
```

- [ ] **Step 7: Write smoke test**

```typescript
// src/mocks/handlers/index.test.ts
import { describe, it, expect } from 'vitest'
import { handlers } from './index'

describe('MSW handlers', () => {
  it('exports an array', () => {
    expect(Array.isArray(handlers)).toBe(true)
  })
})
```

- [ ] **Step 8: Run tests**

```bash
npm run test
```

Expected: 1 test PASS.

- [ ] **Step 9: Commit**

```bash
cd ~/openpip-2.0
git add frontend/
git commit -m "feat: wire MSW for dev and test environments"
```

---

## Task 3: TypeScript Types

**Files:** `src/types/api.ts`, `src/types/search.ts`, `src/types/api.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/types/api.test.ts
import { describe, it, expect } from 'vitest'
import type { AdminSettings } from './api'

describe('Types compile', () => {
  it('AdminSettings shape is correct', () => {
    const s: AdminSettings = {
      title: 'openPIP',
      shortTitle: 'HuRI',
      footer: '<p>Footer</p>',
      homePage: '',
      missionTitle: 'Mission',
      missionText: 'Text',
      methodTitle: 'Methods',
      methodText: 'Text',
      mainColorScheme: '#a51c30',
      headerColorScheme: '#ffffff',
      logoColorScheme: '#ffffff',
      buttonColorScheme: '#a51c30',
      queryNodeColor: '#cc0000',
      interactorNodeColor: '#3c78d8',
      publishedEdgeColor: '#38761d',
      validatedEdgeColor: '#1155cc',
      verifiedEdgeColor: '#cc0000',
      literatureEdgeColor: '#ff9900',
      url: 'https://openpip.usask.ca/',
      version: '1.0',
    }
    expect(s.shortTitle).toBe('HuRI')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/types/api.test.ts
```

Expected: FAIL — cannot find module `./api`.

- [ ] **Step 3: Create src/types/api.ts**

```typescript
// src/types/api.ts

export interface AdminSettings {
  title: string
  shortTitle: string
  footer: string
  homePage: string
  missionTitle: string
  missionText: string
  methodTitle: string
  methodText: string
  mainColorScheme: string
  headerColorScheme: string
  logoColorScheme: string
  buttonColorScheme: string
  queryNodeColor: string
  interactorNodeColor: string
  publishedEdgeColor: string
  validatedEdgeColor: string
  verifiedEdgeColor: string
  literatureEdgeColor: string
  url: string
  version: string
}

export interface Announcement {
  id: number
  title: string
  text: string
  date: string | null
  showOnHomePage: boolean
}

export interface Counts {
  proteins: number
  interactions: number
}

export interface DatasetRef {
  dataset_reference: string
  dataset_author: string
  year: string
  description: string
  interaction_status: string
  name: string
}

export interface CategoryEntry {
  category_name: string
  order: number
}

export interface Protein {
  protein_id: number
  protein_uniprot_id: string
  protein_ensembl_id: string
  protein_entrez_id: string
  protein_gene_name: string
  protein_protein_name: string
  protein_description: string
  protein_sequence: string
  number_of_interactions_in_database: number
  annotation_array: Record<string, string>
  tissue_expression_array: Record<string, unknown>
  subcellular_location_expression_array: Record<string, unknown>
}

export interface Interaction {
  interaction_id: number
  interactor_A: {
    protein_id: number
    protein_uniprot_id: string
    protein_gene_name: string
    protein_ensembl_id: string
  }
  interactor_B: {
    protein_id: number
    protein_uniprot_id: string
    protein_gene_name: string
    protein_ensembl_id: string
  }
  score: number | null
  annotation_array: Record<string, string[]>
  experiment_array: unknown[]
  dataset_array: DatasetRef[]
  interaction_category_array: {
    highest_category_status: string
    highest_order: number
    interaction_category_array: CategoryEntry[]
  }
}
```

- [ ] **Step 4: Create src/types/search.ts**

```typescript
// src/types/search.ts
import type { Protein, Interaction } from './api'

export interface SearchResult {
  all_proteins: Protein[]
  all_interactions: Interaction[]
  domains: string
  complexes: string
  query_protein_id_array: number[]
  search_term: string
  found_protein_summary: string
  unfound_protein_summary: string
}

export interface QueryParameters {
  searchTerm: string
  searchTermArray: string[]
  filterParameter: 'None' | 'query_query' | 'query_interactor'
  scoreParameter: number
  categoryFilter: Record<string, boolean>
  annotationFilter: Record<string, boolean>
  textOutput: string | null
}

export interface FilterState {
  scoreFilter: number
  categoryFilter: Record<string, boolean>
  annotationFilter: Record<string, boolean>
  filterMode: 'None' | 'query_query' | 'query_interactor'
  tissueExpressionActive: boolean
  tissueSpecificityActive: boolean
}
```

- [ ] **Step 5: Run test and typecheck**

```bash
npm run test -- src/types/api.test.ts
npx tsc --noEmit
```

Expected: 1 test PASS, 0 TypeScript errors.

- [ ] **Step 6: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/types/
git commit -m "feat: add TypeScript types for API responses and search state"
```

---

## Task 4: MSW Fixtures + Handlers + API Hooks

**Files:** fixtures (3), handlers (4 + index), API hooks (5)

- [ ] **Step 1: Write failing tests for the two most critical hooks**

```typescript
// src/api/settings.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { useSettings } from './settings'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useSettings', () => {
  it('returns admin settings from MSW', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.shortTitle).toBe('HuRI')
  })
})
```

```typescript
// src/api/counts.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { useCounts } from './counts'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCounts', () => {
  it('returns protein and interaction counts from MSW', async () => {
    const { result } = renderHook(() => useCounts(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.proteins).toBeGreaterThan(0)
    expect(result.current.data?.interactions).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test -- src/api/settings.test.ts src/api/counts.test.ts
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Create fixtures**

```typescript
// src/mocks/fixtures/settings.ts
import type { AdminSettings } from '../../types/api'

export const settingsFixture: AdminSettings = {
  title: 'openPIP — Protein Interaction Portal',
  shortTitle: 'HuRI',
  footer: '<p>© 2026 openPIP. All rights reserved.</p>',
  homePage: '',
  missionTitle: '<h4>Our Mission</h4>',
  missionText: '<p>openPIP provides a curated map of human protein–protein interactions.</p>',
  methodTitle: '<h4>Methods</h4>',
  methodText: '<p>Interactions are sourced from published experimental datasets.</p>',
  mainColorScheme: '#a51c30',
  headerColorScheme: '#ffffff',
  logoColorScheme: '#ffffff',
  buttonColorScheme: '#a51c30',
  queryNodeColor: '#cc0000',
  interactorNodeColor: '#3c78d8',
  publishedEdgeColor: '#38761d',
  validatedEdgeColor: '#1155cc',
  verifiedEdgeColor: '#cc0000',
  literatureEdgeColor: '#ff9900',
  url: 'http://localhost:5173/',
  version: '2.0',
}
```

```typescript
// src/mocks/fixtures/announcements.ts
import type { Announcement } from '../../types/api'

export const announcementsFixture: Announcement[] = [
  {
    id: 1,
    title: 'Welcome to openPIP 2.0',
    text: '<p>We have launched the new version of the portal.</p>',
    date: '2026-05-01',
    showOnHomePage: true,
  },
  {
    id: 2,
    title: 'New dataset added',
    text: '<p>HuRI 2026 dataset is now available for download.</p>',
    date: '2026-04-15',
    showOnHomePage: true,
  },
]
```

```typescript
// src/mocks/fixtures/counts.ts
import type { Counts } from '../../types/api'

export const countsFixture: Counts = {
  proteins: 8275,
  interactions: 52569,
}
```

- [ ] **Step 4: Create MSW handlers**

```typescript
// src/mocks/handlers/settings.ts
import { http, HttpResponse } from 'msw'
import { settingsFixture } from '../fixtures/settings'

export const settingsHandlers = [
  http.get('/api/settings', () => HttpResponse.json(settingsFixture)),
]
```

```typescript
// src/mocks/handlers/announcements.ts
import { http, HttpResponse } from 'msw'
import { announcementsFixture } from '../fixtures/announcements'

export const announcementsHandlers = [
  http.get('/api/announcements', () => HttpResponse.json(announcementsFixture)),
]
```

```typescript
// src/mocks/handlers/counts.ts
import { http, HttpResponse } from 'msw'
import { countsFixture } from '../fixtures/counts'

export const countsHandlers = [
  http.get('/api/counts', () => HttpResponse.json(countsFixture)),
]
```

```typescript
// src/mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string }
    if (body.username === 'admin' && body.password === 'admin') {
      return HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token', is_admin: true })
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),
  http.post('/api/auth/logout', () => HttpResponse.json({ detail: 'Logged out' })),
]
```

```typescript
// src/mocks/handlers/index.ts
import { settingsHandlers } from './settings'
import { announcementsHandlers } from './announcements'
import { countsHandlers } from './counts'
import { authHandlers } from './auth'

export const handlers = [
  ...settingsHandlers,
  ...announcementsHandlers,
  ...countsHandlers,
  ...authHandlers,
]
```

- [ ] **Step 5: Create API client**

```typescript
// src/api/client.ts
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const apiClient = axios.create({ baseURL: BASE_URL })

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('openpip_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

- [ ] **Step 6: Create API hooks**

```typescript
// src/api/settings.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { AdminSettings } from '../types/api'

export function useSettings() {
  return useQuery<AdminSettings>({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
```

```typescript
// src/api/announcements.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Announcement } from '../types/api'

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => apiClient.get('/announcements').then((r) => r.data),
    staleTime: 60 * 1000,
  })
}
```

```typescript
// src/api/counts.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Counts } from '../types/api'

export function useCounts() {
  return useQuery<Counts>({
    queryKey: ['counts'],
    queryFn: () => apiClient.get('/counts').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
```

```typescript
// src/api/auth.ts
import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      apiClient.post('/auth/login', body).then((r) => r.data),
    onSuccess: (data) => login(data.access, data.is_admin),
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout').then((r) => r.data),
    onSuccess: () => logout(),
  })
}
```

```typescript
// src/api/proteins.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export function useAutocomplete(q: string) {
  return useQuery<string[]>({
    queryKey: ['autocomplete', q],
    queryFn: () => apiClient.get('/proteins/autocomplete', { params: { q } }).then((r) => r.data),
    enabled: q.length >= 2,
    staleTime: 60 * 1000,
  })
}
```

- [ ] **Step 7: Run tests**

```bash
npm run test -- src/api/settings.test.ts src/api/counts.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 8: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/mocks/ frontend/src/api/
git commit -m "feat: add MSW fixtures, handlers, and TanStack Query API hooks"
```

---

## Task 5: Auth Store (Zustand)

**Files:** `src/store/authStore.ts`, `src/store/authStore.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/store/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isLoggedIn: false, isAdmin: false, token: null })
  })

  it('starts logged out when localStorage is empty', () => {
    const state = useAuthStore.getState()
    expect(state.isLoggedIn).toBe(false)
    expect(state.isAdmin).toBe(false)
    expect(state.token).toBeNull()
  })

  it('login() sets token in state and localStorage', () => {
    useAuthStore.getState().login('tok123', false)
    expect(useAuthStore.getState().isLoggedIn).toBe(true)
    expect(useAuthStore.getState().token).toBe('tok123')
    expect(localStorage.getItem('openpip_access_token')).toBe('tok123')
  })

  it('login() with isAdmin=true sets isAdmin', () => {
    useAuthStore.getState().login('tok456', true)
    expect(useAuthStore.getState().isAdmin).toBe(true)
  })

  it('logout() clears state and localStorage', () => {
    useAuthStore.getState().login('tok123', true)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isLoggedIn).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem('openpip_access_token')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/store/authStore.test.ts
```

Expected: FAIL — cannot find module `./authStore`.

- [ ] **Step 3: Implement authStore**

```typescript
// src/store/authStore.ts
import { create } from 'zustand'

const TOKEN_KEY = 'openpip_access_token'

interface AuthState {
  isLoggedIn: boolean
  isAdmin: boolean
  token: string | null
  login: (token: string, isAdmin: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem(TOKEN_KEY),
  isAdmin: false,
  token: localStorage.getItem(TOKEN_KEY),
  login: (token, isAdmin) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ isLoggedIn: true, isAdmin, token })
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ isLoggedIn: false, isAdmin: false, token: null })
  },
}))
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- src/store/authStore.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/store/
git commit -m "feat: add Zustand auth store with localStorage JWT persistence"
```

---

## Task 6: ThemeProvider + CSS Variable Injection

**Files:** `src/lib/theme.ts`, `src/lib/theme.test.ts`, `src/components/ThemeProvider.tsx`, `src/components/ThemeProvider.test.tsx`

- [ ] **Step 1: Write failing tests for injectCSSVars**

```typescript
// src/lib/theme.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { injectCSSVars } from './theme'
import type { AdminSettings } from '../types/api'

const mockSettings: AdminSettings = {
  title: 'openPIP', shortTitle: 'HuRI', footer: '', homePage: '',
  missionTitle: '', missionText: '', methodTitle: '', methodText: '',
  mainColorScheme: '#a51c30',
  headerColorScheme: '#ffffff',
  logoColorScheme: '#cccccc',
  buttonColorScheme: '#a51c30',
  queryNodeColor: '#cc0000',
  interactorNodeColor: '#3c78d8',
  publishedEdgeColor: '#38761d',
  validatedEdgeColor: '#1155cc',
  verifiedEdgeColor: '#cc0000',
  literatureEdgeColor: '#ff9900',
  url: '', version: '2.0',
}

describe('injectCSSVars', () => {
  beforeEach(() => { document.documentElement.style.cssText = '' })

  it('sets --color-main on :root', () => {
    injectCSSVars(mockSettings)
    expect(document.documentElement.style.getPropertyValue('--color-main')).toBe('#a51c30')
  })

  it('sets --color-logo on :root', () => {
    injectCSSVars(mockSettings)
    expect(document.documentElement.style.getPropertyValue('--color-logo')).toBe('#cccccc')
  })

  it('sets all 11 CSS variables', () => {
    injectCSSVars(mockSettings)
    const vars = [
      '--color-main', '--color-header', '--color-logo', '--color-button',
      '--color-query-node', '--color-interactor-node',
      '--color-edge-published', '--color-edge-validated',
      '--color-edge-verified', '--color-edge-literature', '--color-edge-mixed',
    ]
    for (const v of vars) {
      expect(document.documentElement.style.getPropertyValue(v)).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/lib/theme.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement injectCSSVars**

```typescript
// src/lib/theme.ts
import type { AdminSettings } from '../types/api'

export function injectCSSVars(settings: AdminSettings): void {
  const root = document.documentElement
  root.style.setProperty('--color-main', settings.mainColorScheme)
  root.style.setProperty('--color-header', settings.headerColorScheme)
  root.style.setProperty('--color-logo', settings.logoColorScheme)
  root.style.setProperty('--color-button', settings.buttonColorScheme)
  root.style.setProperty('--color-query-node', settings.queryNodeColor)
  root.style.setProperty('--color-interactor-node', settings.interactorNodeColor)
  root.style.setProperty('--color-edge-published', settings.publishedEdgeColor)
  root.style.setProperty('--color-edge-validated', settings.validatedEdgeColor)
  root.style.setProperty('--color-edge-verified', settings.verifiedEdgeColor)
  root.style.setProperty('--color-edge-literature', settings.literatureEdgeColor)
  root.style.setProperty('--color-edge-mixed', '#ff55dd')
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- src/lib/theme.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Write failing ThemeProvider test**

```typescript
// src/components/ThemeProvider.test.tsx
import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { ThemeProvider } from './ThemeProvider'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('ThemeProvider', () => {
  it('injects CSS variables after fetching settings', async () => {
    render(
      <ThemeProvider>
        <div data-testid="child">hello</div>
      </ThemeProvider>,
      { wrapper }
    )
    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--color-main')).toBe('#a51c30')
    })
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npm run test -- src/components/ThemeProvider.test.tsx
```

Expected: FAIL.

- [ ] **Step 7: Implement ThemeProvider**

```typescript
// src/components/ThemeProvider.tsx
import { createContext, useContext, useEffect } from 'react'
import { useSettings } from '../api/settings'
import { injectCSSVars } from '../lib/theme'
import type { AdminSettings } from '../types/api'

const ThemeContext = createContext<AdminSettings | null>(null)

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: settings } = useSettings()

  useEffect(() => {
    if (settings) injectCSSVars(settings)
  }, [settings])

  return (
    <ThemeContext.Provider value={settings ?? null}>
      {children}
    </ThemeContext.Provider>
  )
}
```

- [ ] **Step 8: Run all theme tests**

```bash
npm run test -- src/lib/theme.test.ts src/components/ThemeProvider.test.tsx
```

Expected: 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/lib/ frontend/src/components/ThemeProvider.tsx frontend/src/components/ThemeProvider.test.tsx
git commit -m "feat: add ThemeProvider with runtime CSS custom property injection"
```

---

## Task 7: Layout + TopBar + Footer

**Files:** `src/components/Layout.tsx`, `src/components/TopBar.tsx`, `src/components/Footer.tsx` and tests

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/Footer.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders raw HTML from admin_settings.footer', () => {
    render(<Footer html="<p>Footer content</p>" />)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('renders nothing visible when html is empty', () => {
    const { container } = render(<Footer html="" />)
    expect(container.querySelector('footer')).toBeInTheDocument()
  })
})
```

```typescript
// src/components/TopBar.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders the site short title', () => {
    render(<TopBar shortTitle="HuRI" />)
    expect(screen.getByText('HuRI')).toBeInTheDocument()
  })

  it('renders an SVG logo element', () => {
    const { container } = render(<TopBar shortTitle="HuRI" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/components/Footer.test.tsx src/components/TopBar.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Footer**

```typescript
// src/components/Footer.tsx
interface FooterProps {
  html: string
}

export function Footer({ html }: FooterProps) {
  return (
    <footer
      className="py-4 px-6 text-sm text-gray-600 border-t"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

- [ ] **Step 4: Implement TopBar**

The SVG logo is the 5-node protein interaction network from the legacy `base.html.twig`. Node and edge colors are `var(--color-logo)` so they update when ThemeProvider injects admin settings.

```typescript
// src/components/TopBar.tsx
interface TopBarProps {
  shortTitle: string
}

export function TopBar({ shortTitle }: TopBarProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-[var(--color-main)]">
      <svg width="48" height="48" viewBox="0 0 100 100" aria-label="openPIP protein network logo">
        <line x1="20" y1="50" x2="50" y2="20" stroke="var(--color-logo)" strokeWidth="3" />
        <line x1="50" y1="20" x2="80" y2="50" stroke="var(--color-logo)" strokeWidth="3" />
        <line x1="50" y1="20" x2="50" y2="80" stroke="var(--color-logo)" strokeWidth="3" />
        <circle cx="20" cy="50" r="10" fill="var(--color-logo)" />
        <circle cx="50" cy="20" r="10" fill="var(--color-logo)" />
        <circle cx="80" cy="50" r="10" fill="var(--color-logo)" />
        <circle cx="50" cy="80" r="10" fill="var(--color-logo)" />
        <circle cx="50" cy="50" r="10" fill="var(--color-logo)" />
      </svg>
      <span className="text-xl font-bold tracking-wide" style={{ color: 'var(--color-header)' }}>
        {shortTitle}
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Implement Layout**

```typescript
// src/components/Layout.tsx
import { Outlet } from 'react-router-dom'
import { useTheme } from './ThemeProvider'
import { TopBar } from './TopBar'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { useAuthStore } from '../store/authStore'

export function Layout() {
  const theme = useTheme()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const isAdmin = useAuthStore((s) => s.isAdmin)

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <TopBar shortTitle={theme?.shortTitle ?? 'openPIP'} />
        <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer html={theme?.footer ?? ''} />
    </div>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test -- src/components/Footer.test.tsx src/components/TopBar.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/components/Layout.tsx frontend/src/components/TopBar.tsx frontend/src/components/Footer.tsx
git add frontend/src/components/Footer.test.tsx frontend/src/components/TopBar.test.tsx
git commit -m "feat: add Layout, TopBar, and Footer components"
```

---

## Task 8: Navbar

**Files:** `src/components/Navbar.tsx`, `src/components/Navbar.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/Navbar.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { Navbar } from './Navbar'

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Navbar', () => {
  it('shows public links when logged out', () => {
    wrap(<Navbar isLoggedIn={false} isAdmin={false} />)
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /downloads/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
  })

  it('shows Profile and hides Login when logged in', () => {
    wrap(<Navbar isLoggedIn={true} isAdmin={false} />)
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument()
  })

  it('shows admin Settings link when isAdmin is true', () => {
    wrap(<Navbar isLoggedIn={true} isAdmin={true} />)
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('hides admin links for regular users', () => {
    wrap(<Navbar isLoggedIn={true} isAdmin={false} />)
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/components/Navbar.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement Navbar**

```typescript
// src/components/Navbar.tsx
import { NavLink } from 'react-router-dom'
import { useLogout } from '../api/auth'

interface NavbarProps {
  isLoggedIn: boolean
  isAdmin: boolean
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/download', label: 'Downloads' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

const adminLinks = [
  { to: '/admin/announcement', label: 'Announcements' },
  { to: '/admin/data', label: 'Data' },
  { to: '/admin/files', label: 'Files' },
  { to: '/admin/settings', label: 'Settings' },
]

export function Navbar({ isLoggedIn, isAdmin }: NavbarProps) {
  const logout = useLogout()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium transition-opacity ${isActive ? 'underline opacity-100' : 'opacity-80 hover:opacity-100'}`

  return (
    <nav
      className="flex items-center gap-1 px-4 py-1 flex-wrap"
      style={{ backgroundColor: 'var(--color-main)', color: 'var(--color-header)' }}
    >
      <div className="flex items-center gap-1 flex-1 flex-wrap">
        {publicLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}
            style={{ color: 'var(--color-header)' }}>
            {link.label}
          </NavLink>
        ))}
        {isAdmin && adminLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}
            style={{ color: 'var(--color-header)' }}>
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-1">
        {isLoggedIn ? (
          <>
            <NavLink to="/profile" className={linkClass} style={{ color: 'var(--color-header)' }}>
              Profile
            </NavLink>
            <button
              onClick={() => logout.mutate()}
              className="px-3 py-2 text-sm font-medium opacity-80 hover:opacity-100"
              style={{ color: 'var(--color-header)' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/register" className={linkClass} style={{ color: 'var(--color-header)' }}>
              Register
            </NavLink>
            <NavLink to="/login" className={linkClass} style={{ color: 'var(--color-header)' }}>
              Login
            </NavLink>
          </>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- src/components/Navbar.test.tsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/components/Navbar.tsx frontend/src/components/Navbar.test.tsx
git commit -m "feat: add Navbar with auth-conditional and admin-conditional links"
```

---

## Task 9: React Router + App.tsx + Route Stubs

**Files:** `src/App.tsx`, all stub page files

- [ ] **Step 1: Create all stub pages**

Create each of the following files exactly as shown:

```typescript
// src/features/search/SearchResultsPage.tsx
export function SearchResultsPage() {
  return <div className="p-8"><h1 className="text-2xl">Search Results — Plan 2</h1></div>
}
```

```typescript
// src/features/admin/AdminSettingsPage.tsx
export function AdminSettingsPage() {
  return <div className="p-8"><h1 className="text-2xl">Admin Settings — Plan 3</h1></div>
}
```

```typescript
// src/features/admin/AdminRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface AdminRouteProps { children: React.ReactNode }

export function AdminRoute({ children }: AdminRouteProps) {
  const isAdmin = useAuthStore((s) => s.isAdmin)
  if (!isAdmin) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

```typescript
// src/features/auth/LoginPage.tsx
export function LoginPage() {
  return <div className="p-8"><h1 className="text-2xl">Login — Plan 3</h1></div>
}
```

```typescript
// src/features/auth/RegisterPage.tsx
export function RegisterPage() {
  return <div className="p-8"><h1 className="text-2xl">Register — Plan 3</h1></div>
}
```

```typescript
// src/features/auth/ProfilePage.tsx
export function ProfilePage() {
  return <div className="p-8"><h1 className="text-2xl">Profile — Plan 3</h1></div>
}
```

```typescript
// src/features/static/DownloadPage.tsx
export function DownloadPage() {
  return <div className="p-8"><h1 className="text-2xl">Downloads — Plan 3</h1></div>
}
```

```typescript
// src/features/static/AboutPage.tsx
export function AboutPage() {
  return <div className="p-8"><h1 className="text-2xl">About — Plan 3</h1></div>
}
```

```typescript
// src/features/static/FAQPage.tsx
export function FAQPage() {
  return <div className="p-8"><h1 className="text-2xl">FAQ — Plan 3</h1></div>
}
```

```typescript
// src/features/static/ContactPage.tsx
export function ContactPage() {
  return <div className="p-8"><h1 className="text-2xl">Contact — Plan 3</h1></div>
}
```

```typescript
// src/features/static/DocumentationPage.tsx
export function DocumentationPage() {
  return <div className="p-8"><h1 className="text-2xl">Documentation — Plan 3</h1></div>
}
```

- [ ] **Step 2: Implement App.tsx**

```typescript
// src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { ThemeProvider } from './components/ThemeProvider'
import { HomePage } from './features/home/HomePage'
import { SearchResultsPage } from './features/search/SearchResultsPage'
import { AdminSettingsPage } from './features/admin/AdminSettingsPage'
import { AdminRoute } from './features/admin/AdminRoute'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { ProfilePage } from './features/auth/ProfilePage'
import { DownloadPage } from './features/static/DownloadPage'
import { AboutPage } from './features/static/AboutPage'
import { FAQPage } from './features/static/FAQPage'
import { ContactPage } from './features/static/ContactPage'
import { DocumentationPage } from './features/static/DocumentationPage'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Layout />
        </ThemeProvider>
      </QueryClientProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchResultsPage /> },
      { path: 'search/:term', element: <SearchResultsPage /> },
      { path: 'download', element: <DownloadPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'faq', element: <FAQPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'documentation', element: <DocumentationPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'admin/settings',
        element: <AdminRoute><AdminSettingsPage /></AdminRoute>,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 3: Verify the shell renders**

```bash
npm run dev
```

Open http://localhost:5173. Verify: red navbar renders, all nav links navigate without crashing, stub pages show their "Plan N" text.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/App.tsx frontend/src/features/
git commit -m "feat: add React Router with full route tree and placeholder pages"
```

---

## Task 10: Home Page — HeroSection + ParticleBackground + StatsCounter

**Files:** `src/features/home/ParticleBackground.tsx`, `src/features/home/StatsCounter.tsx`, `src/features/home/HeroSection.tsx`, `src/features/home/StatsCounter.test.tsx`, `src/features/home/HeroSection.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// src/features/home/StatsCounter.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsCounter } from './StatsCounter'

describe('StatsCounter', () => {
  it('displays formatted protein count', () => {
    render(<StatsCounter proteins={8275} interactions={52569} />)
    expect(screen.getByText('8,275')).toBeInTheDocument()
    expect(screen.getByText(/proteins/i)).toBeInTheDocument()
  })

  it('displays formatted interaction count', () => {
    render(<StatsCounter proteins={8275} interactions={52569} />)
    expect(screen.getByText('52,569')).toBeInTheDocument()
    expect(screen.getByText(/interactions/i)).toBeInTheDocument()
  })
})
```

```typescript
// src/features/home/HeroSection.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders the site short title', () => {
    render(
      <MemoryRouter>
        <HeroSection shortTitle="HuRI" proteins={8275} interactions={52569} />
      </MemoryRouter>
    )
    expect(screen.getByText('HuRI')).toBeInTheDocument()
  })

  it('renders the search input', () => {
    render(
      <MemoryRouter>
        <HeroSection shortTitle="HuRI" proteins={0} interactions={0} />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText(/gene names/i)).toBeInTheDocument()
  })

  it('renders the search button', () => {
    render(
      <MemoryRouter>
        <HeroSection shortTitle="HuRI" proteins={0} interactions={0} />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/features/home/StatsCounter.test.tsx src/features/home/HeroSection.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement ParticleBackground**

tsparticles v3 requires async engine initialization. Call `initParticlesEngine` once on mount.

```typescript
// src/features/home/ParticleBackground.tsx
import { useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

const PARTICLE_OPTIONS = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: '#ffffff' },
    opacity: { value: 0.3 },
    size: { value: { min: 1, max: 3 } },
    move: { enable: true, speed: 1, outModes: { default: 'bounce' as const } },
    links: { enable: true, color: '#ffffff', opacity: 0.2 },
  },
  detectRetina: true,
}

interface ParticleBackgroundProps {
  id: string
  className?: string
}

export function ParticleBackground({ id, className }: ParticleBackgroundProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  if (!ready) return null
  return <Particles id={id} className={className} options={PARTICLE_OPTIONS} />
}
```

- [ ] **Step 4: Implement StatsCounter**

```typescript
// src/features/home/StatsCounter.tsx
interface StatsCounterProps {
  proteins: number
  interactions: number
}

export function StatsCounter({ proteins, interactions }: StatsCounterProps) {
  return (
    <div className="flex gap-8 justify-center mt-4">
      <div className="text-center">
        <div className="text-4xl font-bold" style={{ color: 'var(--color-main)' }}>
          {proteins.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide mt-1">Proteins</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold" style={{ color: 'var(--color-main)' }}>
          {interactions.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 uppercase tracking-wide mt-1">Interactions</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement HeroSection with search bar**

The home page has a search input with autocomplete (typeahead). Submitting navigates to `/search/:term`.

```typescript
// src/features/home/HeroSection.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParticleBackground } from './ParticleBackground'
import { StatsCounter } from './StatsCounter'

interface HeroSectionProps {
  shortTitle: string
  proteins: number
  interactions: number
}

export function HeroSection({ shortTitle, proteins, interactions }: HeroSectionProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = query.trim()
    if (term) navigate(`/search/${encodeURIComponent(term)}`)
  }

  return (
    <section
      className="relative min-h-64 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'var(--color-main)' }}
    >
      <ParticleBackground id="hero-particles" className="absolute inset-0" />
      <div
        className="relative z-10 bg-white rounded-lg border-2 p-8 max-w-md w-full mx-4 text-center"
        style={{ borderColor: 'var(--color-main)' }}
      >
        <h1
          className="font-bold mb-4"
          style={{ color: 'var(--color-main)', fontSize: '80px', lineHeight: 1 }}
        >
          {shortTitle}
        </h1>
        <StatsCounter proteins={proteins} interactions={interactions} />
        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter gene names, e.g. BAD,BCL2L1"
            className="flex-1 px-3 py-2 border rounded text-sm"
            style={{ borderColor: 'var(--color-main)' }}
          />
          <button
            type="submit"
            className="px-4 py-2 text-white text-sm rounded"
            style={{ backgroundColor: 'var(--color-main)' }}
          >
            Search
          </button>
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
npm run test -- src/features/home/StatsCounter.test.tsx src/features/home/HeroSection.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/features/home/
git commit -m "feat: add HeroSection with particle background, stats counter, and search bar"
```

---

## Task 11: Home Page — MissionSection + MiniNetworkGraph

**Files:** `src/features/home/MissionSection.tsx`, `src/features/home/MiniNetworkGraph.tsx`, `src/features/home/MissionSection.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/features/home/MissionSection.test.tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { MissionSection } from './MissionSection'

describe('MissionSection', () => {
  it('renders mission title HTML', () => {
    render(
      <MemoryRouter>
        <MissionSection title="<h4>Our Mission</h4>" text="<p>We study proteins</p>" />
      </MemoryRouter>
    )
    expect(screen.getByText('Our Mission')).toBeInTheDocument()
    expect(screen.getByText('We study proteins')).toBeInTheDocument()
  })

  it('renders Search, About, and Download quick links', () => {
    render(
      <MemoryRouter>
        <MissionSection title="" text="" />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/features/home/MissionSection.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement MissionSection**

```typescript
// src/features/home/MissionSection.tsx
import { Link } from 'react-router-dom'

interface MissionSectionProps {
  title: string
  text: string
}

export function MissionSection({ title, text }: MissionSectionProps) {
  return (
    <div>
      <div
        className="text-lg font-semibold mb-2"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div
        className="text-gray-700 leading-relaxed"
        style={{ fontSize: '18px' }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
      <div className="flex gap-6 mt-6">
        {[
          { to: '/search', label: 'Search', icon: '🔍' },
          { to: '/about', label: 'About', icon: 'ℹ️' },
          { to: '/download', label: 'Download', icon: '💾' },
        ].map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 text-sm"
            style={{ color: 'var(--color-main)' }}
          >
            <span className="text-2xl">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement MiniNetworkGraph**

Cytoscape does not render in jsdom — this component has no unit tests. Verify manually in the browser.

```typescript
// src/features/home/MiniNetworkGraph.tsx
import { useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import type { ElementDefinition } from 'cytoscape'

interface MiniNetworkGraphProps {
  proteins: string[]
}

function buildElements(proteins: string[]): ElementDefinition[] {
  const nodes: ElementDefinition[] = proteins.map((name, i) => ({
    data: { id: `n${i}`, label: name },
  }))
  const edges: ElementDefinition[] = proteins.slice(0, -1).map((_, i) => ({
    data: { id: `e${i}`, source: `n${i}`, target: `n${i + 1}` },
  }))
  return [...nodes, ...edges]
}

const STYLESHEET = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'background-color': 'var(--color-interactor-node)',
      color: '#ffffff',
      'text-outline-width': 1,
      'font-size': 10,
      width: 40,
      height: 40,
    },
  },
  {
    selector: 'edge',
    style: { 'line-color': '#cccccc', width: 2 },
  },
] as any

export function MiniNetworkGraph({ proteins }: MiniNetworkGraphProps) {
  const [seed, setSeed] = useState(0)
  const shuffled = [...proteins].sort(() => Math.random() - 0.5).slice(0, 8)
  const elements = buildElements(shuffled)

  return (
    <div className="relative border rounded overflow-hidden">
      <CytoscapeComponent
        key={seed}
        elements={elements}
        stylesheet={STYLESHEET}
        layout={{ name: 'cola' } as any}
        style={{ width: '100%', height: 320 }}
      />
      <button
        onClick={() => setSeed((s) => s + 1)}
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded border bg-white"
        style={{ borderColor: 'var(--color-main)', color: 'var(--color-main)' }}
      >
        Refresh
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- src/features/home/MissionSection.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd ~/openpip-2.0
git add frontend/src/features/home/MissionSection.tsx frontend/src/features/home/MiniNetworkGraph.tsx
git add frontend/src/features/home/MissionSection.test.tsx
git commit -m "feat: add MissionSection and MiniNetworkGraph for home page"
```

---

## Task 12: Home Page — Announcements + Carousel + Methods + Compose

**Files:** `src/features/home/AnnouncementsList.tsx`, `src/features/home/ImageCarousel.tsx`, `src/features/home/MethodsSection.tsx`, `src/features/home/HomePage.tsx` and tests

- [ ] **Step 1: Write failing tests**

```typescript
// src/features/home/AnnouncementsList.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AnnouncementsList } from './AnnouncementsList'
import type { Announcement } from '../../types/api'

const announcements: Announcement[] = [
  { id: 1, title: 'New release', text: '<p>v2 is out</p>', date: '2026-05-01', showOnHomePage: true },
  { id: 2, title: 'Maintenance', text: '<p>Scheduled downtime</p>', date: '2026-04-10', showOnHomePage: true },
]

describe('AnnouncementsList', () => {
  it('renders each announcement title', () => {
    render(<AnnouncementsList announcements={announcements} />)
    expect(screen.getByText('New release')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })

  it('renders dates', () => {
    render(<AnnouncementsList announcements={announcements} />)
    expect(screen.getByText('2026-05-01')).toBeInTheDocument()
  })

  it('renders HTML content', () => {
    render(<AnnouncementsList announcements={announcements} />)
    expect(screen.getByText('v2 is out')).toBeInTheDocument()
  })

  it('renders empty state gracefully', () => {
    const { container } = render(<AnnouncementsList announcements={[]} />)
    expect(container.querySelector('[data-testid="announcements"]')).toBeInTheDocument()
  })
})
```

```typescript
// src/features/home/HomePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { HomePage } from './HomePage'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
}

describe('HomePage', () => {
  it('renders the site short title from MSW settings', async () => {
    render(<HomePage />, { wrapper })
    await waitFor(() => expect(screen.getByText('HuRI')).toBeInTheDocument())
  })

  it('renders formatted protein count from MSW counts', async () => {
    render(<HomePage />, { wrapper })
    await waitFor(() => expect(screen.getByText('8,275')).toBeInTheDocument())
  })

  it('renders announcements from MSW', async () => {
    render(<HomePage />, { wrapper })
    await waitFor(() => expect(screen.getByText('Welcome to openPIP 2.0')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- src/features/home/AnnouncementsList.test.tsx src/features/home/HomePage.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement AnnouncementsList**

```typescript
// src/features/home/AnnouncementsList.tsx
import type { Announcement } from '../../types/api'

interface AnnouncementsListProps {
  announcements: Announcement[]
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  return (
    <div data-testid="announcements" className="rounded border overflow-hidden">
      <div
        className="px-4 py-2 text-sm font-semibold"
        style={{ backgroundColor: 'var(--color-main)', color: 'var(--color-header)' }}
      >
        Announcements
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
        {announcements.map((a) => (
          <div key={a.id} className="px-4 py-3 border-b last:border-b-0">
            <h4 className="font-semibold text-sm">{a.title}</h4>
            {a.date && <p className="text-xs text-gray-500 mb-1">{a.date}</p>}
            <div
              className="text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: a.text }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement ImageCarousel**

```typescript
// src/features/home/ImageCarousel.tsx
import { useState } from 'react'

const IMAGES = ['img_1.jpg', 'img_2.jpg', 'img_3.jpg']

export function ImageCarousel() {
  const [current, setCurrent] = useState(0)
  const prev = () => setCurrent((c) => (c - 1 + IMAGES.length) % IMAGES.length)
  const next = () => setCurrent((c) => (c + 1) % IMAGES.length)

  return (
    <div className="relative overflow-hidden rounded border">
      <img
        src={`/assets/images/${IMAGES[current]}`}
        alt={`Slide ${current + 1}`}
        className="w-full h-64 object-cover bg-gray-100"
      />
      <button onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded text-lg">
        ‹
      </button>
      <button onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded text-lg">
        ›
      </button>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {IMAGES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement MethodsSection**

```typescript
// src/features/home/MethodsSection.tsx
interface MethodsSectionProps {
  title: string
  text: string
}

export function MethodsSection({ title, text }: MethodsSectionProps) {
  return (
    <section className="py-12 px-6" style={{ backgroundColor: 'var(--color-main)' }}>
      <div className="max-w-4xl mx-auto" style={{ color: 'var(--color-header)' }}>
        <div className="font-semibold mb-2" dangerouslySetInnerHTML={{ __html: title }} />
        <div style={{ fontSize: '18px' }} dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Implement HomePage**

```typescript
// src/features/home/HomePage.tsx
import { useSettings } from '../../api/settings'
import { useCounts } from '../../api/counts'
import { useAnnouncements } from '../../api/announcements'
import { HeroSection } from './HeroSection'
import { MissionSection } from './MissionSection'
import { MiniNetworkGraph } from './MiniNetworkGraph'
import { AnnouncementsList } from './AnnouncementsList'
import { ImageCarousel } from './ImageCarousel'
import { MethodsSection } from './MethodsSection'

const EXAMPLE_PROTEINS = ['BAD', 'BCL2L1', 'BCL2L2', 'BAK1', 'BMF', 'MCL1', 'BCL2L11', 'BIK']

export function HomePage() {
  const { data: settings } = useSettings()
  const { data: counts } = useCounts()
  const { data: announcements } = useAnnouncements()

  return (
    <div>
      <HeroSection
        shortTitle={settings?.shortTitle ?? ''}
        proteins={counts?.proteins ?? 0}
        interactions={counts?.interactions ?? 0}
      />

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <MissionSection
            title={settings?.missionTitle ?? ''}
            text={settings?.missionText ?? ''}
          />
          <MiniNetworkGraph proteins={EXAMPLE_PROTEINS} />
        </div>
      </section>

      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnnouncementsList announcements={announcements ?? []} />
          <ImageCarousel />
        </div>
      </section>

      <MethodsSection
        title={settings?.methodTitle ?? ''}
        text={settings?.methodText ?? ''}
      />
    </div>
  )
}
```

- [ ] **Step 7: Run all tests**

```bash
npm run test
```

Expected: all tests PASS (15+ tests total across the project).

- [ ] **Step 8: Verify in browser**

```bash
npm run dev
```

Open http://localhost:5173. Verify manually:
- Red navbar with logo and all nav links
- Hero section: particle background, "HuRI" title (80px), stats (8,275 proteins / 52,569 interactions), search bar
- Mission section with mission text and three icon links
- MiniNetworkGraph renders a Cytoscape network with cola layout and Refresh button
- Announcements panel shows two MSW-backed announcements with scrollable list
- Image carousel (images will 404 — normal until backend serves them)
- Methods section with red background

- [ ] **Step 9: Lint and typecheck**

```bash
npm run lint
npx tsc --noEmit
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 10: Final commit**

```bash
cd ~/openpip-2.0
git add frontend/src/features/home/
git commit -m "feat: complete Home page — announcements, carousel, methods, compose"
```

---

## Self-Review

### Spec coverage check

| FRONTEND_DOCUMENTATION.md section | Tasks covering it |
|---|---|
| §1 Tech Stack | Task 1 (all deps installed) |
| §2 Global Layout + Navigation | Tasks 7, 8, 9 |
| §3 Theming + Color System | Task 6 (injectCSSVars sets all 11 vars) |
| §4 Pages Overview — routing | Task 9 |
| §5 Home — Hero/Stats | Task 10 |
| §5 Home — search typeahead | Task 10 (search bar navigates; `useAutocomplete` wired in Task 4, not yet connected to input — note below) |
| §5 Home — Mission + Mini Network | Task 11 |
| §5 Home — Announcements + Carousel | Task 12 |
| §5 Home — Methods | Task 12 |
| §5 Home — Footer | Task 7 |
| §6 Search Results | **Plan 2** |
| §7 Download | Stub — Plan 3 |
| §8 About/FAQ/Contact/Docs | Stubs — Plan 3 |
| §9 Admin Pages | Settings only — Plan 3 |
| §10 Auth Pages | Stubs — Plan 3 |
| §11 TypeScript types | Task 3 |
| §12 API Endpoints | Task 4 |
| §13 Component Tree | Tasks 7–12 |
| §14 State Management | Tasks 5, 6 |

**Remaining gap:** The search typeahead (autocomplete) on the hero search bar is not yet wired. The `useAutocomplete(q)` hook exists (Task 4) but the `HeroSection` input does not call it. This is acceptable for Plan 1 — the search bar navigates correctly. Wire autocomplete suggestions in Plan 2 when the search experience is fully built.

### Placeholder scan

No TBD, TODO, "implement later", or vague instructions found in this plan.

### Type consistency

- `AdminSettings` defined in Task 3; used in Tasks 4 (`useSettings()` return type), 6 (`injectCSSVars` param), 7 (`ThemeProvider` context value). Field names match throughout.
- `Announcement` defined in Task 3; fixture created in Task 4; consumed in Task 12 (`AnnouncementsList` props). Types match.
- `Counts` defined in Task 3; fixture in Task 4; consumed in Task 10 (`StatsCounter` props via `HomePage`). Fields `proteins` / `interactions` consistent.
- `useSettings()`, `useCounts()`, `useAnnouncements()` defined in Task 4; consumed in Task 12 `HomePage`. Hook names consistent.
- `useLogin()` / `useLogout()` defined in Task 4; `useLogout()` used in Task 8 `Navbar`. Consistent.
