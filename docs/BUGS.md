# openPIP 2.0 — Known Bugs & Issues

Tracked here until migrated to the project issue tracker.
Format: **[STATUS]** — `open` · `in-progress` · `fixed` (include commit).

---

## Open

_(none)_

---

## Fixed

### BUG-001 — Password reset email not delivered

**Status:** `fixed` — cause removed, not repaired  
**Severity:** was High (blocked user self-service account recovery)  
**Reported:** 2026-05-23 · **Closed:** 2026-08-15  

**Symptoms:**  
Submitting the Forgot Password form returned a success message but no email
arrived. The backend was running `openpip.settings.dev`, whose `console` email
backend prints messages to stdout instead of sending them.

**Why it was not simply repaired:**  
Making it work needed an SMTP relay openPIP does not have, and every fix
attempt would have left account recovery depending on mail being configured
correctly on each deployment — the exact failure mode that produced this bug.

Account recovery now runs on security questions instead: three questions set at
registration, hashed like passwords, answered to mint the same reset token the
emailed link used to carry. That left `PasswordResetRequestView` with no
callers in the frontend, the CLI, or the docs, and it was the only `send_mail`
in the codebase.

**Fix:** deleted the endpoint, its route and tests, and the `EMAIL_*`,
`DEFAULT_FROM_EMAIL` and `FRONTEND_URL` settings along with their compose and
`.env.example` plumbing. openPIP now sends no mail at all, so there is no mail
configuration to get wrong. Anything added later that must send will have to
set up a backend deliberately.

**Note for operators:** users created before the security-questions migration
have none set and cannot self-recover. Reset those from the Django shell.

---

### BUG-002 — Password reset link goes to wrong base URL in dev

**Status:** `fixed` — cause removed  
**Severity:** was Low (dev only)  
**Reported:** 2026-05-23 · **Closed:** 2026-08-15  

**Symptoms:**  
When `FRONTEND_URL` was unset, the emailed reset link used the
`localhost:5173` default regardless of where the app was actually running.

**Fix:** the only consumer of `FRONTEND_URL` was the reset email deleted in
BUG-001; the setting is gone with it. The reset page is now reached by an
in-app redirect, which cannot point at the wrong host.
