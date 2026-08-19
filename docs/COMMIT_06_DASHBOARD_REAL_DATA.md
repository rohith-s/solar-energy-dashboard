# Commit 6 — Dashboard Real Data

## Status
Planned.

## Purpose

Replace dashboard placeholders with real information derived from saved readings.

## Scope

Use the Local Storage readings as the source.

Dashboard should surface useful current-period and historical summary information without changing the underlying reading formulas.

## Candidate dashboard information

- Latest reading date.
- Latest month-end baseline date.
- Current-period Solar Generation.
- Current-period Grid Import usage.
- Current-period Grid Export usage.
- Current-period Home Consumption.
- Latest available reading summary.
- Useful comparison/summary information based on stored readings.

## Requirements

- Respect the month-end baseline rule for cumulative grid meters.
- Treat Solar Generation as a direct period value.
- Use the established Home Consumption formula.
- Work on laptop and Android layouts.
- Gracefully handle no readings.

## Out of scope

- Google Sheets synchronization.
- Advanced analytics.
- Tariff configuration.
- PWA installability.
