# Commit 7 — Google Sheets Integration

## Status

Implementation ready; manual Google setup is required before synchronization can be enabled.

## Purpose

Introduce Google Sheets as the online synchronization/data-sharing layer while preserving Local Storage as the usable local cache.

## Architecture

```text
Local Reading
     |
     v
Browser Local Storage
     |
     +---- Google Sheets sync ----> Apps Script Web App
                                      |
                                      v
                                Google Sheet
```

The browser does not contain a Google API private secret.

## Synchronization behaviour

### Startup

When the application loads and a Google Apps Script URL is configured:

1. Read the current Google Sheet records.
2. Merge remote-only records into Local Storage.
3. Keep local records when the same reading ID exists on both sides.
4. Upload the merged Local Storage set to Google Sheets.
5. Refresh Dashboard/History when appropriate.

### New reading

`modules/reading/reading.js` already dispatches:

`solar:reading-saved`

after a successful Local Storage save.

Commit 7 listens to that event and starts synchronization. No change to `reading.js` is required.

### Offline / unavailable Google Sheets

Local Storage remains usable.

If Google Sheets cannot be reached:

- the reading remains saved locally;
- synchronization can be retried on the next application load or after another reading is saved;
- the application must not replace local data with an empty remote response.

## Identity and duplicate rule

The reading `id` is the primary identity.

- Local-only record -> uploaded.
- Remote-only record -> added locally.
- Same ID -> local record wins during merge.
- No duplicate row is created for an existing ID.
- Deletion propagation is out of scope for Commit 7.

## Google Sheet schema

Sheet name:

`Solar Energy Dashboard`

Columns:

| Column | Reading property |
|---|---|
| ID | `id` |
| Reading Date | `readingDate` |
| Grid Import | `gridImport` |
| Grid Export | `gridExport` |
| Solar Generation | `solarInverter` |
| Month End | `isMonthEnd` |
| Solar Generation Units | `calculation.solarGeneration` |
| Grid Import Units | `calculation.gridImportUnits` |
| Grid Export Units | `calculation.gridExportUnits` |
| Home Consumption | `calculation.homeConsumption` |
| Created At | `createdAt` |

The calculation values are stored so the synchronized record preserves the exact result already calculated by the application.

## Security

Do not put a Google OAuth private client secret, service-account private key, or other private credential in frontend JavaScript.

The Commit 7 Apps Script endpoint is intended for the application's controlled/personal deployment. If the application is later exposed publicly, replace the unrestricted web-app deployment with an authenticated OAuth-based architecture before treating the synchronization endpoint as production-grade.

## Manual setup

### 1. Create the Google Sheet

Create a Google Sheet named:

`Solar Energy Dashboard`

The Apps Script will create the application sheet tab named:

`Solar Energy Dashboard`

### 2. Create Apps Script

Open:

**Extensions -> Apps Script**

Replace the generated `Code.gs` with the Commit 7 `google-apps-script/Code.gs`.

Save the project.

### 3. Deploy as Web App

Use:

**Deploy -> New deployment -> Web app**

Recommended execution:

- Execute as: **Me**
- Access: choose the narrowest access level that works for the intended users.

Copy the deployed **Web App URL**.

### 4. Configure the frontend

In `js/config.js`, set:

```js
API: {
    GOOGLE_SCRIPT_URL: "YOUR_DEPLOYED_WEB_APP_URL",
    REQUEST_TIMEOUT: 30000
}
```

Do not add a private API secret.

### 5. Load the sync module

Add this module after the existing application module in `index.html`:

```html
<script type="module" src="js/sheets-sync.js"></script>
```

No change to `reading.js` is required.

### 6. Test the endpoint

Open the deployed Web App URL in a browser.

The default GET action should return JSON containing:

- `ok: true`
- `readings: [...]`

### 7. Test synchronization

1. Open the application.
2. Add a reading.
3. Confirm the reading remains visible locally.
4. Confirm a corresponding row appears in Google Sheets.
5. Refresh the application.
6. Confirm the reading remains available.
7. Test with Google Sheets temporarily unavailable and confirm local readings still work.

## Out of scope

- Advanced analytics.
- Tariff configuration.
- PWA installability.
- Deleting remote records from the application.
- Multi-user conflict resolution.
- Google OAuth production architecture.
