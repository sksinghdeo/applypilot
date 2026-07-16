# Contributing to ApplyPilot

Thank you for helping improve ApplyPilot.

## Before opening a pull request

1. Create an issue for significant behavior or architecture changes.
2. Use only fictional candidate and job data.
3. Run `npm install` and `npm run verify`.
4. Test the web app in local mode.
5. For extension changes, load `extension/` unpacked and test only with accounts and pages you are authorized to use.
6. Update documentation and tests with behavior changes.

## Pull-request expectations

- focused scope;
- clear screenshots for UI changes;
- tests for extraction or scoring changes;
- no API keys, personal resumes, addresses, immigration details, or real application logs;
- no features that bypass access controls, CAPTCHA, 2FA, or human review.

## Coding style

The app intentionally uses a low-dependency Node and browser-JavaScript stack. Prefer readable modules, explicit error handling, accessible HTML, and conservative defaults.
