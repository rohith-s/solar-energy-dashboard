# P3 Change Notes

## P3.1 — Analytics separation

- Added a clear **Selected period range** section for:
  - Range totals
  - Net Position Summary
  - Trend / chart
  - Grid Import vs Export
  - Monthly Summary

- Added a clear **Current period** section for:
  - Latest APSPDCL net position
  - Latest Energy Flow
  - Insights

- No reading calculation logic was changed.

- Monthly Summary remains unchanged apart from the previously implemented **Tariff / Revenue** display.

- Net Position Summary calculation remains unchanged:
  - Positive Net → sum of positive monthly **Revenue**
  - Negative Net → sum of negative monthly **Tariff**

- Latest APSPDCL period continues to come from the latest available reading / period.

## P3.2 — Google Sheets sync confirmation

- Existing Google Sheets synchronization continues to refresh:
  - Dashboard
  - Analytics
  - Settings

  after a successful startup sync.

- Added a successful sync confirmation toast using the existing sync result message:

  `Google Sheets synchronized (...). Dashboard refreshed.`

- No changes were made to the Google Sheets tariff-master architecture.

- No changes were made to `reading.js`.

## P3 Verification

The following P3 items were verified successfully:

- Analytics section separation
- Current APSPDCL position
- Net Position Summary
- Monthly Summary
- Grid Import vs Export
- Google Sheets synchronization
- Dashboard / Analytics / Settings refresh after sync
- Sync confirmation message

## P3 Scope

P3 does not change:

- Reading calculation logic
- Tariff effective-date logic
- FPPCA handling — remains excluded
- Google Sheets tariff-master architecture