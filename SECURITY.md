# Security Notice

## Training-Only Use

MiniCart Admin exists for DevSecOps workshop and local security training. Current branch is intentionally insecure `lesson/01-vulnerable`. Use only for teaching.

## Do Not Deploy Vulnerable Lesson Branches Publicly

Do not expose this branch to internet, shared public demo host, customer network, production environment.

Safe posture:

- run locally
- run in isolated workshop lab
- destroy environment after training if needed

## Do Not Use Real Secrets

Use fake workshop values only for:

- `SESSION_SECRET`
- `ADMIN_PASSWORD`
- Sonar tokens used in demo environments

Never commit:

- real passwords
- production API keys
- customer data
- internal certificates

## Authorized Scanning Only

Use SonarQube, Trivy, ZAP, manual testing only against systems you own or are explicitly authorized to assess.

Allowed target for this repo:

- local MiniCart Admin instance
- isolated training environment created for workshop

Not allowed:

- public third-party targets
- customer assets without written approval
- internet hosts unrelated to workshop

## Responsible Use

Vulnerable lesson branches exist to teach detection and remediation, not abuse.

Rules:

- keep payloads non-destructive
- do not connect training app to real systems
- do not store real sensitive data
- document branch purpose clearly
- use findings to teach fix-and-rescan flow

## Current Branch Status

Current branch is intentionally vulnerable branch. It is suitable for:

- scanner demos
- exploit walkthroughs
- fix-and-rescan teaching
- comparison against later fix branches

## Related Docs

- [README.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/README.md)
- [WORKSHOP_GUIDE.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/WORKSHOP_GUIDE.md)
- [MiniCart_Admin_8_Phase_Roadmap_Fresh.md](/Users/balaisertifikasielektronik/IdeaProjects/Github/project/devsecops-web-monolith-demo/MiniCart_Admin_8_Phase_Roadmap_Fresh.md)
