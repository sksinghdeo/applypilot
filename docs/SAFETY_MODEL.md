# Safety Model

ApplyPilot uses capability boundaries rather than relying only on warning text.

> AI may prepare information. The candidate approves consequential answers and controls final submission.

## Allowed preparation

ApplyPilot may:

- extract public job-posting content from the active page;
- compare the posting with user-entered facts;
- identify possible gaps and blockers;
- route resumes;
- prepare routine contact fields;
- draft reviewable answers;
- keep and export a local decision log.

## Mandatory human review

Explicit review is required for:

- work authorization and sponsorship;
- citizenship and permanent residency;
- export-control status;
- security clearance;
- compensation commitments;
- demographic and voluntary self-identification questions;
- background-check authorization;
- criminal-history questions;
- legal attestations;
- electronic signatures;
- agreements to terms;
- generated motivation responses;
- final submission.

## Current enforcement

| Boundary | Enforcement |
|---|---|
| Sensitive answers | Never pre-approved |
| Routine autofill | Requires an explicit extension click |
| Sensitive autofill | Conservative denylist and field matching |
| Existing values | Left unchanged |
| Final submission | Not implemented |
| CAPTCHA or 2FA bypass | Not implemented |
| Credential harvesting | Not implemented |
| Background messaging | Not implemented |
| Mass applications | Not implemented |
| Provider failure | Falls back to local analysis |
| Uncertain extraction | Editable fields and confidence indicators |

## Disallowed behavior

ApplyPilot must not:

- submit applications automatically;
- apply unattended to large numbers of jobs;
- bypass CAPTCHA, 2FA, access controls, or website restrictions;
- collect job-board credentials;
- impersonate a candidate;
- fabricate qualifications or candidate facts;
- automatically answer sensitive questions;
- send background messages or connection requests;
- hide material uncertainty.

## Fit-score limitation

The fit score is heuristic. It depends on supplied profile and job text, may miss context, does not represent an employer evaluation, and does not guarantee an interview or offer.

## Eligibility limitation

Blocker detection uses text patterns and saved profile values. It can miss restrictions, misread ambiguous wording, or produce false positives. Verify the original posting and obtain qualified legal or immigration advice when needed.

## Provider-assisted analysis

Provider output can be wrong. ApplyPilot runs local analysis first, instructs providers not to invent facts, normalizes responses, forces sensitive answers to unapproved status, and falls back to local analysis on failure.

## Reporting safety issues

Use private security reporting for vulnerabilities. Use normal issues for false blocker patterns, unsafe field classification, inaccurate extraction, or missing review checkpoints. Use fictional or sanitized examples only.
