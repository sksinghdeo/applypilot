# AI Provider Guide

ApplyPilot works in local mode without an API key. Provider-assisted analysis is optional.

## Local mode

Local mode uses deterministic heuristics for role alignment, skill overlap, experience checks, location preferences, blocker detection, resume routing, and answer preparation.

No API key is required, and no provider request is made.

## Optional providers

The repository includes adapters for:

- OpenAI Responses API
- Anthropic Messages API
- Gemini Generate Content API

Provider model availability can change. Use a model ID currently available in your account.

## Add a provider

1. Open **AI settings**.
2. Select the provider.
3. Enter a valid model ID.
4. Enter the API key.
5. Choose whether to remember the key in the browser.
6. Save settings.
7. Analyze a job.

If the provider call fails, ApplyPilot returns local analysis with a warning.

## Billing

Consumer subscriptions and developer API usage are usually separate. API billing, model access, rate limits, and usage are managed by each provider.

## Key storage

- Remember enabled: browser local storage.
- Remember disabled: browser session storage.
- Keys are not written to the repository or server filesystem.
- The local server uses the key only for the explicit provider request.

Never commit, screenshot, share, or include an API key in an issue. Rotate it immediately if exposed.

## Data sent to a provider

Provider mode can send:

- current candidate profile;
- capped resume text and summaries;
- current job posting;
- local-analysis baseline;
- non-secret model settings.

Review the provider's current privacy, retention, and billing controls before enabling it.

## Sensitive answers

Provider output still requires review for sponsorship, citizenship, permanent residency, export control, clearance, compensation, demographics, background checks, legal attestations, signatures, and generated motivation responses.

## Common failures

- invalid key;
- missing billing;
- unavailable or incorrect model ID;
- rate limit;
- network or provider outage;
- request-size limit;
- invalid JSON output.

ApplyPilot falls back to local analysis.

## Remove a stored key

Clear the API-key field and save settings. Clear browser site data for `localhost:4173` if needed.

## Hosted-use warning

The current repository is designed for local use. A hosted server may temporarily receive provider keys, candidate data, resume text, and job content. Do not accept real multi-user data without authentication, authorization, TLS, rate limiting, secrets management, deletion controls, and security review.
