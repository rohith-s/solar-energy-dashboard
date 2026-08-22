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

Previous month-end: 31-Jul-YYYY

- Grid Import: 1000.00
- Grid Export: 1200.00
- Solar Generation: 150.00

Current period: 18-Aug-YYYY

- Grid Import: 1100.00
- Grid Export: 1250.00
- Solar Generation: 160.00

Result:

- Solar Generation: 160.00 kWh
- Grid Import: 100.00 kWh
- Grid Export: 50.00 kWh
- Home Consumption: 210.00 kWh

## Validation

A non-month-end reading such as 18-Aug-YYYY must not become the previous baseline for a later reading.

If 31-Aug-YYYY is saved as month-end, a subsequent following-period reading should use 31-Aug-YYYY as its previous baseline.

## Repository practice

Commit 4 is intentionally retained as the month-end/calculation correction. The History feature therefore becomes Commit 5 even though the earlier conceptual roadmap had History as Commit 4.
