# ApplyPilot Documentation

ApplyPilot is a local-first, human-in-the-loop job application copilot. This folder contains the product documentation for users, contributors, and maintainers.

> ApplyPilot prepares information and highlights decisions. It does not automatically submit applications, bypass website controls, or provide legal or immigration advice.

## For users

- [User Guide](USER_GUIDE.md) — complete workflow from setup to saving a decision
- [Browser Extension Guide](EXTENSION_GUIDE.md) — installation, capture, profile sync, and safe autofill
- [AI Provider Guide](AI_PROVIDERS.md) — local mode and optional OpenAI, Anthropic, and Gemini setup
- [Troubleshooting](TROUBLESHOOTING.md) — common installation and workflow issues

## For developers

- [Architecture](ARCHITECTURE.md) — components, API endpoints, storage, and data flow
- [Deployment](DEPLOYMENT.md) — local startup, Docker, demo hosting, and production warnings
- [Safety Model](SAFETY_MODEL.md) — capability boundaries and mandatory human review
- [Brand Guide](BRAND.md) — logo usage, colors, voice, and screenshot rules

## Repository-level policies

These files remain in the repository root because GitHub recognizes or surfaces them there:

- [`README.md`](../README.md)
- [`PRIVACY.md`](../PRIVACY.md)
- [`SECURITY.md`](../SECURITY.md)
- [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md)
- [`CHANGELOG.md`](../CHANGELOG.md)
- [`ROADMAP.md`](../ROADMAP.md)
- [`LICENSE`](../LICENSE)

## Quick reference

```text
Install:        npm install
Start:          npm start
Open:           http://localhost:4173
Health check:   http://localhost:4173/api/health
Tests:          npm test
Verification:   npm run verify
```

## Documentation rules

Documentation should describe only implemented behavior, use fictional examples, distinguish local use from hosted use, and never include real resumes, application answers, API keys, credentials, or personal data.
