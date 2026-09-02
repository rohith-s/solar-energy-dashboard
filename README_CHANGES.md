# Solar Energy Dashboard — Electricity Duty + Slab Customer Charges

This package contains only the files changed for the requested tariff calculation update.

## Main changes

1. Added `Electricity Duty (₹/unit)` to `Tariff Master`.
   - Default: `0.06`
   - Applied only when positive tariff/billed units exist.
   - Not applied to positive export settlement revenue.

2. Moved Customer Charge to `Tariff Slabs`.
   - 0–30: ₹25/month
   - 31–75: ₹30/month
   - 76–125: ₹45/month
   - 126–225: ₹50/month
   - 226–400: ₹55/month
   - 401+: ₹55/month

3. Negative Net Position / Tariff:
   - `Net = Grid Export Units - Grid Import Units`
   - If negative, absolute rounded net units are billed progressively.
   - Estimated tariff = Energy Charge + Fixed Charge + Slab Customer Charge + Electricity Duty.
   - FPPCA remains excluded.

4. Positive Net Position / Revenue:
   - Revenue remains `rounded positive net units × export settlement rate`.
   - Customer charge, fixed charge and electricity duty are NOT included in export revenue.

5. Analytics:
   - Monthly Summary continues to show Revenue for positive net and Tariff for negative net.
   - Net Position Summary uses the same tariff/revenue values.
   - Negative tariff breakdown now shows Electricity Duty.

6. Settings:
   - Displays Electricity Duty.
   - Displays customer charge as slab based.
   - Shows Customer Charge in the tariff slab table.

## Google Sheet migration

The Apps Script is backward-compatible with the existing P2 sheet layout:
- Existing `Tariff Master` gets a new 11th column: `Electricity Duty (₹/unit)`.
- Existing `Tariff Slabs` gets a new 5th column: `Customer Charge (₹/month)`.
- For existing 2025-26 and 2026-27 rows, blank new values are populated with the requested defaults.
- Existing master-level Customer Charge is renamed to `Customer Charge (legacy - ignored)` and is not used for billing.

For future tariff years, enter Electricity Duty in `Tariff Master` and Customer Charge for every slab in `Tariff Slabs`.

## Example

For 100 negative tariff units with 4 kW recorded MD and ₹10/kW fixed charge:
- Energy charge = ₹304.50
- Fixed charge = ₹40.00
- Customer charge = ₹45.00
- Electricity duty = ₹6.00
- Total tariff = ₹395.50

A positive 100-unit export net at ₹2.09/kWh remains ₹209.00 revenue.

## Files

- `js/tariff-engine.js`
- `modules/analytics/analytics.js`
- `modules/settings/settings.js`
- `google-apps-script/Code.gs`
- `docs/P2_GOOGLE_SHEETS_TARIFF_MASTER.md`
- `docs/COMMIT_09_SETTINGS_TARIFF.md`
- `REVIEW_CHANGES.diff`

`js/sheets-api.js` was checked against the uploaded latest copy and is unchanged.
`js/calculation-engine.js` is not part of the active calculation path and is unchanged.
