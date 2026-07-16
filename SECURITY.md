# Security Policy

## Supported version

Security fixes are applied to the latest release on the default branch.

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, personal data, or real resumes. Contact the repository maintainer privately through the security-reporting method configured on the GitHub repository.

Include:

- affected version and component;
- reproducible steps using fictional data;
- impact and suggested remediation;
- whether any secret or personal information may have been exposed.

## Security design

- local server binds to `127.0.0.1` by default;
- restrictive content security and browser permission headers;
- request-size limits;
- no server-side credential persistence;
- explicit extension actions instead of background page control;
- sensitive field denylist for autofill;
- no automatic final submission;
- secret-pattern scan in `npm run lint`.
