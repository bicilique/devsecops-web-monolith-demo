# MiniCart Admin

MiniCart Admin is workshop training application for learning DevSecOps against small Node.js monolith. Current branch is `lesson/04-dast-fixes`: final lesson branch with browser-facing fixes restored and behavior aligned with fixed baseline.

## Training Warning

This branch is `lesson/04-dast-fixes`.

It closes remaining browser-facing lessons from earlier branches. Use `dev` as fixed reference branch; this lesson branch should now behave the same from workshop perspective. See [SECURITY.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/SECURITY.md).

## Project Purpose

MiniCart Admin exists to support full-day DevSecOps workshop flow:

- bootstrap local monolith
- run tests and CI
- scan source, dependencies, container image, live app
- compare vulnerable and fixed training paths
- practice remediation and rescanning

## Architecture Overview

Current app shape:

- Node.js 20 + Express 4 server
- EJS server-rendered views
- SQLite database in `data/`
- session auth with `express-session`
- Product catalog CRUD-lite: list, search, detail, create, edit
- Audit Log history for catalog changes
- file upload pipeline for Product images
- Dockerfile + `docker-compose.yml`
- GitHub Actions DevSecOps pipeline in `.github/workflows/devsecops.yml`

Key runtime paths:

- app entry: `src/server.js`
- Express wiring: `src/app.js`
- DB helpers and schema/seed logic: `src/db.js`
- routes: `src/routes/`
- tests: `tests/`

## Requirements

- Node.js 20+
- npm
- Docker Desktop or Docker Engine with Compose

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
SESSION_SECRET=replace-with-local-session-secret
ADMIN_PASSWORD=replace-with-workshop-password
```

Initialize workshop data:

```bash
npm run db:reset
```

## Run Locally

Development mode:

```bash
npm run dev
```

Production-style mode:

```bash
npm start
```

App default URL:

```text
http://localhost:3000
```

Health check:

```bash
curl http://127.0.0.1:3000/health
```

## Run with Docker

Create `.env` first so Compose can read `SESSION_SECRET`.

```bash
docker compose up --build
```

App stays at `http://localhost:3000`.

Stop stack:

```bash
docker compose down
```

## Demo Credentials

Current branch uses env-driven seeded demo user again:

- username: `admin`
- password: value of `ADMIN_PASSWORD` from local `.env`

## Database Scripts

```bash
npm run db:init
npm run db:seed
npm run db:reset
```

Meaning:

- `db:init` creates tables
- `db:seed` inserts demo User, Products, Audit Logs
- `db:reset` recreates clean seeded workshop DB

## Tests

Run tests:

```bash
npm test
```

Generate coverage for CI/Sonar:

```bash
npm run test:coverage
```

Coverage output:

```text
coverage/lcov.info
```

## SonarQube Scan Instructions

Docker-first local SonarQube:

```bash
docker run -d --name minicart-sonarqube -p 9000:9000 sonarqube:community
```

Wait for SonarQube at `http://localhost:9000`, create token, then scan from repo root:

```bash
docker run --rm \
  -e SONAR_HOST_URL="http://host.docker.internal:9000" \
  -e SONAR_TOKEN="replace-with-sonar-token" \
  -v "$PWD:/usr/src" \
  sonarsource/sonar-scanner-cli
```

Repo uses [sonar-project.properties](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/sonar-project.properties) for source, test, coverage paths.

Stop SonarQube when done:

```bash
docker rm -f minicart-sonarqube
```

## Trivy Scan Instructions

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

## OWASP ZAP Scan Instructions

Start app first with `npm start` or `docker compose up --build`, then run baseline scan:

```bash
docker run --rm --network=host -v "$PWD/reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:3000/ -I -r zap-report.html -w zap-report.md
```

Generated reports:

- `reports/zap-report.html`
- `reports/zap-report.md`

## GitHub Actions Pipeline

Workflow file:

```text
.github/workflows/devsecops.yml
```

Pipeline order:

1. install dependencies
2. run Jest suite
3. generate coverage
4. run SonarQube scan when `SONAR_TOKEN` and `SONAR_HOST_URL` exist
5. run Trivy filesystem scan
6. build Docker image
7. run Trivy image scan
8. reset DB
9. start app with `npm start`
10. wait for `/health`
11. run ZAP baseline
12. upload reports and coverage artifacts

Workshop gate behavior:

- install/test/coverage/build/health failures fail workflow
- Sonar, Trivy, ZAP findings are soft-gated by default
- Sonar step skips cleanly when secrets missing

Workflow artifacts:

- `coverage/lcov.info`
- `reports/trivy-fs.txt`
- `reports/trivy-image.txt`
- `reports/zap-report.html`
- `reports/zap-report.md`
- `reports/app.log`

## Branch Strategy

Current branch:

- `lesson/04-dast-fixes`: final lesson branch aligned with fixed baseline behavior

Lesson branches:

- `lesson/01-vulnerable`
- `lesson/02-sast-fixes`
- `lesson/03-sca-container-fixes`
- `lesson/04-dast-fixes`

Use lesson branches for workshop progression:

- start from intentionally vulnerable lesson branch
- demonstrate findings
- apply staged remediations
- rescan after each lesson branch

Use current `dev` as fixed reference branch. Use `lesson/*` branches for workshop progression and rescans.

## Related Docs

- [SECURITY.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/SECURITY.md)
- [WORKSHOP_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/WORKSHOP_GUIDE.md)
- [MiniCart_Admin_8_Phase_Roadmap_Fresh.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/MiniCart_Admin_8_Phase_Roadmap_Fresh.md)
- [CONTEXT.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/CONTEXT.md)

## Troubleshooting

`SESSION_SECRET is required.`

- set `SESSION_SECRET` in `.env`
- restart `npm start`, `npm run dev`, or `docker compose up --build`

`ADMIN_PASSWORD is required for database seeding.`

- set `ADMIN_PASSWORD` in `.env`
- rerun `npm run db:reset`

Port `3000` already in use

- stop other local app using `3000`
- or change `PORT` in `.env` for local run

Docker Compose app exits at boot

- verify `.env` exists
- verify `SESSION_SECRET` is set
- check container logs with `docker compose logs app`

Login fails with `admin`

- rerun `npm run db:reset` after setting `ADMIN_PASSWORD`
- sign in with `admin` and exact current `ADMIN_PASSWORD` value

Sonar scan cannot reach server

- confirm SonarQube container healthy on `http://localhost:9000`
- verify `SONAR_HOST_URL` passed to scanner
- on non-macOS hosts, replace `host.docker.internal` with reachable host address if needed

Trivy or ZAP command fails to write reports

- create reports dir first: `mkdir -p reports`

CI Sonar step skipped

- expected when `SONAR_TOKEN` or `SONAR_HOST_URL` secret missing

ZAP reports mostly redirects to `/login`

- expected on fixed baseline when scanning unauthenticated root flow
