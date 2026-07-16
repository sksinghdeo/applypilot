# Browser Extension Guide

ApplyPilot Companion is a Manifest V3 extension for user-triggered job capture and conservative routine-field autofill.

## Install

1. Start ApplyPilot at `http://localhost:4173`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository's `extension` folder.
6. Pin ApplyPilot Companion.

## Permissions

```json
["activeTab", "scripting", "storage"]
```

Host access is limited to:

```text
http://localhost:4173/*
```

| Permission | Purpose |
|---|---|
| `activeTab` | Access the current page only after a user click |
| `scripting` | Run capture or safe autofill on the active page |
| `storage` | Store the routine profile and latest job preview |
| Localhost access | Communicate with the local ApplyPilot server |

## Sync routine contact fields

1. Save the candidate profile.
2. Select **Sync to extension** in ApplyPilot.
3. Open the extension.
4. Select **Sync profile**.

The sync may include name, email, phone, location, LinkedIn, and portfolio/website. Sensitive eligibility data is not included.

## Capture a job page

1. Open a job posting.
2. Open the extension.
3. Select **Capture job page**.
4. Open ApplyPilot and select **Use captured browser job**.
5. Verify all extracted fields.

The capture can include page title, URL, visible text, `JobPosting` JSON-LD, and selected DOM fields.

## Safe autofill

The extension can attempt to fill empty routine fields matching:

- first, middle, last, or full name;
- email;
- phone;
- LinkedIn;
- portfolio or website;
- current city or location.

## Deliberately skipped fields

ApplyPilot skips fields associated with:

- salary or compensation;
- visa or sponsorship;
- citizenship or export control;
- security clearance;
- demographics;
- date of birth or Social Security number;
- background checks;
- criminal history;
- passwords;
- legal attestations;
- signatures.

It also skips existing values, disabled or read-only controls, file inputs, checkboxes, radio buttons, hidden fields, and unsupported custom controls.

## Known limitations

Custom ATS components, cross-origin iframes, ambiguous labels, and changing page markup may prevent extraction or autofill. Manual entry is the correct fallback.

## Reload after extension changes

1. Open the extension-management page.
2. Select **Reload**.
3. Refresh the job page.
4. Reopen the extension.
