# Commit 4 — Previous Reading Selection & Date-Aware Calculation

## Purpose

Fix the Reading screen so the current reading is never used as its own previous reading.

## Changes

- Added `getPreviousReading(readingDate, excludeId)`.
- Previous reading is now the latest saved reading with `readingDate < current readingDate`.
- A reading on the same date is excluded from previous-reading selection.
- Previous-reading values refresh when the Reading Date changes.
- Live calculation preview uses the same date-aware previous-reading logic.
- Submit validation uses the same date-aware previous-reading logic.
- Kept `getLatestReading()` for callers that genuinely need the latest saved record.
- Added deterministic ordering for legacy duplicate-date records using `createdAt`.
- No change to the existing calculation formulas.

## Expected behaviour

For the current data:

- 31-Jul-2026: Grid Import 2078.00, Grid Export 2312.00, Solar Inverter 413.10
- 18-Aug-2026: Grid Import 2217.52, Grid Export 2487.50, Solar Inverter 696.60

When entering 18-Aug-2026, Previous Reading must be 31-Jul-2026.

The calculation must remain:

- Solar Generation: 696.60 - 413.10 = 283.50 kWh
- Grid Import: 2217.52 - 2078.00 = 139.52 kWh
- Grid Export: 2487.50 - 2312.00 = 175.50 kWh
- Home Consumption: 283.50 + 139.52 - 175.50 = 247.52 kWh

If the date is changed to 25-Aug-2026, the previous reading should become 18-Aug-2026.

## Validation

`node --check modules/reading/reading.js` passes.

A Node smoke test confirmed:

- 18-Aug-2026 -> previous = 31-Jul-2026
- 25-Aug-2026 -> previous = 18-Aug-2026
- 01-Sep-2026 -> previous = 18-Aug-2026
