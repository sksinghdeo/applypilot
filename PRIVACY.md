# Privacy

ApplyPilot is local-first by design.

## Stored in the browser

The candidate profile, resume records, analysis results, application history, provider selection, and—only if the user chooses—an API key are stored in browser local or session storage.

## Held in server memory

The local Node server temporarily holds the latest browser capture and extension-sync contact profile. These values disappear when the server stops. Uploaded resume files are parsed in memory and are not written to disk.

## Optional provider calls

When a user selects an AI provider, ApplyPilot sends the current candidate profile, capped resume text/summaries, and the current job posting to that provider. Users should review the provider’s privacy and retention controls before enabling this option.

## Deliberate exclusions

ApplyPilot does not require demographic answers. The public repository contains only fictional examples. Do not commit real profiles, resumes, application logs, or keys.

## Deleting local data

Use the application-log controls and browser site-data settings to remove saved information. Removing browser data for `localhost:4173` clears the local workspace.
