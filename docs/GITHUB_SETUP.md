# GitHub publishing checklist

## Repository settings

- **Repository name:** `applypilot`
- **Description:** `Privacy-first, human-in-the-loop job application copilot with local analysis and a Chrome browser companion.`
- **Visibility:** Public
- **License:** MIT
- **Default branch:** `main`

Recommended topics:

```text
ai-agents job-search browser-extension human-in-the-loop nodejs privacy-first automation resume open-source
```

## Before the first push

1. Replace `YOUR_USERNAME` in `README.md`.
2. Confirm that only fictional candidate data exists in `examples/`, screenshots, and tests.
3. Run `npm ci` and `npm run verify`.
4. Start the app and load the fictional demo.
5. Load the unpacked extension and test capture plus safe autofill.
6. Review `PRIVACY.md`, `SECURITY.md`, and the disclaimer.

## Social preview

In **Settings → General → Social preview**, upload:

```text
media/social-preview.png
```

## First release

Create a GitHub release tagged `v1.0.0` with:

- title: `ApplyPilot v1.0.0 — Local-first MVP`
- the summary from `CHANGELOG.md`
- the GitHub-ready source ZIP
- optionally, `media/ApplyPilot_LinkedIn_Demo_1080x1350.mp4`

## Recommended repository features

- Enable Issues and Discussions.
- Keep Dependabot and the CI workflow enabled.
- Add branch protection after the initial push if collaborators will contribute.
- Do not upload API keys, real resumes, job-board credentials, or private application answers.
