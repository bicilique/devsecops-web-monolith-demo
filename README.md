# MiniCart Admin

Phase 1 bootstrap for DevSecOps workshop training.

## Requirements

- Node.js 20+
- npm
- Docker Desktop or Docker Engine with Compose

## Setup

```bash
npm install
cp .env.example .env
edit .env
npm run db:reset
```

## Run locally

```bash
npm run db:init
npm run dev
```

Production-style run:

```bash
npm start
```

App defaults to `http://localhost:3000`.

Phase 2 demo credential:

- username: `admin`
- password: value of `ADMIN_PASSWORD` from your local `.env`

## Tests

```bash
npm test
```

Coverage for CI and Sonar:

```bash
npm run test:coverage
```

## Database scripts

```bash
npm run db:init
npm run db:seed
npm run db:reset
```

Phase 1 only creates SQLite foundation. Schema and seed data arrive in Phase 2.

Phase 4 secure baseline:

- `SESSION_SECRET` required for app startup
- `ADMIN_PASSWORD` required for `db:seed` and `db:reset`
- seeded password value is read from environment, not hardcoded in app code

## CI pipeline

GitHub Actions workflow lives at `.github/workflows/devsecops.yml`.

Pipeline order:

1. install dependencies
2. run Jest suite
3. generate coverage at `coverage/lcov.info`
4. run SonarQube SAST when Sonar secrets exist
5. run Trivy filesystem scan
6. build Docker image
7. run Trivy image scan
8. start app with `npm start`
9. wait for `GET /health`
10. run ZAP baseline scan against app root URL
11. upload reports as workflow artifacts

Workshop-mode gate behavior:

- failing install, tests, coverage, Docker build, DB reset, or health check fails the workflow
- Sonar, Trivy, and ZAP findings are soft-gated and produce reports without turning the workflow red by default
- Sonar is skipped cleanly when secrets are not configured

Required GitHub secrets for SonarQube:

- `SONAR_TOKEN`
- `SONAR_HOST_URL`

Workflow artifacts:

- `coverage/lcov.info`
- `reports/trivy-fs.txt`
- `reports/trivy-image.txt`
- `reports/zap-report.html`
- `reports/zap-report.md`
- `reports/app.log`

## Docker

```bash
docker compose up --build
```

## Environment variables

- `PORT`: HTTP port for Express server. Default `3000`.
- `SQLITE_DB_PATH`: SQLite file path. Default `./data/minicart-admin.sqlite`.
- `SESSION_SECRET`: required session signing secret for `express-session`.
- `ADMIN_PASSWORD`: required seeded password for demo administrator account.
