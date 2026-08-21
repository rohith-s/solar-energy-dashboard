# P3.1 + P3.2 Revision

## P3.1 Analytics separation
- Added a clear **Selected period range** section for range totals, Net Position Summary, trend/chart, Grid Import vs Export, and Monthly Summary.
- Added a clear **Current period** section for latest APSPDCL net position, Latest Energy Flow, and Insights.
- No calculation logic was changed.
- Monthly Summary remains unchanged.
- Net Position Summary calculation remains unchanged.
- Latest period continues to come from the latest available reading/period.

## P3.2 Sync confirmation
- Existing Google Sheets sync already refreshes dashboard/analytics/settings after successful startup sync.
- Added a success toast using the existing sync result message:
  `Google Sheets synchronized (...). Dashboard refreshed.`
- No changes to Google Sheets tariff-master logic.
- No changes to reading.js.
