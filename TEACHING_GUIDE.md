# Teaching Guide

MiniCart Admin live delivery runbook for hands-on workshop sessions. This file is the instructor script. Use [WORKSHOP_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/WORKSHOP_GUIDE.md) as reference and troubleshooting, not as the live classroom sequence.

## Workshop Shape

- audience model: hands-on-first
- total flow: two modules
- module A: branch-by-branch AppSec lab
- module B: GitHub Actions CI/CD lab
- secure baseline reference: `main`
- teaching progression: start vulnerable, end fixed

## Before the Session

Instructor setup:

1. verify local tools: Node.js 20+, npm, Docker, Git
2. clone repo and confirm branches exist:
   ```bash
   git branch -a
   ```
3. create `.env` from `.env.example`
4. set workshop-safe values for:
   - `SESSION_SECRET`
   - `ADMIN_PASSWORD`
5. install dependencies and seed DB:
   ```bash
   npm install
   npm run db:reset
   ```
6. verify app:
   ```bash
   npm test
   npm start
   ```
7. verify local SonarQube can start on port `9000`
8. prepare a temporary HTTPS tunnel for local SonarQube
9. verify GitHub repo secrets on your demo fork or participant instructions cover:
   - `SONAR_HOST_URL`
   - `SONAR_TOKEN`
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`

Audience prerequisites:

1. GitHub account
2. Docker Hub account
3. Docker running locally
4. fork of the repo ready
5. local clone of their fork

## Module A: Branch-by-Branch AppSec Lab

### Flow overview

Use this exact branch order:

```bash
git switch lesson/01-vulnerable
git switch lesson/02-sast-fixes
git switch lesson/03-sca-container-fixes
git switch lesson/04-dast-fixes
git switch main
```

For every branch transition, tell the room:

- stop the app if it is running
- switch branch
- run `npm install` only if `package-lock.json` changed
- run `npm run db:reset`
- rerun the app

### Branch 1: `lesson/01-vulnerable`

Goal:
- show the intentionally unsafe starting point

Instructor says:
- “This branch is where we want the room to see problems clearly before we fix them.”
- “We are not chasing every issue. We are isolating a few high-signal problems.”

Instructor does:

```bash
git switch lesson/01-vulnerable
npm install
npm run db:reset
npm start
```

Audience does:

1. switch to `lesson/01-vulnerable`
2. install deps if prompted by lockfile change
3. reset DB
4. start the app
5. sign in with the lesson credential documented in that branch
6. open the Product search flow and vulnerable screens
7. run one scanner command:
   ```bash
   docker run --rm -v "$PWD:/work" -w /work aquasec/trivy fs .
   ```

Expected result:
- participants can reproduce vulnerable behavior
- scan output shows the branch is intentionally unsafe

What to say:
- “We need an unsafe starting point so fixes are visible.”
- “This branch is for learning only, never deployment.”

Move-on condition:
- room can point to at least one visible risky behavior and one matching scan finding

### Branch 2: `lesson/02-sast-fixes`

Goal:
- show SAST/auth improvements while browser-facing and dependency issues still remain

Instructor says:
- “We are fixing source-level and auth-level issues first.”
- “Notice what disappears and what does not.”

Instructor does:

```bash
git switch lesson/02-sast-fixes
npm install
npm run db:reset
npm start
```

Audience does:

1. switch to `lesson/02-sast-fixes`
2. reset DB
3. rerun the app
4. repeat the auth and source-related checks from branch 1
5. rerun one focused validation:
   ```bash
   npm test
   ```

Expected result:
- hardcoded-credential/auth-gap style issues are gone
- other browser or dependency issues still remain by design

What to say:
- “One remediation pass should reduce one class of findings, not magically fix everything.”

Move-on condition:
- room can explain what improved and what intentionally stayed broken

### Branch 3: `lesson/03-sca-container-fixes`

Goal:
- show dependency and container hardening

Instructor says:
- “Now we move from code issues to supply-chain and image issues.”

Instructor does:

```bash
git switch lesson/03-sca-container-fixes
npm install
npm run db:reset
docker build -t minicart-admin:lesson03 .
```

Audience does:

1. switch to `lesson/03-sca-container-fixes`
2. install deps if lockfile changed
3. rebuild the image
4. rerun image or filesystem scan:
   ```bash
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image minicart-admin:lesson03
   ```

Expected result:
- supply-chain and image findings improve compared with `lesson/01-vulnerable`

What to say:
- “AppSec is not just routes and templates. The image and dependency tree matter too.”

Move-on condition:
- room sees why this branch is the SCA/container remediation step

### Branch 4: `lesson/04-dast-fixes`

Goal:
- show browser-facing fixes and safer runtime behavior

Instructor says:
- “This branch closes the remaining user-facing web risks.”

Instructor does:

```bash
git switch lesson/04-dast-fixes
npm install
npm run db:reset
npm start
```

Audience does:

1. switch to `lesson/04-dast-fixes`
2. reset DB
3. start the app
4. rerun browser/manual checks
5. rerun baseline DAST:
   ```bash
   mkdir -p reports
   docker run --rm --network=host -v "$PWD/reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
     zap-baseline.py -t http://127.0.0.1:3000/ -I -r zap-report.html -w zap-report.md
   ```

Expected result:
- browser-facing behavior is safer than earlier lesson branches

What to say:
- “This is the remediation state just before we compare to the secure release baseline.”

Move-on condition:
- room sees fewer browser-facing findings and safer app behavior

### Branch 5: `main`

Goal:
- land on the secure baseline

Instructor says:
- “`main` is the release-grade comparison point for this workshop.”

Instructor does:

```bash
git switch main
npm install
npm run db:reset
npm start
```

Audience does:

1. switch to `main`
2. reset DB
3. run app smoke check
4. compare current behavior against `lesson/01-vulnerable`

Expected result:
- room can describe the journey from vulnerable to remediated state

What to say:
- “The important skill is not just finding bugs. It is proving that a fix changed the outcome.”

Move-on condition:
- room can explain the role of all five branches

## Module B: GitHub Actions CI/CD Lab

### Goal

Have each participant make a small code change in their fork, push it, watch GitHub Actions run through test and local-Sonar-backed quality scanning, build and push a Docker image to Docker Hub, then pull that same image locally and run DAST plus reporting.

Upstream repo for this module:

- `bicilique/devsecops-web-monolith-demo`
- starting branch: `workshop/ci-seed`

### Before participants start

Instructor says:
- “This module is about traceable delivery: code change, test run, quality check, image build, image publish, local validation.”

Audience does:

1. fork `bicilique/devsecops-web-monolith-demo`
2. clone the fork
3. enable GitHub Actions in the fork if needed
4. add fork secrets:
   - `SONAR_HOST_URL`
   - `SONAR_TOKEN`
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
5. verify local SonarQube is running on your machine or use the instructor-provided Sonar instance
6. expose local SonarQube through a temporary tunnel
7. store that tunnel URL in `SONAR_HOST_URL`

Instructor checkpoint:
- do not continue until at least one participant can show all four secrets configured

### Canonical participant change

Use one predictable classroom change:

1. switch to `workshop/ci-seed`
2. create a personal feature branch in the fork
3. edit the dashboard spotlight sentence in `src/views/dashboard.ejs`
4. update the matching assertion in `tests/auth.test.js`

Example branch:

```bash
git switch workshop/ci-seed
git switch -c workshop/ci-demo
```

Seeded edit targets:

- view target: sentence under `WORKSHOP_CI_DEMO` comment in `src/views/dashboard.ejs`
- test target: assertion under `WORKSHOP_CI_DEMO` comment in `tests/auth.test.js`

### CI/CD execution flow

Audience does:

```bash
npm install
npm test
git add .
git commit -m "Workshop CI demo change"
git push origin workshop/ci-demo
```

Then:

1. open the Actions tab in the fork
2. open the workflow run triggered by the push
3. inspect these stages in order:
   - install dependencies
   - run test suite
   - generate coverage
   - run SonarQube scan
   - build Docker image
   - run image scan
   - push Docker image

Expected result:
- workflow passes through test and Sonar steps if secrets are correct
- a published image ref is attached in `reports/published-image.txt`

What to say:
- “Our CI proof is not just green or red. It is the chain of evidence from source change to produced artifact.”

### Dependabot SCA segment

Instructor says:
- “For this workshop, Dependabot is the SCA teaching mechanism inside the GitHub experience.”

Audience does:

1. open the fork’s Dependabot alerts and dependency graph areas if available
2. inspect `.github/dependabot.yml`
3. understand that dependency monitoring runs separately from the app-change workflow

Expected result:
- room understands Dependabot as the repo-native dependency update and alert story

### Pull the published image locally

Audience does:

1. download the workflow artifact or inspect the job log for the published image ref
2. pull the image:
   ```bash
   docker pull <dockerhub-username>/minicart-admin:<branch-and-short-sha>
   ```
3. run the image locally:
   ```bash
   docker run --rm -p 3000:3000 \
     -e SESSION_SECRET=workshop-ci-secret \
     -e ADMIN_PASSWORD=workshop-ci-password \
     <dockerhub-username>/minicart-admin:<branch-and-short-sha>
   ```

Instructor checkpoint:
- confirm the room can reach `http://127.0.0.1:3000/health`

### Local DAST and reporting

Audience does:

```bash
mkdir -p reports
docker run --rm --network=host -v "$PWD/reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:3000/ -I -r zap-report.html -w zap-report.md
```

Expected result:
- local reports appear at:
  - `reports/zap-report.html`
  - `reports/zap-report.md`

What to say:
- “CI produced the artifact. Local validation proves what that artifact does at runtime.”

### CI/CD move-on condition

Do not end the module until participants can point to all of these:

- pushed code change in their fork
- successful test stage
- SonarQube stage connected to reachable Sonar server
- published image reference
- local `docker pull` success
- local ZAP report files

## Common Live Recovery Steps

SonarQube step fails:
- verify tunnel URL still works
- verify `SONAR_HOST_URL` secret matches the current tunnel URL
- verify `SONAR_TOKEN` still valid

Docker Hub push fails:
- verify `DOCKERHUB_USERNAME`
- verify `DOCKERHUB_TOKEN`
- verify participant can push manually to the target repo

Workflow skips push:
- expected on pull-request runs
- use the push-triggered branch run for image publishing

Local container boot fails:
- verify `SESSION_SECRET`
- verify `ADMIN_PASSWORD`
- verify port `3000` free

ZAP produces mostly redirects:
- expected on unauthenticated baseline scans
- use report to discuss surface reduction, not authenticated coverage depth

## Related Docs

- [README.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/README.md)
- [WORKSHOP_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/WORKSHOP_GUIDE.md)
- [SECURITY.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/SECURITY.md)
- [QA_REPORT.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/QA_REPORT.md)
