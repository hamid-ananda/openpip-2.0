# openPIP 2.0 — Known Bugs & Issues

Tracked here until migrated to the project issue tracker.
Format: **[STATUS]** — `open` · `in-progress` · `fixed` (include commit).

---

## Open

### BUG-001 — Password reset email not delivered

**Status:** `open`  
**Severity:** High (blocks user self-service account recovery)  
**Reported:** 2026-05-23  

**Symptoms:**  
Submitting the Forgot Password form returns a success message but no email arrives.
The backend is running with `openpip.settings.dev`, which uses Django's
`console` email backend — messages are printed to stdout instead of sent via SMTP.

**Root cause (two parts):**  
1. Production stack is not using `docker-compose.prod.yml` override, so
   `DJANGO_SETTINGS_MODULE=openpip.settings.dev` → `EMAIL_BACKEND=console`.
2. `FRONTEND_URL` defaults to `http://localhost:5173`, so even if the email
   were sent the reset link would point at the dev server.

**Fix — part 2 already committed** (`docker-compose.prod.yml`):
- `FRONTEND_URL` default now set to `https://openpip.usask.ca/v2`.
- SMTP env vars (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`,
  `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`) plumbed through prod override.

**Remaining action:**  
- Add real SMTP credentials to `.env` on the server.
- Start the stack with the prod override:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d
  ```

---

### BUG-002 — Password reset link goes to wrong base URL in dev

**Status:** `open`  
**Severity:** Low (dev only)  
**Reported:** 2026-05-23  

**Symptoms:**  
When `FRONTEND_URL` is unset, the reset link uses the `localhost:5173` default
regardless of where the app is actually running.

**Fix:** Set `FRONTEND_URL` in `.env` or the relevant compose override.  
Prod override now defaults this to `https://openpip.usask.ca/v2` (BUG-001 fix).

---

## Fixed

_(none yet)_
