# Troubleshooting

## The app does not open

```bash
node --version
npm --version
npm install
npm start
```

ApplyPilot requires Node.js 18 or newer. Open `http://localhost:4173`.

## Windows installation fails

Open Command Prompt in the project folder:

```bat
if exist node_modules rmdir /s /q node_modules
npm cache verify
npm install --omit=dev --registry=https://registry.npmjs.org/
npm start
```

Check your internet connection, VPN, firewall, proxy, antivirus, and current folder.

## npm uses the wrong registry

```bash
npm config get registry
npm config set registry https://registry.npmjs.org/
```

Delete `node_modules` and reinstall.

## Port 4173 is already in use

### PowerShell

```powershell
$env:PORT=4174
npm start
```

### macOS/Linux

```bash
PORT=4174 npm start
```

Extension features expect port 4173 unless the extension configuration is also changed.

## Health check fails

Open `http://localhost:4173/api/health`.

Keep the terminal running, review startup errors, and confirm the port.

## Extension unavailable

- confirm the local app is running;
- reload the extension;
- refresh the job page;
- verify the extension was loaded from the `extension` folder.

## Extension changes do not appear

Open the extension-management page, select **Reload**, refresh the job page, and reopen the popup.

## Location or salary is missing

Job sites frequently change markup. ApplyPilot checks structured data, page elements, then visible text. Correct the editable fields manually and verify the original posting.

## PDF has no readable text

Image-only PDFs require OCR, which this release does not perform. Use a text-based PDF, DOCX, TXT, or Markdown file.

## Resume upload fails

Check the format, 8 MB limit, readable text, and whether the local server is running.

## Resume routing seems wrong

Improve the resume role family, keywords, summary, and extracted-text quality.

## Fit score seems wrong

Review target roles, excluded roles, skills, experience years, locations, job-description completeness, and resume metadata. The score is heuristic.

## Provider falls back to local mode

Check provider, model ID, API key, billing, model access, rate limits, network connectivity, and provider status.

## API key is not remembered

Enable **Remember API key in this browser** before saving. Otherwise the key is session-only.

## Remove a stored key

Clear the key and save settings, then clear browser site data for `localhost:4173` if needed.

## Chrome does not fill a field

The field may already contain a value, have an ambiguous label, be sensitive, use an unsupported custom control, be disabled/read-only, or be inside an inaccessible iframe.

## Fictional demo remains after restart

The workspace is in browser storage. Clear site data for `localhost:4173`.

## Application history disappeared

Browser data may have been cleared or a different browser profile, hostname, port, or private session may be in use. Export CSV backups when needed.

## Docker cannot start

```bash
docker compose build --no-cache
docker compose up
```

Check Docker Desktop, port availability, registry access, and disk space.

## Reporting a bug

Include operating system, browser, Node version, reproduction steps, expected result, actual result, and sanitized console output. Never include real resumes, API keys, credentials, or private application answers.
