# Solar Energy Dashboard

A lightweight web-based Solar Energy Dashboard for recording, analysing and
tracking household solar generation, grid import/export and APSPDCL energy
settlement.

## Features

- Dashboard with current energy position
- Manual meter reading entry
- Month-end cumulative meter baseline handling
- Solar Generation as a direct period value
- Home Consumption calculation
- Reading history
- Historical analytics
- APSPDCL net energy position
- Positive/negative net settlement analysis
- Configurable export settlement rate
- Effective-date based tariff management
- Google Sheets synchronization
- Google Sheets tariff master
- Responsive laptop and Android/mobile UI

## Energy Calculation Rules

### Grid Import

For cumulative grid meters:

Grid Import Units =
Current Reading - Previous Month-End Reading

### Grid Export

For cumulative grid meters:

Grid Export Units =
Current Reading - Previous Month-End Reading

### Solar Generation

Solar Generation is stored as the direct value for the current
month/period.

### Home Consumption

Home Consumption =
Solar Generation + Grid Import Units - Grid Export Units

### APSPDCL Net Energy Position

Net Energy Position =
Grid Export Units - Grid Import Units

Positive value:
- Net export to APSPDCL
- Settlement/revenue calculation applies

Negative value:
- Net import from APSPDCL
- Tariff calculation applies

## Tariff Management

Tariffs are maintained in Google Sheets and selected according to their
effective date.

Example:

| Tariff | Effective From | Effective To |
|---|---|---|
| 2025-26 | 01-Apr-2025 | 31-Mar-2026 |
| 2026-27 | 01-Apr-2026 | 31-Mar-2027 |
| 2027-28 | 01-Apr-2027 | 31-Mar-2028 |

Adding a future tariff year does not require a JavaScript code change.

Google Sheets is the source of truth.

Local Storage is used as a cache/offline fallback.

## Google Sheets

The Google Spreadsheet contains separate areas for:

### Solar Energy Dashboard

Stores meter readings.

Current columns:

- ID
- Reading Date
- Grid Import
- Grid Export
- Solar Generation
- Month End
- Solar Generation Units
- Grid Import Units
- Grid Export Units
- Home Consumption
- Created At

### Tariff Master

Stores one configuration row per tariff year, including:

- Tariff version
- Effective From
- Effective To
- Connection type
- Phase
- Contract/recorded MD
- Fixed/customer charges
- Export settlement rate

### Tariff Slabs

Stores slab-wise energy tariff rates for each tariff version.

## Google Apps Script

The project uses a Google Apps Script Web App as the API layer between
the browser and Google Sheets.

The browser communicates with the deployed Apps Script Web App rather
than directly accessing the spreadsheet.

After synchronization:

1. Readings are retrieved.
2. Tariff configuration is retrieved.
3. Local Storage is updated.
4. Dashboard/Analytics data is refreshed.
5. A sync completion confirmation is displayed.


## Public repository / GitHub Pages security note

The frontend contains the deployed Google Apps Script Web App URL because the browser needs a public read path for readings and tariff configuration. The URL is an endpoint, not a Google API secret.

The synchronization write path is separate from the public read path. Write requests must use the authenticated Apps Script deployment and the signed-in Google account configured in the Apps Script `WRITE_ALLOWED_EMAIL` script property. No password, API key, OAuth token, or write secret is stored in the frontend.

Before making the GitHub repository public:

1. Keep the public read deployment available for anonymous reads.
2. Create a separate Apps Script web-app deployment for authenticated writes.
3. Configure the write deployment to run as the accessing user and allow signed-in users.
4. Set the Apps Script `WRITE_ALLOWED_EMAIL` script property to the Google account allowed to modify readings.
5. Set `GOOGLE_SCRIPT_WRITE_URL` in `js/config.js` to the authenticated write deployment URL.
6. Verify anonymous reads, authorized writes, and unauthorized write rejection.

Google Sheets remains the source of truth for readings and tariff master data.

**Do not treat the current backend as a public production API or expose the repository publicly until the Apps Script write path is restricted/authenticated.** Never place Google OAuth client secrets, service-account private keys, passwords, or other private credentials in frontend files.

## Local Storage

Local Storage is used for application caching.

Important keys include:

- `solarEnergyDashboard.tariffConfigs`
- `solarEnergyDashboard.tariffConfig`

These values should not be treated as the primary tariff master.

Google Sheets remains the source of truth.

## FPPCA

FPPCA is currently excluded from calculations because the required
calculation methodology has not been configured.

## Responsive UI

The application supports:

- Laptop/Desktop
- Tablet
- Android/mobile

Mobile navigation uses the hamburger menu.

## Development

The application is a client-side JavaScript application and can be
run locally using a simple web server.

### Run the Local Development Server

The application can be served locally using Python's built-in HTTP server.

From the project root directory, run:

```bash
python -m http.server 8080
```

Example:

```text
http://localhost:8080
```