# P2 — Google Sheets Tariff Master

## Purpose

Move tariff version management out of browser-only Local Storage and make Google Sheets the source of truth for APSPDCL tariff versions.

Local Storage remains a browser cache/fallback so the application can continue to calculate when Google Sheets is temporarily unavailable.

## Google Sheets structure

Keep the existing **Solar Energy Dashboard** reading tab unchanged.

Add two tabs in the same Google Spreadsheet:

### 1. Tariff Master

| Column | Purpose |
|---|---|
| Tariff Year | Example: `2027-28` |
| Effective From | `2027-04-01` |
| Effective To | `2028-03-31` |
| Consumer Category | `LT-I Domestic` |
| Supply Phase | `Single Phase` |
| Recorded MD (kW) | Example: `4` |
| Fixed Charge (₹/kW) | Example: `10` |
| Customer Charge (₹/month) | Legacy field retained for compatibility; **not used for billing**. Customer charge is now read from Tariff Slabs. |
| Export Settlement Rate (₹/kWh) | Example: `2.09` |
| FPPCA Included | Keep `FALSE`; the application excludes FPPCA |
| Electricity Duty (₹/unit) | Example: `0.06`; applied only to positive billed/tariff units |

One row represents one tariff financial year.

### 2. Tariff Slabs

| Column | Purpose |
|---|---|
| Tariff Year | Links to `Tariff Master` |
| From Unit | Slab starting unit |
| To Unit | Slab ending unit; blank for the final open-ended slab |
| Rate (₹/kWh) | Energy charge rate |
| Customer Charge (₹/month) | Customer charge selected from the slab applicable to the total positive tariff/billed units |

One row represents one tariff slab.

This two-tab structure is deliberately used instead of putting six slab definitions into one very wide master row. It makes future tariff updates easier to read and less error-prone.

## Existing reading sheet

The existing **Solar Energy Dashboard** tab should remain unchanged:

`ID, Reading Date, Grid Import, Grid Export, Solar Generation, Month End, Solar Generation Units, Grid Import Units, Grid Export Units, Home Consumption, Created At`

No tariff columns should be added to the reading records.

The tariff is selected dynamically by the reading/month period and its effective tariff date.

## Initial tariff data

The Apps Script creates and seeds these two tariff versions when the new tabs are empty:

- FY 2025-26 — 01-Apr-2025 to 31-Mar-2026
- FY 2026-27 — 01-Apr-2026 to 31-Mar-2027

Both initially use the configured LT-I Domestic slab values, slab-based customer charges, export settlement rate `2.09`, and electricity duty `0.06` per positive billed unit.

## Adding FY 2027-28

When APSPDCL releases the next tariff:

1. Add one new row to **Tariff Master**.
2. Add the corresponding slab rows to **Tariff Slabs**.
3. Use the new effective dates, normally `2027-04-01` through `2028-03-31`.
4. Refresh the application or trigger Google Sheets synchronization.

No JavaScript change is required for a normal new tariff version.

Historical FY rows remain preserved.

## Application behaviour

On Google Sheets synchronization:

1. Reading records are synchronized as before.
2. Tariff Master + Tariff Slabs are read from Google Sheets.
3. The tariff configurations are cached into:
   - `solarEnergyDashboard.tariffConfigs`
   - `solarEnergyDashboard.tariffConfig` for the currently applicable configuration/cache compatibility.
4. Analytics, Dashboard and Settings use the synchronized tariff configuration.
5. If Google Sheets is unavailable, the last locally cached tariff versions remain available.

### Source of truth

**Google Sheets:** master/source of truth  
**Local Storage:** local cache/fallback

The Settings page is therefore a read-only view of the synchronized tariff master. Future tariff versions should be added in Google Sheets, not manually inserted into browser Local Storage.

## FPPCA

FPPCA remains explicitly excluded. The application forces `includeFppca` to `false` even if a source row contains another value.

## Deployment

No new Google Apps Script URL is required.

Replace the deployed Apps Script `Code.gs` with the P2 version and redeploy the same Web App deployment. The existing browser `CONFIG.API.GOOGLE_SCRIPT_URL` can remain unchanged.

## Acceptance test

After deployment:

1. Open the application.
2. Confirm Google Sheets synchronization succeeds.
3. Confirm the two tariff tabs exist.
4. Confirm Settings lists 2025-26 and 2026-27.
5. Add a test `2027-28` master row and its slabs.
6. Reload/synchronize.
7. Confirm `2027-28` appears in Settings.
8. Select `2027-28` and confirm its effective dates and rates.
9. Confirm historical 2025-26 / 2026-27 analytics still use their own effective-period tariff.
10. Confirm FPPCA remains excluded.


## Customer charge and electricity duty calculation

For a negative Net Energy Position, the application calculates the absolute net units as tariff/billed units and then:

- Energy charge = telescopic slab calculation.
- Customer charge = the customer charge from the slab containing the total tariff units.
- Fixed charge = Recorded MD × Fixed Charge (₹/kW).
- Electricity duty = tariff units × Electricity Duty (₹/unit), only when tariff units are greater than zero.
- Estimated tariff = Energy charge + Customer charge + Fixed charge + Electricity duty.

For a positive Net Energy Position, the application shows export settlement revenue only. Customer charge, fixed charge and electricity duty are not deducted from export revenue.
