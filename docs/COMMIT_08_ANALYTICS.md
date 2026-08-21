# Commit 8 — Analytics

## Status
Implemented / Preview

## Scope
- Monthly Solar Generation, Grid Import, Grid Export and Home Consumption.
- Last 6 months default, Last 12 months and All periods.
- Solar generation trend chart.
- Grid import vs export chart.
- Latest energy-flow view.
- Solar self-consumption, solar contribution, grid dependency and export ratio.
- Net Grid Position = Grid Export - Grid Import.
- Positive net position is green; negative is red.
- Export settlement rate is editable, default ₹2.09/kWh, and persisted locally.
- Indicative APSPDCL domestic telescopic estimate for net import.

## Confirmed data model
- Grid Import/Export usage uses month-end cumulative baselines.
- Solar Generation is a direct period value.
- Home Consumption = Solar Generation + Grid Import - Grid Export.

## Financial estimate note
The APSPDCL result is indicative, not a final bill or guaranteed settlement. It excludes consumer-specific adjustments, arrears, subsidies, taxes and other charges. Current-year tariff references are the APSPDCL tariff page and APERC FY2026-27 tariff order.

## Out of scope
- Changing meter calculation rules.
- Google Sheets synchronization changes.
- PWA implementation.
