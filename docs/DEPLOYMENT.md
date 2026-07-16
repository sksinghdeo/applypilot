# Deployment guide

ApplyPilot is designed primarily as a local-first application. The simplest and most private deployment is `npm start` on the candidate's own computer.

## Docker

```bash
docker compose up --build
```

Open `http://localhost:4173`.

The container does not include a database or persistent server-side storage. Candidate data and application history remain in the browser. Resume uploads are parsed in memory and are not written to the container filesystem.

## Hosting a demonstration

A public demonstration can run the Node server on any platform that supports Node 18+ or Docker. Configure:

```text
HOST=0.0.0.0
PORT=<platform-provided port>
```

For a public demo, use fictional data and keep provider integrations disabled.

## Production warning

The repository is not a production multi-user SaaS backend. Before accepting real user data on a public deployment, add:

- authentication and per-user authorization;
- TLS termination and secure headers at the edge;
- request-size limits, rate limiting, and abuse prevention;
- encrypted data storage and deletion controls;
- a secrets-management system;
- privacy disclosures and consent flows appropriate to the deployment;
- security review and dependency monitoring.

A hosted server may temporarily receive resume text, job content, or provider keys during explicit user actions. Do not market a public deployment as local-only.

## GitHub Pages

GitHub Pages alone cannot run ApplyPilot because the project includes a Node API for resume parsing, job capture, and optional model-provider calls. Use GitHub for source control and deploy the Node service separately when a hosted demo is needed.
