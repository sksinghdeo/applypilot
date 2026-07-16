# Troubleshooting

## The app does not open

Run `node --version`. ApplyPilot requires Node.js 18 or newer. Then run:

```bash
npm install
npm start
```

Open `http://localhost:4173` manually.

## The extension says the local app is unavailable

Keep the terminal running and verify that `http://localhost:4173/api/health` returns JSON. Reload the extension after changing its files.

## Location or salary was not detected

Job sites frequently change markup. ApplyPilot first checks structured data, then page elements, then visible text. Correct the editable fields manually and include a sanitized fixture in a bug report.

## A PDF has no readable text

Image-only or scanned PDFs require OCR, which this release intentionally does not perform. Export the resume as a text-based PDF, DOCX, TXT, or Markdown file.

## Provider analysis falls back to local mode

Check the provider, model ID, API key, account billing, and model access. ApplyPilot returns local analysis instead of failing the entire workflow.

## Chrome did not fill a field

The safe autofill is intentionally conservative. Fields with ambiguous labels, existing values, unsupported controls, or sensitive wording are skipped.
