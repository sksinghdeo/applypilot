# Deployment Guide

ApplyPilot is primarily a local-first application.

## Local installation

```bash
git clone https://github.com/sksinghdeo/applypilot.git
cd applypilot
npm install
npm start
```

Open `http://localhost:4173`.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `4173` | HTTP port |
| `NODE_ENV` | unset | Runtime environment |

Keep `HOST=127.0.0.1` for normal local use.

## Launchers

- Windows: `RUN_WINDOWS.bat`
- macOS/Linux: `RUN_MAC_LINUX.sh`

## `npm install` and `npm ci`

Use `npm install` for ordinary local setup. Use `npm ci` in CI and clean build environments to install exactly from `package-lock.json`.

## Health check

```text
http://localhost:4173/api/health
```

## Docker

```bash
docker compose up --build
```

Open `http://localhost:4173`.

For local-only Docker use, publish only on loopback:

```yaml
ports:
  - "127.0.0.1:4173:4173"
```

Do not expose the current MVP directly to an untrusted network.

## Fictional public demo

A fictional demo can run on a Node- or Docker-capable platform with:

```text
HOST=0.0.0.0
PORT=<platform port>
```

Use fictional data, disable provider integrations, do not accept real resumes, and display a demonstration-only notice.

## GitHub Pages

GitHub Pages cannot run the complete app because ApplyPilot requires a Node API for resume parsing, capture, extraction, analysis, and optional provider calls.

## Production warning

The repository is not a production multi-user SaaS backend.

Before accepting real hosted data, add:

- authentication and per-user authorization;
- strict origin and extension-session checks;
- TLS;
- rate limiting and abuse prevention;
- encrypted persistent storage;
- secrets management;
- audit and deletion controls;
- privacy disclosures;
- security and legal review.

A hosted server may temporarily receive API keys, candidate profiles, resume text, and job content. Do not describe a hosted deployment as local-only.

## Update an installation

```bash
git pull
npm ci
npm run verify
npm start
```
