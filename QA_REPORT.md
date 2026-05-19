# QA Report

Date: 2026-05-19  
Repo: `devsecops-web-monolith-demo`

## Scope

Phase 8 final QA, release promotion, branch publish, and workshop dry run evidence for **MiniCart Admin**.

## Branch Snapshot

Pre-promotion snapshot on `dev`:

- `dev` -> `903d12c`
- `main` -> `c51f5b4`
- `lesson/01-vulnerable` -> `a9de6cc`
- `lesson/02-sast-fixes` -> `b5b74da`
- `lesson/03-sca-container-fixes` -> `643b346`
- `lesson/04-dast-fixes` -> `1bf1784`

Post-promotion refs:

- `main` -> pending Phase 8 git merge in this report update
- `dev` -> pending Phase 8 doc/report commit in this report update

## Commands Executed

Secure baseline QA:

- `npm test`
- `env SESSION_SECRET=phase8-local-secret ADMIN_PASSWORD=phase8-admin-secret npm run db:reset`
- `env SESSION_SECRET=phase8-local-secret ADMIN_PASSWORD=phase8-admin-secret npm start`
- `curl -i http://127.0.0.1:3000/health`
- `curl -i http://127.0.0.1:3000/login`
- login/logout and authenticated route checks via `curl`
- `env SESSION_SECRET=phase8-docker-secret ADMIN_PASSWORD=phase8-docker-admin docker compose up --build -d`
- container health/login/dashboard checks via `curl`
- `env SESSION_SECRET=phase8-docker-secret ADMIN_PASSWORD=phase8-docker-admin docker compose down`

Security tooling:

- `docker run --rm -v "$PWD:/work" -w /work aquasec/trivy fs .`
- `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image devsecops-web-monolith-demo-app`
- `docker run --rm --network=host -v "$PWD/reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://127.0.0.1:3000/ -I -r zap-report.html -w zap-report.md`

Lesson-branch intent checks:

- `git show lesson/01-vulnerable:src/config.js`
- `git show lesson/01-vulnerable:src/routes/products.js`
- `git show lesson/02-sast-fixes:src/config.js`
- `git show lesson/03-sca-container-fixes:Dockerfile`
- `git show lesson/03-sca-container-fixes:package.json`
- `git show lesson/04-dast-fixes:src/app.js`
- `git show lesson/04-dast-fixes:src/views/product-detail.ejs`

## App Checklist

Status: pass

- `npm test` passed: 9 suites, 40 tests
- DB reset passed with env-driven `ADMIN_PASSWORD`
- local runtime booted on port `3000`
- `GET /health` returned `200 {"status":"ok"}`
- login with `admin` plus seeded `ADMIN_PASSWORD` succeeded
- logout invalidated access to `/admin`
- dashboard rendered
- product list, search, detail, create, edit flows worked
- image upload flow worked
- audit log route worked
- Docker compose build/start passed with explicit env
- container health and login/dashboard checks passed

## Security Checklist

Status: pass

- secure baseline keeps protected admin routes
- secure baseline keeps parameterized SQL
- secure baseline keeps escaped Product rendering
- secure baseline keeps upload validation
- secure baseline keeps Helmet headers
- session cookie observed with `HttpOnly` and `SameSite=Lax`
- no real secrets introduced during QA
- lesson branches remain training-only by design

## Lesson Branch Intent Checks

Status: pass

- `lesson/01-vulnerable` still contains hardcoded fake credential/session-secret patterns
- `lesson/01-vulnerable` exposes `GET /admin/audit-logs` without auth
- `lesson/02-sast-fixes` restores env-driven credential/secret handling
- `lesson/03-sca-container-fixes` restores safer Node 20 Alpine image and removes intentionally pinned vulnerable dep
- `lesson/04-dast-fixes` restores Helmet, secure cookie settings, and escaped Product description rendering

## Scanning Checklist

Status: pass with findings

- Trivy filesystem scan completed
- Trivy image scan completed
- ZAP baseline scan generated reports against local app root/login flow
- workflow/report paths already exist in `.github/workflows/devsecops.yml`

Observed findings:

- Trivy filesystem scan reported 7 vulnerabilities in `package-lock.json` when suppressing dev/test dependencies:
  - 1 low
  - 6 high
- image scan reported remaining image/package vulnerabilities in workshop image dependency tree
- ZAP baseline against unauthenticated root flow was expected to spend most of its time on redirects to `/login` plus public endpoints

## Docs Checklist

Status: pass after Phase 8 doc refresh

- root docs explain `main` secure baseline and `dev` workshop-index role
- root docs include published lesson branch chain
- root docs include exact snapshot SHAs and copy-paste checkout examples
- `README.md`, `SECURITY.md`, and `WORKSHOP_GUIDE.md` stay aligned with branch reality

## Residual Risks

- secure baseline still inherits ecosystem vulnerabilities reported by Trivy
- Docker Compose requires `.env` or explicit env injection for `SESSION_SECRET` and `ADMIN_PASSWORD`
- lesson branches are intentionally unsafe and must stay isolated to workshop/lab use

## Final Verdict

Release readiness: pending final git merge/push steps in this phase.

Technical readiness before merge/push: yes.
