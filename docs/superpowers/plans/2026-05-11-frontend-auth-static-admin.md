# openPIP 2.0 Frontend — Plan 3: Auth + Static Pages + Admin Settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all auth pages (Login, Register, Profile), static content pages (Download, About, FAQ, Contact, Documentation), and the Admin Settings page, bringing every placeholder component from Plan 1 to a fully tested, parity-compliant implementation.

**Architecture:** Each page fetches data through TanStack Query hooks backed by MSW handlers; auth pages write to/read from the Zustand `authStore`; the `AdminRoute` guard already wraps `AdminSettingsPage` in the router; static content pages (`About`, `FAQ`, `Documentation`) render raw HTML from the API via `dangerouslySetInnerHTML`; `AdminSettingsPage` reads from and PUTs to `/api/admin/settings` and is accessible only to admins. All new MSW handlers are added to `src/mocks/handlers/index.ts` so vitest picks them up automatically.

**Tech Stack:** React 18, TypeScript 5, TanStack Query v5, Zustand v4, React Router v7, MSW v2, axios, vitest + React Testing Library, Tailwind CSS v4

---

## Scope note

| Plan | Subsystem | Depends on |
|------|-----------|------------|
| Plan 1 | Scaffold + Infrastructure + Home Page | nothing |
| Plan 2 | Search Results Page | Plan 1 |
| **Plan 3 (this)** | Auth + Static Pages + Admin Settings | Plan 1 |

---

## File Map — every file to create or modify

All paths relative to `frontend/src/`.

### New files to create

| File | Purpose |
|------|---------|
| `api/auth.ts` | Add `useRegister()`, `useProfile()`, `useSaveInteractionNetwork()` mutations/queries |
| `api/pages.ts` | `usePageContent(slug)` — GET `/api/pages/:slug` |
| `api/downloads.ts` | `useDownloads()` — GET `/api/downloads` |
| `api/contact.ts` | `useContact()` — POST `/api/contact` |
| `api/adminSettings.ts` | `useAdminSettings()`, `useUpdateAdminSettings()` — GET/PUT `/api/admin/settings` |
| `mocks/fixtures/profile.ts` | `profileFixture` |
| `mocks/fixtures/pages.ts` | `aboutFixture`, `faqFixture`, `contactFixture`, `documentationFixture` |
| `mocks/fixtures/downloads.ts` | `downloadsFixture` |
| `mocks/fixtures/adminSettings.ts` | `adminSettingsFixture` |
| `mocks/handlers/profile.ts` | GET `/api/auth/profile` |
| `mocks/handlers/pages.ts` | GET `/api/pages/:slug` |
| `mocks/handlers/downloads.ts` | GET `/api/downloads` |
| `mocks/handlers/contact.ts` | POST `/api/contact` |
| `mocks/handlers/adminSettings.ts` | GET + PUT `/api/admin/settings` |
| `features/auth/LoginPage.test.tsx` | RTL tests for LoginPage |
| `features/auth/RegisterPage.test.tsx` | RTL tests for RegisterPage |
| `features/auth/ProfilePage.test.tsx` | RTL tests for ProfilePage |
| `features/static/DownloadPage.test.tsx` | RTL tests for DownloadPage |
| `features/static/AboutPage.test.tsx` | RTL tests for AboutPage |
| `features/static/FAQPage.test.tsx` | RTL tests for FAQPage |
| `features/static/ContactPage.test.tsx` | RTL tests for ContactPage |
| `features/static/DocumentationPage.test.tsx` | RTL tests for DocumentationPage |
| `features/admin/AdminSettingsPage.test.tsx` | RTL tests for AdminSettingsPage |

### Files to modify

| File | Change |
|------|--------|
| `api/auth.ts` | Add `useRegister()`, `useProfile()`, `useSaveInteractionNetwork()` |
| `types/api.ts` | Add `UserProfile`, `DownloadFile`, `DownloadList`, `PageContent`, `ContactPayload`, `ContactResponse`, `SaveNetworkPayload` |
| `mocks/handlers/auth.ts` | Add `/api/auth/register` handler |
| `mocks/handlers/index.ts` | Import + spread all new handler arrays |

### Files to implement (currently stubs)

| File | Current state |
|------|--------------|
| `features/auth/LoginPage.tsx` | `<div>Login — Plan 3</div>` |
| `features/auth/RegisterPage.tsx` | `<div>Register — Plan 3</div>` |
| `features/auth/ProfilePage.tsx` | `<div>Profile — Plan 3</div>` |
| `features/static/DownloadPage.tsx` | `<div>Downloads — Plan 3</div>` |
| `features/static/AboutPage.tsx` | `<div>About — Plan 3</div>` |
| `features/static/FAQPage.tsx` | `<div>FAQ — Plan 3</div>` |
| `features/static/ContactPage.tsx` | `<div>Contact — Plan 3</div>` |
| `features/static/DocumentationPage.tsx` | `<div>Documentation — Plan 3</div>` |
| `features/admin/AdminSettingsPage.tsx` | `<div>Admin Settings — Plan 3</div>` |

---

## Pre-flight check

- [ ] **Task 0.1 — Confirm tests pass before touching anything**

  ```bash
  cd /home/sez876/openpip-2.0/frontend && npm run test -- --run 2>&1 | tail -20
  ```

  Expected: all existing tests pass, non-zero test count. If any fail, stop and fix before proceeding.

---

## Section 1 — Types

### Task 1.1 — Add new types to `src/types/api.ts`

Open `src/types/api.ts` and append at the bottom (after the `Interaction` interface):

```typescript
export interface UserProfile {
  id: number
  username: string
  email: string
  isAdmin: boolean
  savedNetworks: SavedNetwork[]
}

export interface SavedNetwork {
  id: number
  createdAt: string       // ISO datetime string
  interactionCount: number
}

export interface DownloadFile {
  name: string
  format: string          // e.g. "PSI-MI Tab 2.7", "SIF", "CSV", "FASTA"
  size: string            // human-readable, e.g. "12.4 MB"
  url: string
}

export interface DownloadList {
  files: DownloadFile[]
}

export interface PageContent {
  slug: string
  html: string
}

export interface ContactPayload {
  name: string
  email: string
  message: string
}

export interface ContactResponse {
  detail: string
}

export interface SaveNetworkPayload {
  json_data: string       // JSON.stringify of InteractionEdge[]
}
```

After editing, run:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run 2>&1 | tail -10
```

Expected: still passing (type-only change, no runtime effect).

---

## Section 2 — MSW Fixtures

### Task 2.1 — Create `src/mocks/fixtures/profile.ts`

```typescript
import type { UserProfile } from '../../types/api'

export const profileFixture: UserProfile = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  isAdmin: true,
  savedNetworks: [
    { id: 1, createdAt: '2026-05-01T10:00:00Z', interactionCount: 42 },
  ],
}
```

### Task 2.2 — Create `src/mocks/fixtures/pages.ts`

```typescript
import type { PageContent } from '../../types/api'

export const aboutFixture: PageContent = {
  slug: 'about',
  html: '<h2>About openPIP</h2><p>openPIP is a human protein interaction portal.</p>',
}

export const faqFixture: PageContent = {
  slug: 'faq',
  html: '<h2>Frequently Asked Questions</h2><p><strong>Q: What is openPIP?</strong></p><p>A: A protein interaction portal.</p>',
}

export const documentationFixture: PageContent = {
  slug: 'documentation',
  html: '<h2>Documentation</h2><p>API and usage documentation.</p>',
}
```

### Task 2.3 — Create `src/mocks/fixtures/downloads.ts`

```typescript
import type { DownloadList } from '../../types/api'

export const downloadsFixture: DownloadList = {
  files: [
    {
      name: 'HuRI_interactions_full',
      format: 'PSI-MI Tab 2.7',
      size: '18.2 MB',
      url: '/downloads/HuRI_interactions_full.tab',
    },
    {
      name: 'HuRI_interactions_full',
      format: 'SIF',
      size: '4.1 MB',
      url: '/downloads/HuRI_interactions_full.sif',
    },
    {
      name: 'HuRI_interactions_full',
      format: 'CSV',
      size: '5.7 MB',
      url: '/downloads/HuRI_interactions_full.csv',
    },
    {
      name: 'HuRI_interactors_full',
      format: 'Interactors CSV',
      size: '1.2 MB',
      url: '/downloads/HuRI_interactors_full.csv',
    },
    {
      name: 'HuRI_sequences_full',
      format: 'FASTA',
      size: '3.8 MB',
      url: '/downloads/HuRI_sequences_full.fasta',
    },
  ],
}
```

### Task 2.4 — Create `src/mocks/fixtures/adminSettings.ts`

This is distinct from `settings.ts` — it returns the writable admin view of the same shape, but served from `/api/admin/settings` instead of `/api/settings`.

```typescript
import type { AdminSettings } from '../../types/api'

export const adminSettingsFixture: AdminSettings = {
  title: 'openPIP — Protein Interaction Portal',
  shortTitle: 'HuRI',
  footer: '<p>© 2026 openPIP. All rights reserved.</p>',
  homePage: '<p>Welcome to openPIP.</p>',
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

---

## Section 3 — MSW Handlers

### Task 3.1 — Add `/api/auth/register` to `src/mocks/handlers/auth.ts`

Open `src/mocks/handlers/auth.ts`. It currently exports `authHandlers` with login and logout. Add a register handler. Replace the entire file content:

```typescript
import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { username: string; password: string }
    if (body.username === 'admin' && body.password === 'admin') {
      return HttpResponse.json({ access: 'mock-access-token', refresh: 'mock-refresh-token', is_admin: true })
    }
    if (body.username === 'user' && body.password === 'user') {
      return HttpResponse.json({ access: 'mock-user-token', refresh: 'mock-user-refresh', is_admin: false })
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),
  http.post('/api/auth/logout', () => HttpResponse.json({ detail: 'Logged out' })),
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { username: string; email: string; password: string }
    if (!body.username || !body.email || !body.password) {
      return HttpResponse.json({ detail: 'All fields required' }, { status: 400 })
    }
    if (body.username === 'taken') {
      return HttpResponse.json({ username: ['A user with that username already exists.'] }, { status: 400 })
    }
    return HttpResponse.json({ detail: 'Registration successful. Please log in.' }, { status: 201 })
  }),
]
```

### Task 3.2 — Create `src/mocks/handlers/profile.ts`

```typescript
import { http, HttpResponse } from 'msw'
import { profileFixture } from '../fixtures/profile'

export const profileHandlers = [
  http.get('/api/auth/profile', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Authentication credentials were not provided.' }, { status: 401 })
    }
    return HttpResponse.json(profileFixture)
  }),
]
```

### Task 3.3 — Create `src/mocks/handlers/pages.ts`

```typescript
import { http, HttpResponse } from 'msw'
import { aboutFixture, faqFixture, documentationFixture } from '../fixtures/pages'
import type { PageContent } from '../../types/api'

const pageMap: Record<string, PageContent> = {
  about: aboutFixture,
  faq: faqFixture,
  documentation: documentationFixture,
}

export const pagesHandlers = [
  http.get('/api/pages/:slug', ({ params }) => {
    const slug = params.slug as string
    const page = pageMap[slug]
    if (!page) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    }
    return HttpResponse.json(page)
  }),
]
```

### Task 3.4 — Create `src/mocks/handlers/downloads.ts`

```typescript
import { http, HttpResponse } from 'msw'
import { downloadsFixture } from '../fixtures/downloads'

export const downloadsHandlers = [
  http.get('/api/downloads', () => HttpResponse.json(downloadsFixture)),
]
```

### Task 3.5 — Create `src/mocks/handlers/contact.ts`

```typescript
import { http, HttpResponse } from 'msw'

export const contactHandlers = [
  http.post('/api/contact', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; message: string }
    if (!body.name || !body.email || !body.message) {
      return HttpResponse.json({ detail: 'All fields required.' }, { status: 400 })
    }
    return HttpResponse.json({ detail: 'Message sent. Thank you for contacting us.' })
  }),
]
```

### Task 3.6 — Create `src/mocks/handlers/adminSettings.ts`

```typescript
import { http, HttpResponse } from 'msw'
import { adminSettingsFixture } from '../fixtures/adminSettings'
import type { AdminSettings } from '../../types/api'

let currentSettings: AdminSettings = { ...adminSettingsFixture }

export const adminSettingsHandlers = [
  http.get('/api/admin/settings', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Authentication credentials were not provided.' }, { status: 401 })
    }
    return HttpResponse.json(currentSettings)
  }),
  http.put('/api/admin/settings', async ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Authentication credentials were not provided.' }, { status: 401 })
    }
    const body = await request.json() as Partial<AdminSettings>
    currentSettings = { ...currentSettings, ...body }
    return HttpResponse.json(currentSettings)
  }),
]
```

### Task 3.7 — Wire all new handlers into `src/mocks/handlers/index.ts`

Replace the entire content of `src/mocks/handlers/index.ts`:

```typescript
import { settingsHandlers } from './settings'
import { announcementsHandlers } from './announcements'
import { countsHandlers } from './counts'
import { authHandlers } from './auth'
import { profileHandlers } from './profile'
import { pagesHandlers } from './pages'
import { downloadsHandlers } from './downloads'
import { contactHandlers } from './contact'
import { adminSettingsHandlers } from './adminSettings'

export const handlers = [
  ...settingsHandlers,
  ...announcementsHandlers,
  ...countsHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...pagesHandlers,
  ...downloadsHandlers,
  ...contactHandlers,
  ...adminSettingsHandlers,
]
```

Verify:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/mocks/handlers/index.test.ts 2>&1
```

Expected output contains: `1 passed`.

---

## Section 4 — API Hooks

### Task 4.1 — Add new hooks to `src/api/auth.ts`

Replace the entire content of `src/api/auth.ts`:

```typescript
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'
import type { UserProfile } from '../types/api'

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

export function useRegister() {
  return useMutation({
    mutationFn: (body: { username: string; email: string; password: string; confirmPassword: string }) =>
      apiClient.post('/auth/register', {
        username: body.username,
        email: body.email,
        password: body.password,
      }).then((r) => r.data),
  })
}

export function useProfile() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/auth/profile').then((r) => r.data),
    enabled: isLoggedIn,
    staleTime: 2 * 60 * 1000,
  })
}

export function useSaveInteractionNetwork() {
  return useMutation({
    mutationFn: (jsonData: string) =>
      apiClient.post('/save_interaction_network', { json_data: jsonData }).then((r) => r.data),
  })
}
```

### Task 4.2 — Create `src/api/pages.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { PageContent } from '../types/api'

export function usePageContent(slug: string) {
  return useQuery<PageContent>({
    queryKey: ['page', slug],
    queryFn: () => apiClient.get(`/pages/${slug}`).then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })
}
```

### Task 4.3 — Create `src/api/downloads.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { DownloadList } from '../types/api'

export function useDownloads() {
  return useQuery<DownloadList>({
    queryKey: ['downloads'],
    queryFn: () => apiClient.get('/downloads').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })
}
```

### Task 4.4 — Create `src/api/contact.ts`

```typescript
import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import type { ContactPayload, ContactResponse } from '../types/api'

export function useContact() {
  return useMutation<ContactResponse, Error, ContactPayload>({
    mutationFn: (body) => apiClient.post('/contact', body).then((r) => r.data),
  })
}
```

### Task 4.5 — Create `src/api/adminSettings.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { AdminSettings } from '../types/api'

export function useAdminSettings() {
  return useQuery<AdminSettings>({
    queryKey: ['admin-settings'],
    queryFn: () => apiClient.get('/admin/settings').then((r) => r.data),
    staleTime: 0,
  })
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient()
  return useMutation<AdminSettings, Error, Partial<AdminSettings>>({
    mutationFn: (body) => apiClient.put('/admin/settings', body).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['admin-settings'], updated)
      // Also invalidate public settings so ThemeProvider refreshes
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
```

Verify all API files compile:

```bash
cd /home/sez876/openpip-2.0/frontend && npx tsc --noEmit 2>&1
```

Expected: no errors.

---

## Section 5 — LoginPage

### Task 5.1 — Write failing test `src/features/auth/LoginPage.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import { LoginPage } from './LoginPage'
import { useAuthStore } from '../../store/authStore'

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isLoggedIn: false, isAdmin: false, token: null })
  })

  it('renders username and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders a submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows error message on 401', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('calls login store action on success', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    await waitFor(() => {
      expect(useAuthStore.getState().isLoggedIn).toBe(true)
    })
  })

  it('disables button while submitting', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))
    // Button becomes disabled immediately after click
    expect(screen.getByRole('button', { name: /login|logging in/i })).toBeDisabled()
    await waitFor(() => expect(useAuthStore.getState().isLoggedIn).toBe(true))
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/auth/LoginPage.test.tsx 2>&1 | tail -20
```

Expected: tests fail because `LoginPage` is a stub.

### Task 5.2 — Implement `src/features/auth/LoginPage.tsx`

```typescript
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogin } from '../../api/auth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    login(
      { username, password },
      {
        onSuccess: () => navigate('/'),
        onError: () => setErrorMsg('Invalid username or password. Please try again.'),
      }
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
          Login
        </h1>

        {errorMsg && (
          <div role="alert" className="mb-4 px-4 py-3 rounded bg-red-50 border border-red-300 text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-main)' }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--color-main)' }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 text-white rounded text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-main)' }}
          >
            {isPending ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Don't have an account?{' '}
          <Link to="/register" className="underline" style={{ color: 'var(--color-main)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Task 5.3 — Confirm LoginPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/auth/LoginPage.test.tsx 2>&1 | tail -15
```

Expected: `5 passed`.

---

## Section 6 — RegisterPage

### Task 6.1 — Write failing test `src/features/auth/RegisterPage.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { RegisterPage } from './RegisterPage'

function renderRegister() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RegisterPage', () => {
  it('renders all four fields', () => {
    renderRegister()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderRegister()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('shows client-side error when passwords do not match', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i)
  })

  it('shows server error when username is taken', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'taken' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'taken@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('shows success message on successful registration', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pass1234' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'pass1234' } })
    fireEvent.click(screen.getByRole('button', { name: /register/i }))
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent(/registration successful/i)
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/auth/RegisterPage.test.tsx 2>&1 | tail -20
```

### Task 6.2 — Implement `src/features/auth/RegisterPage.tsx`

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '../../api/auth'
import { AxiosError } from 'axios'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { mutate: register, isPending } = useRegister()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    register(
      { username, email, password, confirmPassword },
      {
        onSuccess: (data) => setSuccessMsg(data.detail ?? 'Registration successful. Please log in.'),
        onError: (err) => {
          const axiosErr = err as AxiosError<Record<string, string[]>>
          const data = axiosErr.response?.data
          if (data) {
            const msgs = Object.values(data).flat()
            setErrorMsg(msgs.join(' '))
          } else {
            setErrorMsg('Registration failed. Please try again.')
          }
        },
      }
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
          Register
        </h1>

        {errorMsg && (
          <div role="alert" className="mb-4 px-4 py-3 rounded bg-red-50 border border-red-300 text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div role="status" className="mb-4 px-4 py-3 rounded bg-green-50 border border-green-300 text-green-700 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: 'var(--color-main)' }}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: 'var(--color-main)' }}
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: 'var(--color-main)' }}
            />
          </div>

          <div>
            <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border rounded text-sm"
              style={{ borderColor: 'var(--color-main)' }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 text-white rounded text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-main)' }}
          >
            {isPending ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link to="/login" className="underline" style={{ color: 'var(--color-main)' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Task 6.3 — Confirm RegisterPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/auth/RegisterPage.test.tsx 2>&1 | tail -15
```

Expected: `5 passed`.

---

## Section 7 — ProfilePage

### Task 7.1 — Write failing test `src/features/auth/ProfilePage.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import { ProfilePage } from './ProfilePage'
import { useAuthStore } from '../../store/authStore'

function renderProfile() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isLoggedIn: false, isAdmin: false, token: null })
  })

  it('shows login prompt when not authenticated', () => {
    renderProfile()
    expect(screen.getByText(/please log in/i)).toBeInTheDocument()
  })

  it('shows username when logged in', async () => {
    useAuthStore.setState({ isLoggedIn: true, isAdmin: true, token: 'mock-access-token' })
    localStorage.setItem('openpip_access_token', 'mock-access-token')
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
  })

  it('shows email when logged in', async () => {
    useAuthStore.setState({ isLoggedIn: true, isAdmin: true, token: 'mock-access-token' })
    localStorage.setItem('openpip_access_token', 'mock-access-token')
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    })
  })

  it('shows saved networks section', async () => {
    useAuthStore.setState({ isLoggedIn: true, isAdmin: true, token: 'mock-access-token' })
    localStorage.setItem('openpip_access_token', 'mock-access-token')
    renderProfile()
    await waitFor(() => {
      expect(screen.getByText(/saved networks/i)).toBeInTheDocument()
    })
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/auth/ProfilePage.test.tsx 2>&1 | tail -20
```

### Task 7.2 — Implement `src/features/auth/ProfilePage.tsx`

```typescript
import { Link } from 'react-router-dom'
import { useProfile } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export function ProfilePage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { data: profile, isLoading } = useProfile()

  if (!isLoggedIn) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <p className="text-gray-600">
          Please{' '}
          <Link to="/login" className="underline" style={{ color: 'var(--color-main)' }}>
            log in
          </Link>{' '}
          to view your profile.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading profile…</div>
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
        Profile
      </h1>

      <section className="border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Account Details</h2>
        <dl className="space-y-3">
          <div className="flex gap-4">
            <dt className="w-32 text-sm font-medium text-gray-600">Username</dt>
            <dd className="text-sm text-gray-900">{profile?.username}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="w-32 text-sm font-medium text-gray-600">Email</dt>
            <dd className="text-sm text-gray-900">{profile?.email}</dd>
          </div>
          {profile?.isAdmin && (
            <div className="flex gap-4">
              <dt className="w-32 text-sm font-medium text-gray-600">Role</dt>
              <dd className="text-sm">
                <span
                  className="px-2 py-0.5 text-white rounded text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-main)' }}
                >
                  Admin
                </span>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section className="border rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Saved Networks</h2>
        {profile?.savedNetworks && profile.savedNetworks.length > 0 ? (
          <ul className="space-y-2">
            {profile.savedNetworks.map((net) => (
              <li key={net.id} className="flex justify-between text-sm text-gray-700 border-b pb-2">
                <span>{net.interactionCount} interactions</span>
                <span className="text-gray-500">{new Date(net.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No saved networks yet.</p>
        )}
      </section>
    </div>
  )
}
```

### Task 7.3 — Confirm ProfilePage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/auth/ProfilePage.test.tsx 2>&1 | tail -15
```

Expected: `4 passed`.

---

## Section 8 — DownloadPage

### Task 8.1 — Write failing test `src/features/static/DownloadPage.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { DownloadPage } from './DownloadPage'

function renderDownload() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DownloadPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DownloadPage', () => {
  it('renders a page heading', () => {
    renderDownload()
    expect(screen.getByRole('heading', { name: /download/i })).toBeInTheDocument()
  })

  it('renders the list of download files from the API', async () => {
    renderDownload()
    await waitFor(() => {
      // downloadsFixture has 5 files
      expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(5)
    })
  })

  it('shows format label for each file', async () => {
    renderDownload()
    await waitFor(() => {
      expect(screen.getByText('PSI-MI Tab 2.7')).toBeInTheDocument()
      expect(screen.getByText('SIF')).toBeInTheDocument()
      expect(screen.getByText('FASTA')).toBeInTheDocument()
    })
  })

  it('shows file size for each file', async () => {
    renderDownload()
    await waitFor(() => {
      expect(screen.getByText('18.2 MB')).toBeInTheDocument()
    })
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/DownloadPage.test.tsx 2>&1 | tail -20
```

### Task 8.2 — Implement `src/features/static/DownloadPage.tsx`

```typescript
import { useDownloads } from '../../api/downloads'

export function DownloadPage() {
  const { data, isLoading } = useDownloads()

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-main)' }}>
        Download
      </h1>
      <p className="text-gray-600 mb-8 text-sm">
        Download the full openPIP dataset in your preferred format. Files are updated with each database release.
      </p>

      {isLoading && <p className="text-gray-500 text-sm">Loading download links…</p>}

      {data && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white text-left" style={{ backgroundColor: 'var(--color-main)' }}>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Format</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {data.files.map((file, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-800">{file.name}</td>
                  <td className="px-4 py-3 text-gray-600">{file.format}</td>
                  <td className="px-4 py-3 text-gray-600">{file.size}</td>
                  <td className="px-4 py-3">
                    <a
                      href={file.url}
                      className="underline text-sm font-medium"
                      style={{ color: 'var(--color-main)' }}
                      download
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-10 text-sm text-gray-600">
        <h2 className="text-base font-semibold text-gray-800 mb-2">Citation</h2>
        <p>
          If you use openPIP data in your research, please cite:{' '}
          <em>Helmy et al., Journal of Molecular Biology, 2022.</em>
        </p>
      </section>
    </div>
  )
}
```

### Task 8.3 — Confirm DownloadPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/DownloadPage.test.tsx 2>&1 | tail -15
```

Expected: `4 passed`.

---

## Section 9 — AboutPage

### Task 9.1 — Write failing test `src/features/static/AboutPage.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { AboutPage } from './AboutPage'

function renderAbout() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AboutPage />
    </QueryClientProvider>
  )
}

describe('AboutPage', () => {
  it('renders a page heading', () => {
    renderAbout()
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument()
  })

  it('renders HTML content from the API', async () => {
    renderAbout()
    // aboutFixture contains "About openPIP"
    await waitFor(() => {
      expect(screen.getByText(/about openpip/i)).toBeInTheDocument()
    })
  })

  it('renders loading state before data arrives', () => {
    renderAbout()
    // Initially no content-loaded text
    expect(screen.queryByText(/about openpip/i)).toBeNull()
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/AboutPage.test.tsx 2>&1 | tail -20
```

### Task 9.2 — Create reusable `RawHtmlPage` pattern — implement `src/features/static/AboutPage.tsx`

```typescript
import { usePageContent } from '../../api/pages'

export function AboutPage() {
  const { data, isLoading } = usePageContent('about')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
        About
      </h1>
      {isLoading && <p className="text-gray-500 text-sm">Loading…</p>}
      {data && (
        <div
          className="prose max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      )}
    </div>
  )
}
```

### Task 9.3 — Confirm AboutPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/AboutPage.test.tsx 2>&1 | tail -15
```

Expected: `3 passed`.

---

## Section 10 — FAQPage

### Task 10.1 — Write failing test `src/features/static/FAQPage.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { FAQPage } from './FAQPage'

function renderFAQ() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <FAQPage />
    </QueryClientProvider>
  )
}

describe('FAQPage', () => {
  it('renders a page heading', () => {
    renderFAQ()
    expect(screen.getByRole('heading', { name: /faq/i })).toBeInTheDocument()
  })

  it('renders HTML content from the API', async () => {
    renderFAQ()
    // faqFixture contains "Frequently Asked Questions"
    await waitFor(() => {
      expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument()
    })
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/FAQPage.test.tsx 2>&1 | tail -20
```

### Task 10.2 — Implement `src/features/static/FAQPage.tsx`

```typescript
import { usePageContent } from '../../api/pages'

export function FAQPage() {
  const { data, isLoading } = usePageContent('faq')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
        FAQ
      </h1>
      {isLoading && <p className="text-gray-500 text-sm">Loading…</p>}
      {data && (
        <div
          className="prose max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      )}
    </div>
  )
}
```

### Task 10.3 — Confirm FAQPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/FAQPage.test.tsx 2>&1 | tail -15
```

Expected: `2 passed`.

---

## Section 11 — ContactPage

### Task 11.1 — Write failing test `src/features/static/ContactPage.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { ContactPage } from './ContactPage'

function renderContact() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ContactPage />
    </QueryClientProvider>
  )
}

describe('ContactPage', () => {
  it('renders name, email, and message fields', () => {
    renderContact()
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('renders a submit button', () => {
    renderContact()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('shows success message after successful submission', async () => {
    renderContact()
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello!' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
    expect(screen.getByRole('status')).toHaveTextContent(/thank you/i)
  })

  it('disables submit button while pending', async () => {
    renderContact()
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Bob' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bob@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test message' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(screen.getByRole('button')).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/ContactPage.test.tsx 2>&1 | tail -20
```

### Task 11.2 — Implement `src/features/static/ContactPage.tsx`

```typescript
import { useState } from 'react'
import { useContact } from '../../api/contact'

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { mutate: sendContact, isPending } = useContact()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    setErrorMsg(null)
    sendContact(
      { name, email, message },
      {
        onSuccess: (data) => {
          setSuccessMsg(data.detail ?? 'Message sent. Thank you for contacting us.')
          setName('')
          setEmail('')
          setMessage('')
        },
        onError: () => setErrorMsg('Failed to send message. Please try again.'),
      }
    )
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
        Contact
      </h1>

      {successMsg && (
        <div role="status" className="mb-4 px-4 py-3 rounded bg-green-50 border border-green-300 text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div role="alert" className="mb-4 px-4 py-3 rounded bg-red-50 border border-red-300 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded text-sm"
            style={{ borderColor: 'var(--color-main)' }}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded text-sm"
            style={{ borderColor: 'var(--color-main)' }}
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 border rounded text-sm resize-y"
            style={{ borderColor: 'var(--color-main)' }}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 text-white rounded text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-main)' }}
        >
          {isPending ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
```

### Task 11.3 — Confirm ContactPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/ContactPage.test.tsx 2>&1 | tail -15
```

Expected: `4 passed`.

---

## Section 12 — DocumentationPage

### Task 12.1 — Write failing test `src/features/static/DocumentationPage.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import { DocumentationPage } from './DocumentationPage'

function renderDocs() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentationPage />
    </QueryClientProvider>
  )
}

describe('DocumentationPage', () => {
  it('renders a page heading', () => {
    renderDocs()
    expect(screen.getByRole('heading', { name: /documentation/i })).toBeInTheDocument()
  })

  it('renders HTML content from the API', async () => {
    renderDocs()
    // documentationFixture contains "API and usage documentation"
    await waitFor(() => {
      expect(screen.getByText(/api and usage documentation/i)).toBeInTheDocument()
    })
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/DocumentationPage.test.tsx 2>&1 | tail -20
```

### Task 12.2 — Implement `src/features/static/DocumentationPage.tsx`

```typescript
import { usePageContent } from '../../api/pages'

export function DocumentationPage() {
  const { data, isLoading } = usePageContent('documentation')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
        Documentation
      </h1>
      {isLoading && <p className="text-gray-500 text-sm">Loading…</p>}
      {data && (
        <div
          className="prose max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: data.html }}
        />
      )}
    </div>
  )
}
```

### Task 12.3 — Confirm DocumentationPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/static/DocumentationPage.test.tsx 2>&1 | tail -15
```

Expected: `2 passed`.

---

## Section 13 — AdminSettingsPage

### Task 13.1 — Write failing test `src/features/admin/AdminSettingsPage.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import { AdminSettingsPage } from './AdminSettingsPage'
import { useAuthStore } from '../../store/authStore'

function renderAdminSettings() {
  // Simulate an authenticated admin session
  useAuthStore.setState({ isLoggedIn: true, isAdmin: true, token: 'mock-access-token' })
  localStorage.setItem('openpip_access_token', 'mock-access-token')

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ isLoggedIn: false, isAdmin: false, token: null })
  })

  it('renders the page heading', async () => {
    renderAdminSettings()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin settings/i })).toBeInTheDocument()
    })
  })

  it('renders title and shortTitle text inputs', async () => {
    renderAdminSettings()
    await waitFor(() => {
      expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/short title/i)).toBeInTheDocument()
    })
  })

  it('renders color picker inputs for mainColorScheme', async () => {
    renderAdminSettings()
    await waitFor(() => {
      expect(screen.getByLabelText(/main color/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/main color/i)).toHaveAttribute('type', 'color')
  })

  it('pre-fills fields with current settings', async () => {
    renderAdminSettings()
    await waitFor(() => {
      expect(screen.getByLabelText(/^title$/i)).toHaveValue('openPIP — Protein Interaction Portal')
    })
  })

  it('shows success message after save', async () => {
    renderAdminSettings()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
    expect(screen.getByRole('status')).toHaveTextContent(/saved/i)
  })

  it('renders textarea for footer (not TinyMCE)', async () => {
    renderAdminSettings()
    await waitFor(() => {
      expect(screen.getByLabelText(/footer/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/footer/i).tagName).toBe('TEXTAREA')
  })
})
```

Run to confirm red:

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/admin/AdminSettingsPage.test.tsx 2>&1 | tail -20
```

### Task 13.2 — Implement `src/features/admin/AdminSettingsPage.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useAdminSettings, useUpdateAdminSettings } from '../../api/adminSettings'
import type { AdminSettings } from '../../types/api'

interface FieldConfig {
  key: keyof AdminSettings
  label: string
  type: 'text' | 'color' | 'textarea'
}

const FIELD_CONFIG: FieldConfig[] = [
  { key: 'title', label: 'Title', type: 'text' },
  { key: 'shortTitle', label: 'Short Title', type: 'text' },
  { key: 'url', label: 'URL', type: 'text' },
  { key: 'version', label: 'Version', type: 'text' },
  { key: 'mainColorScheme', label: 'Main Color', type: 'color' },
  { key: 'headerColorScheme', label: 'Header Color', type: 'color' },
  { key: 'logoColorScheme', label: 'Logo Color', type: 'color' },
  { key: 'buttonColorScheme', label: 'Button Color', type: 'color' },
  { key: 'queryNodeColor', label: 'Query Node Color', type: 'color' },
  { key: 'interactorNodeColor', label: 'Interactor Node Color', type: 'color' },
  { key: 'publishedEdgeColor', label: 'Published Edge Color', type: 'color' },
  { key: 'validatedEdgeColor', label: 'Validated Edge Color', type: 'color' },
  { key: 'verifiedEdgeColor', label: 'Verified Edge Color', type: 'color' },
  { key: 'literatureEdgeColor', label: 'Literature Edge Color', type: 'color' },
  { key: 'homePage', label: 'Home Page (HTML)', type: 'textarea' },
  { key: 'missionTitle', label: 'Mission Title (HTML)', type: 'textarea' },
  { key: 'missionText', label: 'Mission Text (HTML)', type: 'textarea' },
  { key: 'methodTitle', label: 'Method Title (HTML)', type: 'textarea' },
  { key: 'methodText', label: 'Method Text (HTML)', type: 'textarea' },
  { key: 'footer', label: 'Footer (HTML)', type: 'textarea' },
]

export function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings()
  const { mutate: save, isPending, isSuccess, isError } = useUpdateAdminSettings()
  const [form, setForm] = useState<Partial<AdminSettings>>({})

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const handleChange = (key: keyof AdminSettings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    save(form)
  }

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading settings…</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-main)' }}>
        Admin Settings
      </h1>

      {isSuccess && (
        <div role="status" className="mb-6 px-4 py-3 rounded bg-green-50 border border-green-300 text-green-700 text-sm">
          Settings saved successfully.
        </div>
      )}

      {isError && (
        <div role="alert" className="mb-6 px-4 py-3 rounded bg-red-50 border border-red-300 text-red-700 text-sm">
          Failed to save settings. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {FIELD_CONFIG.map(({ key, label, type }) => {
          const fieldId = `admin-${key}`
          const value = (form[key] as string) ?? ''
          return (
            <div key={key}>
              <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              {type === 'textarea' ? (
                <textarea
                  id={fieldId}
                  rows={4}
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm font-mono resize-y"
                  style={{ borderColor: 'var(--color-main)' }}
                />
              ) : type === 'color' ? (
                <div className="flex items-center gap-3">
                  <input
                    id={fieldId}
                    type="color"
                    value={value}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="h-10 w-16 rounded border cursor-pointer"
                    style={{ borderColor: 'var(--color-main)' }}
                  />
                  <span className="text-sm text-gray-500 font-mono">{value}</span>
                </div>
              ) : (
                <input
                  id={fieldId}
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: 'var(--color-main)' }}
                />
              )}
            </div>
          )
        })}

        <div className="pt-4 border-t">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 text-white rounded text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-main)' }}
          >
            {isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

### Task 13.3 — Confirm AdminSettingsPage tests pass

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run src/features/admin/AdminSettingsPage.test.tsx 2>&1 | tail -15
```

Expected: `6 passed`.

---

## Section 14 — Full Suite Verification

### Task 14.1 — Run all tests

```bash
cd /home/sez876/openpip-2.0/frontend && npm run test -- --run 2>&1 | tail -30
```

Expected: all tests pass, zero failures.

### Task 14.2 — TypeScript strict check

```bash
cd /home/sez876/openpip-2.0/frontend && npx tsc --noEmit 2>&1
```

Expected: no output (zero errors).

### Task 14.3 — Lint check

```bash
cd /home/sez876/openpip-2.0/frontend && npm run lint 2>&1 | tail -20
```

Expected: no errors or warnings.

### Task 14.4 — Production build

```bash
cd /home/sez876/openpip-2.0/frontend && npm run build 2>&1 | tail -20
```

Expected: build succeeds, `dist/` directory created, no errors.

---

## Self-Review Checklist

### Spec coverage (sections 7–10 of FRONTEND_DOCUMENTATION.md)

| Spec item | Covered |
|-----------|---------|
| Section 7 — Download page with file links | DownloadPage + downloadsFixture + handler |
| Section 8 — About renders raw HTML | AboutPage + pagesFixture |
| Section 8 — FAQ renders raw HTML | FAQPage |
| Section 8 — Contact form POSTs, shows success | ContactPage + contactHandler |
| Section 8 — Documentation renders raw HTML | DocumentationPage |
| Section 9 — Admin Settings form for all AdminSettings fields | AdminSettingsPage + FIELD_CONFIG covers all 20 fields |
| Section 9 — Color pickers for color fields | `type="color"` inputs for all 10 color fields |
| Section 9 — Plain textarea for richtext (Phase 1, no TinyMCE) | `type="textarea"` for homePage, missionTitle, missionText, methodTitle, methodText, footer |
| Section 9 — Admin-only via AdminRoute | AdminRoute already wraps route in App.tsx |
| Section 10 — Login with username/password | LoginPage + useLogin hook |
| Section 10 — Login redirects to / on success | `navigate('/')` in onSuccess |
| Section 10 — Login shows error on 401 | errorMsg state + role="alert" |
| Section 10 — Register with username/email/password/confirm | RegisterPage all four fields |
| Section 10 — Profile shows username/email | ProfilePage from useProfile() |
| Section 10 — Profile shows saved networks | savedNetworks list |
| Auth via simplejwt — token in localStorage | authStore TOKEN_KEY = 'openpip_access_token' |
| MSW handler for every new endpoint | All 5 new handler files registered in index.ts |

### No placeholders check

- All components render real DOM, not "Plan 3" stub text
- All fixtures use realistic data values
- No `TODO`, `TBD`, or `...` in implementation code

### Type consistency check

- `useProfile()` returns `UserProfile` from `src/types/api.ts`
- `useDownloads()` returns `DownloadList` from `src/types/api.ts`
- `usePageContent()` returns `PageContent` from `src/types/api.ts`
- `useContact()` typed with `ContactPayload` and `ContactResponse`
- `useAdminSettings()` / `useUpdateAdminSettings()` use existing `AdminSettings` type
- `useRegister()`, `useSaveInteractionNetwork()` added to `src/api/auth.ts` (modified, not created)
- MSW fixtures all import from `../../types/api` and are properly typed

### AdminSettings field coverage (all 20 fields from `src/types/api.ts`)

Text inputs (4): `title`, `shortTitle`, `url`, `version`
Color inputs (10): `mainColorScheme`, `headerColorScheme`, `logoColorScheme`, `buttonColorScheme`, `queryNodeColor`, `interactorNodeColor`, `publishedEdgeColor`, `validatedEdgeColor`, `verifiedEdgeColor`, `literatureEdgeColor`
Textarea inputs (6): `homePage`, `missionTitle`, `missionText`, `methodTitle`, `methodText`, `footer`
Total: 20/20 — complete coverage.
