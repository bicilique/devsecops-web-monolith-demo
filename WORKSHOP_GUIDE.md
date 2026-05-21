# Workshop Guide

MiniCart Admin workshop guide for instructor and participant use. Current repo state supports secure-baseline setup, scans, CI review, secure behavior review. Lesson branches exist for vulnerable and progressive-fix training flow. Use [TEACHING_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/TEACHING_GUIDE.md) when you need the live step-by-step classroom script.

## Instructor Preparation Checklist

- install Node.js 24+, npm, Docker, Docker Compose
- clone repo
- create `.env` from `.env.example`
- set workshop-safe `SESSION_SECRET`
- set workshop-safe `ADMIN_PASSWORD`
- run `npm install`
- run `npm run db:reset`
- verify `npm test`
- verify `npm run test:coverage`
- verify `npm start`
- verify `http://localhost:3000/health`
- optionally pre-pull scanner images:
  - `sonarqube:community`
  - `sonarsource/sonar-scanner-cli`
  - `aquasec/trivy`
  - `ghcr.io/zaproxy/zaproxy:stable`
- prepare GitHub repo secrets if demoing Actions Sonar step:
  - `SONAR_TOKEN`
  - `SONAR_HOST_URL`
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`

## Participant Setup Checklist

- install Node.js 24+, npm, Docker
- clone repo
- copy `.env.example` to `.env`
- set `SESSION_SECRET`
- set `ADMIN_PASSWORD`
- run `npm install`
- run `npm run db:reset`
- start app with `npm run dev` or `npm start`
- open `http://localhost:3000/login`
- sign in with:
  - username `admin`
  - password = local `ADMIN_PASSWORD`

Docker-only fallback for participants without local Node.js/npm:

- install Docker and Docker Compose
- clone repo
- copy `.env.example` to `.env`
- set `SESSION_SECRET`
- set `ADMIN_PASSWORD`
- run `docker compose up -d --build`
- open `http://localhost:3000/login`
- sign in with username `admin` and local `ADMIN_PASSWORD`

## Demo Flow

Primary secure reference is `main`. Current `dev` branch is workshop index and day-to-day change branch.

1. Show repo structure: app code, tests, Dockerfile, workflow, docs.
2. Start app locally.
3. Sign in as **Administrator**.
4. Show Product list, detail, create/edit path, Audit Log view.
5. Run tests and coverage.
6. Run SonarQube, Trivy, ZAP commands.
7. Review scan output and explain why fixed baseline should reduce obvious findings.
8. Open CI workflow definition and show pipeline stages.
9. Explain lesson progression:
   - vulnerable branch
   - staged fix branches
   - fix-and-rescan teaching loop
10. Optionally move into the CI/CD lab in [TEACHING_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/TEACHING_GUIDE.md) for fork-based Actions, Docker Hub publish, local DAST, and report collection.

## SAST Demo Section

Goal: show static scan + code-quality view on fixed baseline.

Start local SonarQube:

```bash
docker run -d --name minicart-sonarqube -p 9000:9000 sonarqube:community
```

Run scanner from repo root:

```bash
docker run --rm \
  -e SONAR_HOST_URL="http://host.docker.internal:9000" \
  -e SONAR_TOKEN="replace-with-sonar-token" \
  -v "$PWD:/usr/src" \
  sonarsource/sonar-scanner-cli
```

Teaching points:

- secure baseline avoids hardcoded session secret
- secure baseline avoids hardcoded seeded password in source
- secure baseline uses parameterized SQLite queries
- secure baseline keeps auth middleware on admin routes
- findings still possible from dependency or hygiene issues outside app logic

## Trivy Demo Section

Filesystem scan:

```bash
docker run --rm -v "$PWD:/work" -w /work aquasec/trivy fs .
```

Build image:

```bash
docker build -t minicart-admin:local .
```

Image scan:

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image minicart-admin:local
```

Teaching points:

- filesystem scan catches package vulnerabilities
- image scan catches base image and OS package issues
- fixed branch may still report ecosystem vulnerabilities even when app logic hardened

## DAST Demo Section

Start app first:

```bash
npm start
```

Run ZAP baseline:

```bash
mkdir -p reports
docker run --rm --network=host -v "$PWD/reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:3000/ -I -r zap-report.html -w zap-report.md
```

Teaching points:

- fixed branch should keep security headers via Helmet
- session cookies should use `HttpOnly` and `SameSite=Lax`
- unauthenticated scans mainly see login redirects and public health endpoint
- ZAP baseline is useful but limited without authenticated spidering

## Fix-and-Rescan Learning Flow

`main` already represents fixed baseline side of story.

Phase 7 learning path:

1. start at `lesson/01-vulnerable`
2. run scans, collect findings
3. move to `lesson/02-sast-fixes`
4. rerun scans, compare reduced SAST findings
5. move to `lesson/03-sca-container-fixes`
6. rerun Trivy against code and image
7. move to `lesson/04-dast-fixes`
8. rerun ZAP and manual checks
9. compare vulnerable vs fixed branch behavior

## Security Gate Discussion

Current GitHub Actions gate behavior:

- test, coverage, Docker build, DB reset, health check -> hard fail
- SonarQube, Trivy, ZAP findings -> soft gate by default
- Sonar step skipped when secrets missing
- Docker Hub push skipped when Docker Hub secrets missing or workflow runs on pull request

## CI/CD Lab Notes

For the live CI/CD module:

- use [TEACHING_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/TEACHING_GUIDE.md) as the primary script
- start participants from upstream branch `workshop/ci-seed`, not directly from `main`
- run SonarQube locally and expose it through a temporary tunnel for GitHub-hosted runners
- have participants work in forks so their Actions runs and Docker Hub credentials stay isolated
- use `.github/dependabot.yml` as the repository-native SCA teaching artifact
- pull the published image locally after the workflow completes, then run ZAP outside Actions for the runtime-validation segment

Discussion prompts:

- when should security findings fail pipeline?
- should SAST and SCA fail on high severity only?
- should DAST run authenticated in later maturity stage?
- what findings belong in backlog vs release blocker?

## Common Errors

`SESSION_SECRET is required.`

- set `SESSION_SECRET` in `.env`
- restart app

`ADMIN_PASSWORD is required for database seeding.`

- set `ADMIN_PASSWORD`
- rerun `npm run db:reset`

Login fails for `admin`

- reset DB after password change
- use exact current `.env` password

Port `3000` busy

- stop other local process
- or change local `PORT`

Sonar scanner cannot connect

- wait for SonarQube startup
- verify token
- verify host mapping from scanner container

Trivy image scan cannot reach Docker

- verify Docker daemon running
- verify `/var/run/docker.sock` mount allowed

ZAP output mostly redirects

- expected on unauthenticated baseline scan

## Expected Findings Matrix

Branch mapping below reflects current workshop branch set.

| ID | Finding | Tool | Vulnerable Branch | Fixed Branch |
|---|---|---|---|---|
| F-001 | Hardcoded secret | SonarQube | Present in `lesson/01-vulnerable` | Fixed on `main` |
| F-002 | SQL injection | SonarQube / ZAP | Present in `lesson/01-vulnerable` | Fixed on `main` |
| F-003 | Reflected XSS | ZAP | Present in `lesson/01-vulnerable` | Fixed on `main` |
| F-004 | Stored XSS | ZAP / Manual | Present in `lesson/01-vulnerable` | Fixed on `main` |
| F-005 | Missing security headers | ZAP | Present in `lesson/01-vulnerable` | Fixed on `main` |
| F-006 | Insecure cookie flags | ZAP | Present in `lesson/01-vulnerable` | Fixed on `main` |
| F-007 | Vulnerable dependency | Trivy | Present in `lesson/01-vulnerable` | Fixed by `lesson/03-sca-container-fixes` and `main` |
| F-008 | Vulnerable base image | Trivy | Present in `lesson/01-vulnerable` | Fixed by `lesson/03-sca-container-fixes` and `main` |
| F-009 | Unsafe file upload | Manual / ZAP | Present in `lesson/01-vulnerable` | Fixed on `main` |
| F-010 | Missing auth middleware | Manual / Test | Present in `lesson/01-vulnerable` | Fixed on `main` |

## Branch Explanation

Current docs describe three branch roles:

- `main`: secure baseline
- `dev`: workshop index and active development branch
- `lesson/*`: vulnerable and staged-fix teaching states

Snapshot refs verified on 2026-05-19:

- `dev` -> `903d12c`
- `lesson/01-vulnerable` -> `a9de6cc`
- `lesson/02-sast-fixes` -> `b5b74da`
- `lesson/03-sca-container-fixes` -> `643b346`
- `lesson/04-dast-fixes` -> `1bf1784`

Branch checkout examples:

```bash
git switch main
git switch dev
git switch lesson/01-vulnerable
git switch lesson/02-sast-fixes
git switch lesson/03-sca-container-fixes
git switch lesson/04-dast-fixes
```
