# openPIP 2.0

Modernization of [openPIP](https://github.com/BaderLab/openPIP) — the
Open-source Protein Interaction Platform — from PHP 5.6 / Symfony 2.8 /
MySQL to a contemporary stack: Django 5 + DRF / PostgreSQL 16 / React 18
+ TypeScript + Vite.

GSoC 2026 project under [NRNB](https://nrnb.org/). Migration strategy:
functional parity first, enhancements after. See [docs/MIGRATION_STRATEGY.md](docs/MIGRATION_STRATEGY.md).

**Status**: Community bonding (May 2026). Backend scaffold and migration
script land in week 3.

## Project background

openPIP is a customizable web platform for hosting and visualizing
protein-protein interaction (PPI) data, with deployments serving the
Human Reference Interactome (HuRI) and the Yeast Reference Interactome
(YeRI). The original platform was published in Helmy et al., *J. Mol.
Biol.*, 2022 ([DOI](https://doi.org/10.1016/j.jmb.2022.167603)).

This project rebuilds the platform on a modern stack while preserving
exact behavioral parity with the legacy system in Phase 1, then adding
enhancements (CSV upload, async pipelines, UniProt enrichment, GO term
enrichment) in Phase 2.

## Team

| Role | Name | Affiliation |
|---|---|---|
| Student | Mahafujul Hamid Ananda | University of Saskatchewan |
| Primary mentor | Dr. Mohamed Helmy | VIDO, University of Saskatchewan |
| Co-mentor | Dr. Gary Bader | University of Toronto |

## Repository structure

~~~
openpip-2.0/
├── CLAUDE.md                  # Always-loaded context for Claude Code sessions
├── README.md                  # This file
├── .claude/                   # Claude Code config (slash commands, hooks, settings)
├── .mcp.json                  # MCP server config (GitHub, Filesystem)
├── backend/                   # Django REST Framework project (scaffolded in week 3)
├── frontend/                  # React + TypeScript + Vite (scaffolded in week 10)
├── migration/                 # Legacy reference material + migration scripts
│   ├── CLAUDE.md              # Migration-specific conventions
│   ├── legacy-schema/         # MySQL dumps from legacy openPIP
│   ├── legacy-uploader-reference/  # Original Python PSI-MI TAB uploader
│   └── legacy-docker-reference/    # Original Docker setup
├── docs/                      # Deep documentation referenced from CLAUDE.md
│   ├── MIGRATION_STRATEGY.md  # Phase 1/2 boundary, parity protocol
│   ├── DATA_MODEL.md          # 38-table schema + MySQL→Postgres type translation
│   ├── API.md                 # Endpoint catalog (Phase 1 + Phase 2)
│   └── REFERENCES.md          # PSI-MI TAB specs, UniProt API, stack docs
└── .git-credentials-openpip   # (gitignored) GitHub PAT for HTTPS push
~~~

## Quick start for contributors

### Prerequisites

- Node.js 20+ (for Vite, npm, and the Filesystem MCP)
- Python 3.11+ (for Django, scaffolded in week 3)
- PostgreSQL 16 (development DB, week 3+)
- Docker + Docker Compose (for the legacy reference setup and Phase 2 deployment)
- A GitHub Personal Access Token with `Contents: read+write` and
  `Issues: read+write` on this repo (only needed if using Claude Code's
  GitHub MCP)

### Clone

~~~bash
git clone https://github.com/hamid-ananda/openpip-2.0.git
cd openpip-2.0
~~~

### Install the pre-commit hook

The hook lives in `.claude/hooks/pre-commit-lint.sh` and is graceful:
it runs ruff + black + npm run lint on staged files when those tools
are available, and silently skips when they aren't. Wire it in:

~~~bash
ln -s ../../.claude/hooks/pre-commit-lint.sh .git/hooks/pre-commit
chmod +x .claude/hooks/pre-commit-lint.sh
~~~

This is a one-time setup per clone. The hook also blocks commits that
touch paths under `~/openPIP/` (live legacy production).

### Set up GitHub PAT (optional, for Claude Code MCP users)

If you use Claude Code and want the GitHub MCP integration, create a
fine-grained PAT scoped to this repo with `Contents`, `Issues`, `Pull
requests`, and `Actions` access, then put it in a non-committed secrets
file:

~~~bash
cat > ~/.openpip-2.0-secrets <<'EOF'
export GITHUB_TOKEN="github_pat_<your_token_here>"
export GITHUB_USERNAME="<your-github-username>"
export GITHUB_REPO="openpip-2.0"
EOF
chmod 600 ~/.openpip-2.0-secrets
~~~

Add to your `~/.bashrc` to auto-load when entering the project:

~~~bash
function openpip_2_load_secrets() {
  if [[ "$PWD" == "$HOME/openpip-2.0"* ]] && [[ -z "$GITHUB_TOKEN" ]]; then
    [[ -f "$HOME/.openpip-2.0-secrets" ]] && source "$HOME/.openpip-2.0-secrets"
  fi
}
PROMPT_COMMAND="openpip_2_load_secrets;${PROMPT_COMMAND:-}"
~~~

## Development workflow

- **Branch protection on `main`**: force-push blocked, deletion blocked,
  linear history required. Direct pushes allowed in solo phase; will
  add PR review when mentors actively review.
- **Branches**: `feature/<short-name>`, `fix/<short-name>`,
  `docs/<short-name>`, `migrate/<area>` (e.g., `migrate/protein-search`).
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
  format. Types: `feat`, `fix`, `migrate`, `docs`, `test`, `chore`,
  `refactor`. Imperative mood.
- **Tests**: pytest for backend, vitest + React Testing Library for
  frontend. Parity tests in `tests/parity/` compare against legacy.

See `CLAUDE.md` for the full conventions document and verification
checklist.

## Phase plan

### Phase 1: Functional parity (weeks 3–17)

- Every legacy feature replicated on the new stack
- Schema is a 1:1 translation (same tables, columns, relationships)
- UX/UI may be modernized; behavior is preserved
- See [docs/MIGRATION_STRATEGY.md](docs/MIGRATION_STRATEGY.md) for the
  parity test protocol and migration workflow

### Phase 2: Enhancements (weeks 18–22 or post-GSoC)

- CSV upload format alongside PSI-MI TAB
- Real-time validation feedback
- Async import pipeline with SSE/WebSocket progress
- UniProt metadata enrichment
- GO term enrichment analysis

## Live production reference

The current live deployment runs at https://openpip.usask.ca (legacy
PHP/Symfony stack on `~/openPIP/` on the VIDO development server). This
is the source of truth for Phase 1 parity testing.

**The live deployment is read-only reference.** Never modify it. See
the "DO NOT TOUCH LEGACY" section in `CLAUDE.md`.

## Acknowledgments

- [NRNB](https://nrnb.org/) for the GSoC mentorship program
- [VIDO](https://vido.org/) at the University of Saskatchewan
- The original openPIP authors (Helmy et al., 2022)
- The Bader Lab at the University of Toronto

## License

To be confirmed — Phase 1 inherits whatever license legacy openPIP uses;
will check during community bonding.
