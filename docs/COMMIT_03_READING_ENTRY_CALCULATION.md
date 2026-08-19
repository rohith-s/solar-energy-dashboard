# Commit 3 — Reading Entry + Calculation Engine

## Status
Completed and pushed.

## Purpose
Create the Reading screen and establish the initial calculation engine for entering meter/solar-period readings.

## Scope

- Reading date input.
- Grid Import input.
- Grid Export input.
- Solar Generation / Solar Inverter current-month input.
- Month-end indicator.
- Previous-reading display.
- Live calculation preview.
- Save/update reading.
- Basic validation.
- Local Storage persistence.
- Reading calculation object stored with each saved reading.

## Confirmed calculation contract

Grid Import usage:

`Current Grid Import - Previous baseline Grid Import`

Grid Export usage:

`Current Grid Export - Previous baseline Grid Export`

Solar Generation:

`Current Solar Generation value`

Home Consumption:

`Solar Generation + Grid Import Usage - Grid Export Usage`

## Important clarification

The Solar Generation value is a direct monthly/period value.

It must not be treated as a cumulative inverter meter.

Therefore the application must not calculate:

`Current Solar - Previous Solar`

## Data persistence

Readings are stored in browser Local Storage under:

`solarEnergyDashboard.readings`

## Compatibility

The application is vanilla JavaScript and does not use Vite or a JavaScript framework.

## Verification

The Reading screen must load without module/export errors and must calculate the entered period values correctly.
