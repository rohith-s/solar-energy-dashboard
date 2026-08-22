# Commit 10 — Public Readiness / Protected Write Path

## Purpose

Prepare the Solar Energy Dashboard for a public GitHub repository without exposing an unrestricted Google Sheets write operation.

## Changes

- Split the browser configuration into a public read URL and an authenticated write URL.
- Added an Apps Script authorization guard for `sync` writes.
- The allowed Google account is stored in Apps Script Script Properties as `WRITE_ALLOWED_EMAIL`.
- Public reads remain available for readings and tariff master data.
- No Google API secret, password, OAuth token, or write credential is stored in the browser.
- Reading calculation logic and tariff effective-date logic are unchanged.

## Deployment model

### Read deployment

Public/anonymous access. Used by `GOOGLE_SCRIPT_READ_URL`.

### Write deployment

Signed-in Google users only. The Apps Script runs as the accessing user and verifies the active user's email against `WRITE_ALLOWED_EMAIL`. Used by `GOOGLE_SCRIPT_WRITE_URL`.

## Required manual configuration

1. Save the updated `Code.gs` in the bound Apps Script project.
2. Add Script Property:
   - Name: `WRITE_ALLOWED_EMAIL`
   - Value: the Google account allowed to write readings.
3. Keep the existing public deployment for reads.
4. Create a new web-app deployment for writes:
   - Execute as: User accessing the web app
   - Who has access: Anyone (signed-in users)
5. Copy the new `/exec` URL into `js/config.js` as `GOOGLE_SCRIPT_WRITE_URL`.
6. Deploy the frontend and test both read and write paths.

## Security boundary

The public read endpoint is intentionally readable. The write endpoint is the protected boundary. The frontend must never contain a write password or secret.
