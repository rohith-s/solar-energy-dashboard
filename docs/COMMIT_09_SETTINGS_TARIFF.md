# Commit 9 — Settings / Tariff Configuration

## Status
Planned.

## Purpose

Create application settings and tariff configuration needed for future cost calculations.

## Scope

Potential settings:

- Electricity tariff configuration.
- Solar/export tariff configuration if applicable.
- Currency.
- Application preferences.
- Calculation-related configuration where explicitly required.
- Validation/default values.

## Requirements

Settings must be separated from reading data.

Tariff changes must not rewrite historical raw meter readings.

Historical cost calculations must have a clearly defined rule for whether they use the tariff active at the time or the current tariff.

## Out of scope

- Google authentication.
- PWA implementation.
