# Teaching Guide

MiniCart Admin live delivery runbook for hands-on workshop sessions. This is the step-by-step script for you and the students. Use [WORKSHOP_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/WORKSHOP_GUIDE.md) for reference, troubleshooting, and background notes.

## Workshop Shape

- audience model: hands-on-first
- delivery shape: two modules
- module A: branch-by-branch AppSec lab
- module B: fork-based CI/CD lab
- secure baseline reference: `main`
- CI/CD seed branch: `workshop/ci-seed`
- teaching pattern: student does something, sees a result, then explains why it matters

## Before You Start

### Instructor Prep

Do:

1. verify local tools: Node.js 20+, npm, Docker, Git
2. confirm branches exist:
   ```bash
   git branch -a
   ```
3. create `.env` from `.env.example`
4. set workshop-safe values for:
   - `SESSION_SECRET`
   - `ADMIN_PASSWORD`
5. install and seed the app:
   ```bash
   npm install
   npm run db:reset
   ```
6. verify the secure baseline:
   ```bash
   npm test
   npm start
   ```
7. verify local SonarQube can start on port `9000`
8. prepare a temporary HTTPS tunnel for local SonarQube
9. verify the workshop secrets you will mention in the CI/CD module:
   - `SONAR_HOST_URL`
   - `SONAR_TOKEN`
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`

Expect:
- app boots locally
- tests pass
- you know the current workshop branches before class starts

Why:
- the room should spend time learning, not waiting on setup drift

### Student Prep

Do:

1. install Node.js 20+, npm, Docker, Git
2. fork `bicilique/devsecops-web-monolith-demo` later for Module B
3. clone the repo locally for Module A
4. copy `.env.example` to `.env`
5. set `SESSION_SECRET`
6. set `ADMIN_PASSWORD`
7. run:
   ```bash
   npm install
   npm run db:reset
   ```

Expect:
- students can sign in with the seeded admin account
- students can run the app on port `3000`

Why:
- Module A depends on everyone starting from a known-good secure baseline

## Module A: Branch-by-Branch AppSec Lab

### Module A Overview

The room will move from vulnerable to fixed in this exact order:

```bash
git switch lesson/01-vulnerable
git switch lesson/02-sast-fixes
git switch lesson/03-sca-container-fixes
git switch lesson/04-dast-fixes
git switch main
```

For every branch change:

Do:

1. stop the app if it is still running
2. switch branch
3. run `npm install` only if `package-lock.json` changed on that branch
4. run `npm run db:reset`
5. start the app again

Expect:
- app behavior matches the branch story
- each remediation stage changes one class of finding

Why:
- the exercise only works if the student sees the effect of each fix

### Branch 1: `lesson/01-vulnerable`

#### Step 1: Switch to the vulnerable starting point

Do:

```bash
git switch lesson/01-vulnerable
npm install
npm run db:reset
npm start
```

Expect:
- app boots in intentionally unsafe mode
- students land on the vulnerable training state

Why:
- the class needs a clearly unsafe baseline before any fix work makes sense

#### Step 2: Sign in and show the app surface

Do:

1. open `http://localhost:3000/login`
2. sign in with the lesson credential documented on that branch
3. open the dashboard
4. open the product search flow
5. open at least one product detail page

Expect:
- students can get into the app
- students can see the admin surface that will be scanned and fixed

Why:
- every later scan should map back to a visible app path

#### Step 3: Run the first scan

Do:

```bash
docker run --rm -v "$PWD:/work" -w /work aquasec/trivy fs .
```

Expect:
- scan reports show the branch is intentionally unsafe
- students see that the repo is not yet the secure baseline

Why:
- the first scan teaches the class what “bad” looks like before remediation

#### Step 4: Debrief the vulnerable branch

Do:

1. point out one visible risky behavior
2. point out one scan finding
3. explain that this branch is for learning only

Expect:
- students can describe one thing that feels unsafe
- students can connect the scan output to the app behavior

Why:
- the branch only teaches if students can connect symptoms to evidence

### Branch 2: `lesson/02-sast-fixes`

#### Step 1: Move to source-level fixes

Do:

```bash
git switch lesson/02-sast-fixes
npm install
npm run db:reset
npm start
```

Expect:
- source-level and auth-level fixes are present
- the app still runs normally

Why:
- the class should see that one remediation pass narrows the finding set

#### Step 2: Re-check the same app surface

Do:

1. sign in again
2. revisit the dashboard
3. repeat the product search flow
4. retry the same login and admin routes you used in Branch 1

Expect:
- the source/auth problems from Branch 1 are reduced or gone
- some browser or supply-chain issues still remain by design

Why:
- the class should learn that remediating one category does not finish the job

#### Step 3: Run the focused validation

Do:

```bash
npm test
```

Expect:
- tests still pass
- students see the branch is still stable after the fixes

Why:
- secure changes still need test proof

#### Step 4: Debrief the SAST stage

Do:

1. name the class of issue that improved
2. name one thing that still remains
3. explain why that is expected

Expect:
- students can separate “fixed now” from “still to do later”

Why:
- the workshop is about staged remediation, not one giant cleanup

### Branch 3: `lesson/03-sca-container-fixes`

#### Step 1: Move to supply-chain and image fixes

Do:

```bash
git switch lesson/03-sca-container-fixes
npm install
npm run db:reset
docker build -t minicart-admin:lesson03 .
```

Expect:
- the image builds cleanly
- dependency/container hardening is the main change

Why:
- students should see that app code is only part of the attack surface

#### Step 2: Scan the image or filesystem

Do:

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image minicart-admin:lesson03
```

Expect:
- supply-chain and image findings improve compared with Branch 1

Why:
- this is the stage where students learn about base images and dependency risk

#### Step 3: Compare before and after

Do:

1. compare the Trivy result to Branch 1
2. point to the improved findings
3. point to anything still intentionally unresolved

Expect:
- students can explain the difference between app fixes and image fixes

Why:
- if they cannot explain it, they did not learn the boundary

#### Step 4: Debrief the SCA stage

Do:

1. explain what changed in the image story
2. explain why it matters even if the app routes look fine

Expect:
- students understand why image and dependency risk belong in the workshop

Why:
- real delivery includes what you ship, not only the code you write

### Branch 4: `lesson/04-dast-fixes`

#### Step 1: Move to browser-facing fixes

Do:

```bash
git switch lesson/04-dast-fixes
npm install
npm run db:reset
npm start
```

Expect:
- the browser-facing hardening is present
- the app still behaves like the admin workshop app

Why:
- this is the last remediation step before comparing against the secure baseline

#### Step 2: Re-run browser checks

Do:

1. sign in again
2. open the dashboard
3. browse product list and detail pages
4. try the workflow that used to show browser-facing risk

Expect:
- the browser-facing behavior is safer than earlier branches

Why:
- DAST is about what the browser and scanner can actually see

#### Step 3: Run baseline DAST

Do:

```bash
mkdir -p reports
docker run --rm --network=host -v "$PWD/reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:3000/ -I -r zap-report.html -w zap-report.md
```

Expect:
- reports are written to `reports/zap-report.html` and `reports/zap-report.md`
- the output is cleaner than the earlier vulnerable branch

Why:
- the students should leave this branch understanding the browser risk reduction story

#### Step 4: Debrief the DAST stage

Do:

1. review the ZAP report with the room
2. call out what improved
3. call out what still needs authenticated or deeper testing later

Expect:
- students can explain what the scan proves and what it does not prove

Why:
- DAST is useful, but it is not a complete security program by itself

### Branch 5: `main`

#### Step 1: Compare against the secure baseline

Do:

```bash
git switch main
npm install
npm run db:reset
npm start
```

Expect:
- `main` behaves as the secure release baseline
- students can use it as the comparison point

Why:
- the workshop needs a final known-good reference state

#### Step 2: Final compare

Do:

1. sign in
2. show the dashboard
3. compare the behavior to `lesson/01-vulnerable`
4. ask the room what changed across the whole chain

Expect:
- students can explain the journey from vulnerable to remediated

Why:
- the end state is understanding, not just branch switching

## Module B: GitHub Actions CI/CD Lab

### Module B Overview

Students start from the seeded CI/CD branch and customize a small safe change.

Upstream repo:

- `bicilique/devsecops-web-monolith-demo`

Starting branch:

- `workshop/ci-seed`

### Step 1: Fork and prep the environment

Do:

1. fork `bicilique/devsecops-web-monolith-demo`
2. clone the fork locally
3. enable GitHub Actions in the fork if needed
4. add the fork secrets:
   - `SONAR_HOST_URL`
   - `SONAR_TOKEN`
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
5. make sure local SonarQube is reachable through your temporary tunnel

Expect:
- each student can explain where their pipeline runs
- each student has the secrets needed for the demo

Why:
- the CI/CD module only works if the fork owns the pipeline run

### Step 2: Start from the seeded branch

Do:

```bash
git switch workshop/ci-seed
git switch -c workshop/ci-demo
```

Expect:
- the student starts from the known exercise branch
- the student has a personal branch for their change

Why:
- this avoids branch discovery time and keeps the exercise focused

### Step 3: Make the small app change

Do:

1. edit the dashboard spotlight sentence in `src/views/dashboard.ejs`
2. update the matching assertion in `tests/auth.test.js`
3. keep the change tiny and visible

Expect:
- the dashboard looks slightly different
- the matching test reflects the new text

Why:
- the goal is to exercise the pipeline, not to debug application logic

### Step 4: Commit and push

Do:

```bash
npm install
npm test
git add .
git commit -m "Workshop CI demo change"
git push origin workshop/ci-demo
```

Expect:
- tests pass locally
- the push triggers GitHub Actions in the fork

Why:
- students should see the connection between source change and pipeline run

### Step 5: Watch GitHub Actions

Do:

1. open the fork’s Actions tab
2. open the workflow run from the push
3. inspect the stages in order:
   - install dependencies
   - run test suite
   - generate coverage
   - run SonarQube scan
   - build Docker image
   - run image scan
   - push Docker image

Expect:
- students can point to the test stage
- students can point to the Sonar stage
- students can point to the published image artifact or log output

Why:
- the teaching point is the chain of evidence from code to artifact

### Step 6: SCA via Dependabot

Do:

1. open the fork’s Dependabot view if available
2. inspect `.github/dependabot.yml`
3. explain Dependabot as the repo-native SCA story

Expect:
- students understand that dependency updates are tracked separately from the app change

Why:
- the CI/CD module should show both delivery flow and dependency monitoring

### Step 7: Pull the published image

Do:

1. read the image ref from the workflow artifact or logs
2. pull it locally:
   ```bash
   docker pull <dockerhub-username>/minicart-admin:<branch-and-short-sha>
   ```
3. run it locally:
   ```bash
   docker run --rm -p 3000:3000 \
     -e SESSION_SECRET=workshop-ci-secret \
     -e ADMIN_PASSWORD=workshop-ci-password \
     <dockerhub-username>/minicart-admin:<branch-and-short-sha>
   ```

Expect:
- the published image runs locally
- the health endpoint is reachable

Why:
- students should prove the artifact they built is the one they can run

### Step 8: Run local DAST and collect reports

Do:

```bash
mkdir -p reports
docker run --rm --network=host -v "$PWD/reports:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://127.0.0.1:3000/ -I -r zap-report.html -w zap-report.md
```

Expect:
- `reports/zap-report.html` exists
- `reports/zap-report.md` exists

Why:
- the pipeline produced the image, and local runtime validation proves what it does

### Step 9: Close the loop

Do:

1. review the local ZAP report
2. compare the local runtime result to the Actions result
3. discuss what a real team would keep in the pipeline vs in local validation

Expect:
- students can explain the full CI/CD path end-to-end

Why:
- the workshop outcome is that students can build and try their own pipeline, not just watch yours

## Recovery Notes

If Sonar fails:
- verify the tunnel still points at local SonarQube
- verify `SONAR_HOST_URL`
- verify `SONAR_TOKEN`

If Docker Hub push fails:
- verify `DOCKERHUB_USERNAME`
- verify `DOCKERHUB_TOKEN`
- verify the student can push to that repo manually

If the app will not boot:
- verify `SESSION_SECRET`
- verify `ADMIN_PASSWORD`
- verify port `3000` is free

If ZAP mostly reports redirects:
- that is expected on unauthenticated baseline scans

## Wrap-Up

Do:

1. summarize what changed between branches
2. summarize what the CI/CD path proved
3. ask students which stage gave them the clearest signal

Expect:
- students can explain the branch story and the pipeline story

Why:
- the workshop is successful when students can repeat the workflow on their own
