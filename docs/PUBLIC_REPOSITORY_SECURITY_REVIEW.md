# Public Repository Security Review

## Result

The frontend contains no detected passwords, private keys, OAuth client secrets, service-account keys, or other credential material.

The deployed Google Apps Script URL is an endpoint, not a private credential. The application now separates the public read endpoint from the authenticated write endpoint.

## Backend write protection

Synchronization writes are protected by the Apps Script backend. The write path requires:

- A signed-in Google account.
- A matching `WRITE_ALLOWED_EMAIL` Apps Script Script Property.
- A separate authenticated web-app deployment for writes.

The allowed email is stored in Apps Script Script Properties and is not committed to GitHub.

The browser does not receive or store a password, API key, OAuth token, or other write secret.

## Public read path

The public deployment remains read-only from the application's security perspective:

- `action=readings` returns readings and tariff configuration.
- `action=tariffs` returns tariff configuration.
- `action=health` returns service status.
- `action=sync` is rejected unless the caller is authorized by the write guard.

Because the read endpoint is public, the Google Sheets data returned by that endpoint should be treated as publicly readable. Do not place private information in the exposed sheets.

## Required deployment configuration

### Public read deployment

- Execute as: deployment owner
- Who has access: anyone, including anonymous users

### Authenticated write deployment

- Execute as: user accessing the web app
- Who has access: any signed-in user
- Backend authorization: `Session.getActiveUser().getEmail()` must match `WRITE_ALLOWED_EMAIL`

## Frontend configuration

`js/config.js` contains two endpoint settings:

- `GOOGLE_SCRIPT_READ_URL` — public read deployment
- `GOOGLE_SCRIPT_WRITE_URL` — authenticated write deployment

Neither setting contains a secret.

## Verification required before making the repository public

1. Anonymous browser can read dashboard data and tariff configuration.
2. Authorized Google account can add/update a reading and synchronize it.
3. Unauthorized signed-in Google account cannot synchronize a reading.
4. Public read deployment rejects `action=sync` without authorization.
5. No secrets are present in Git history or frontend configuration.
6. Only intended personal/non-sensitive data is exposed through the public read endpoint.

## Status

The code changes for the protected write path are prepared. The Apps Script deployment configuration and `WRITE_ALLOWED_EMAIL` property must be completed and tested before the repository is changed from private to public.
