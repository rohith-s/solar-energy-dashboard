# Commit 4 — Month-End Previous Reading & Period Calculation

## Status
Completed and pushed.

## Purpose

Correct the previous-reading and period-calculation behavior so that cumulative grid meters use the latest applicable month-end baseline, while Solar Generation remains a direct current-period value.

## Changes

### Previous reading

`getPreviousReading(readingDate, excludeId)` selects only readings where:

- reading exists and has a reading date.
- current record is excluded when editing.
- `isMonthEnd === true`.
- `reading.readingDate < readingDate`.

Results are ordered by latest reading date first, with `createdAt` used for deterministic ordering when duplicate month-end dates exist.

### Grid calculations

Grid Import:

`Current Grid Import - Previous Month-End Grid Import`

Grid Export:

`Current Grid Export - Previous Month-End Grid Export`

### Solar calculation

Solar Generation is now:

`Current Solar Generation value`

The previous solar value is not subtracted.

### Home Consumption

`Solar Generation + Grid Import Usage - Grid Export Usage`

## Confirmed example

Previous month-end: 31-Jul-2026

- Grid Import: 2078.00
- Grid Export: 2312.00
- Solar Generation: 413.10

Current period: 18-Aug-2026

- Grid Import: 2217.52
- Grid Export: 2487.50
- Solar Generation: 283.50

Result:

- Solar Generation: 283.50 kWh
- Grid Import: 139.52 kWh
- Grid Export: 175.50 kWh
- Home Consumption: 247.52 kWh

## Validation

A non-month-end reading such as 18-Aug-2026 must not become the previous baseline for a later reading.

If 31-Aug-2026 is saved as month-end, a subsequent September reading should use 31-Aug-2026 as its previous baseline.

## Repository practice

Commit 4 is intentionally retained as the month-end/calculation correction. The History feature therefore becomes Commit 5 even though the earlier conceptual roadmap had History as Commit 4.
