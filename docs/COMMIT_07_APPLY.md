# Commit 7 — Apply Changes

The Commit 7 package is intentionally a patch package because the supplied project ZIP predates the completed Commit 6 dashboard work.

Apply these changes to your current Commit 6 project.

## 1. Add files

Copy:

- `js/sheets-api.js`
- `js/sheets-sync.js`
- `google-apps-script/Code.gs`
- `docs/COMMIT_07_GOOGLE_SHEETS.md`

## 2. Configure Google Apps Script URL

In `js/config.js`, locate:

```js
API: {
    GOOGLE_SCRIPT_URL: "",
    REQUEST_TIMEOUT: 30000
}
```

Replace only the empty URL:

```js
API: {
    GOOGLE_SCRIPT_URL: "YOUR_DEPLOYED_WEB_APP_URL",
    REQUEST_TIMEOUT: 30000
}
```

The URL is not a private secret.

## 3. Add the synchronization module to index.html

Immediately after:

```html
<script type="module" src="js/app.js"></script>
```

add:

```html
<script type="module" src="js/sheets-sync.js"></script>
```

Do not remove the existing application script.

## 4. Do NOT modify reading.js

Commit 7 intentionally relies on the existing:

```js
window.dispatchEvent(
    new CustomEvent(
        "solar:reading-saved",
        {
            detail: reading
        }
    )
);
```

No reading.js diff is required.

## 5. Apps Script

Copy `google-apps-script/Code.gs` into the Apps Script project bound to the target Google Sheet.

Then deploy it as a Web App and place its URL into `CONFIG.API.GOOGLE_SCRIPT_URL`.

## 6. Verification

Run:

```bash
node --check modules/reading/reading.js
node --check modules/history/history.js
node --check modules/dashboard/dashboard.js
```

For the new module:

```bash
node --check js/sheets-api.js
node --check js/sheets-sync.js
```

Then verify:

- Dashboard loads with Google sync configured.
- Reading save still works.
- New reading appears in Google Sheet.
- Refresh imports remote-only readings.
- Existing reading IDs do not create duplicate rows.
- Local readings remain available when Google Sheets is unavailable.
- History still works.
- Dashboard still works.
- Android/mobile layout still works.
