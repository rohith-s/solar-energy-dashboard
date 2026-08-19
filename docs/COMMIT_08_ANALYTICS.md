# Commit 8 — Analytics

## Status
Planned.

## Purpose

Provide useful historical analysis based on saved readings.

## Scope

Potential analytics:

- Monthly Solar Generation.
- Monthly Grid Import.
- Monthly Grid Export.
- Monthly Home Consumption.
- Trend comparisons.
- Period summaries.
- Useful ratios/insights derived from the established calculations.

## Requirements

Analytics must use the confirmed data model:

- Grid Import/Export usage is based on month-end cumulative baselines.
- Solar Generation is a direct monthly/period value.
- Home Consumption = Solar Generation + Grid Import - Grid Export.

Charts must remain readable on laptop and Android.

## Out of scope

- Changing meter calculation rules.
- Tariff configuration.
- PWA implementation.
