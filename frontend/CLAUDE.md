# Frontend conventions (React + TypeScript + Vite)

Inherits all rules from root `CLAUDE.md`. This file adds frontend-specific
guidance.

## Project structure

The React project will be scaffolded with `npm create vite@latest` in week 10.
Expected structure:

- `src/components/` — reusable presentational components
- `src/features/` — feature folders (search, upload, network, admin) with
  their own components, hooks, types, and tests
- `src/api/` — TanStack Query hooks and fetch clients per resource
- `src/types/` — shared TypeScript types (mainly API response shapes)
- `src/lib/` — utilities (formatters, validators)
- `src/store/` — Zustand client-state stores

Each feature folder is self-contained: components, hooks, tests colocated.

## TypeScript usage

- `strict: false` in tsconfig.
- **Always type API responses** in `src/types/`. Example: `Protein`,
  `Interaction`, `Dataset`, `SearchResults<T>`.
- Use those types in TanStack Query hooks: `useQuery<Protein>(...)`.
- Local `useState` types can be inferred. Don't add type annotations
  for variables TS can infer.
- Avoid `any`. Prefer `unknown` and narrow with type guards when needed.
- Cytoscape.js types are notoriously rough; using `any` for the cy
  instance reference is acceptable, but document why.

## State management

- **Server state**: TanStack Query for everything fetched from the API.
  No manual `useEffect`+`fetch` patterns.
- **Client state**: Zustand for cross-component UI state (theme, modal
  open/closed, current search filters). One store per concern, not a
  monolithic global.
- **Local state**: `useState` for component-local concerns.
- **URL state**: React Router for routes. For search filters that should
  be shareable, use URL params, not Zustand.

## API client conventions

- One file per resource in `src/api/`: `proteins.ts`, `interactions.ts`, etc.
- Each file exports query hooks (`useProteins`, `useProtein(id)`) and
  mutation hooks (`useUploadDataset`).
- Base URL from env var (`VITE_API_BASE_URL`).
- Auth token attached via interceptor; never hardcode.

## Components

- One component per file. File name matches component name.
- PascalCase for components, camelCase for hooks (`useProteinSearch`).
- Props typed with an interface named `<Component>Props`.
- Default to function components with hooks. No class components.
- Compose, don't inherit.

## Cytoscape.js integration

- Use `react-cytoscapejs` for the React wrapper.
- The `cy` instance is captured via `cy={(cy) => { ... }}` callback;
  store the reference in a ref, not state.
- Style/layout config goes in a separate file (e.g.,
  `src/features/network/cytoscapeStyles.ts`) for clarity.
- Phase 1 must replicate legacy node coloring (query/interactor) and
  edge coloring (published/validated/verified/literature) from
  `admin_settings`. Read those values from the API response, not from
  hardcoded constants.

## Tests

- vitest + React Testing Library.
- Test what users see, not implementation details. Prefer `getByRole`
  and `getByText` over `getByTestId`.
- Mock TanStack Query at the hook boundary, not at fetch.
- Test files colocated: `Component.test.tsx` next to `Component.tsx`.

## Styling

- Decision pending: Tailwind vs. CSS Modules vs. styled-components.
- Whatever is chosen, lock it in this file before shipping the first
  feature.

## Common gotchas

- TanStack Query default staleTime is 0 (refetches aggressively).
  Tune per query — proteins/interactions can have a generous staleTime.
- Zustand stores persist across hot reload; if state looks stuck during
  dev, hard refresh.
- React Router v7 changed file structure conventions. We're using v7+
  with the data router API.
