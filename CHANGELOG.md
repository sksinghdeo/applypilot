# Changelog

## 1.0.1 — Windows installation fix

- Removed environment-specific package registry URLs from `package-lock.json`.
- Added a project `.npmrc` that uses the public npm registry.
- Updated the Windows launcher to install only runtime dependencies from the public registry.
- Removed `node_modules` from the distributable repository package.

## 1.0.0 — 2026-07-16

- complete ApplyPilot visual identity and responsive application shell;
- candidate profile with portfolio/website support;
- PDF, DOCX, TXT, and Markdown resume parsing;
- structured and heuristic extraction for title, company, location, work mode, and salary range;
- confidence indicators and editable extraction fallbacks;
- transparent fit scoring, resume routing, eligibility checks, and answer review;
- local application log and CSV export;
- optional OpenAI, Anthropic, and Gemini adapters with local fallback;
- Manifest V3 extension with safe-field autofill and no automatic submission;
- tests, CI, privacy, security, contribution, demo, and launch documentation.
