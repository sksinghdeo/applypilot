# User Guide

## 1. Requirements

- Node.js 18 or newer
- npm
- A Chromium-based browser for the extension

ApplyPilot runs at `http://localhost:4173`.

## 2. Start the app

### Windows

Double-click `RUN_WINDOWS.bat`.

### macOS/Linux

```bash
chmod +x RUN_MAC_LINUX.sh
./RUN_MAC_LINUX.sh
```

### Manual startup

```bash
npm install
npm start
```

Keep the terminal open while using ApplyPilot.

## 3. Create a candidate profile

Open **Candidate profile** and enter only facts you can verify:

- routine contact information;
- LinkedIn and portfolio/website URLs;
- documented experience;
- skills;
- work-authorization facts;
- target roles and locations;
- compensation and work-arrangement preferences.

Work authorization, sponsorship, citizenship, export-control status, and security clearance are sensitive. Verify them independently.

## 4. Add resumes

Open **Resume library** and upload PDF, DOCX, TXT, or Markdown files up to 8 MB.

ApplyPilot parses files in server memory and does not write the original resume to disk. Review the detected role family, keywords, and summary.

Image-only PDFs are not OCR'd.

## 5. Install and sync the extension

Follow [EXTENSION_GUIDE.md](EXTENSION_GUIDE.md).

After saving the candidate profile:

1. select **Sync to extension** in the app;
2. open ApplyPilot Companion;
3. select **Sync profile**.

Only routine contact fields are synced.

## 6. Capture a job

Open a job posting and select **Capture job page** in the extension.

The extraction pipeline checks:

1. `schema.org/JobPosting`;
2. known and generic page elements;
3. visible page text;
4. editable manual fallback.

## 7. Verify extracted fields

Open **Analyze a job** and select **Use captured browser job**.

Review title, company, location, work mode, compensation, URL, and description. Confidence indicators are not guarantees.

## 8. Analyze the opportunity

Select **Analyze job** to generate:

- fit score;
- recommendation;
- matched and unverified skills;
- experience comparison;
- common blockers and risks;
- resume recommendation;
- proposed answers.

The fit score is a decision aid, not a hiring prediction.

## 9. Review answers

Open **Review answers**.

Routine factual answers may be prepared. Sensitive or generated answers require explicit review, including sponsorship, citizenship, clearance, compensation, legal attestations, and motivation responses.

## 10. Use safe autofill

The extension may fill empty routine fields such as name, email, phone, location, LinkedIn, and portfolio/website.

It intentionally skips sensitive, legal, demographic, salary, password, signature, and unsupported fields.

It never submits the form.

## 11. Save and export decisions

Select **Save decision** to add the opportunity to the local application log.

You can export:

- candidate profile as JSON;
- application history as CSV.

## 12. Delete local data

Delete individual records in the app or clear browser site data for `localhost:4173`.

Stopping the server clears the latest in-memory capture and routine extension-sync profile.

## Limitations

- Job sites change frequently.
- Extraction may require manual correction.
- Resume routing depends on document quality.
- Local scoring is heuristic.
- ApplyPilot does not replace human review or qualified legal advice.
