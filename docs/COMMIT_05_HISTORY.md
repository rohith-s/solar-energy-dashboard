# Commit 5 — History

## Status
Planned / Next.

## Purpose

Build the History screen using the readings already saved in Local Storage.

## Scope

- Load readings from `solarEnergyDashboard.readings`.
- Display saved readings in reverse chronological order.
- Show reading date.
- Show month-end status.
- Show Grid Import current meter reading.
- Show Grid Export current meter reading.
- Show Solar Generation current-period value.
- Show calculated Solar Generation.
- Show calculated Grid Import usage.
- Show calculated Grid Export usage.
- Show calculated Home Consumption.
- Provide a useful empty state when no readings exist.
- Keep the History screen responsive for laptop and Android.

## Data rules

History should display the saved reading and its saved calculation result.

Do not reinterpret a saved Solar Generation value as cumulative.

Do not change the calculation engine as part of the History UI work unless a concrete defect is discovered.

## Sorting

Default order:

Latest reading date first.

For duplicate dates, use deterministic `createdAt` ordering.

## Out of scope

- Google Sheets synchronization.
- Analytics charts.
- Tariff configuration.
- PWA installation.
- Authentication.

## Verification

Use the current Local Storage sample:

31-Jul-2026 and 18-Aug-2026.

The latest record should appear first.

18-Aug should show Solar Generation = 283.50 kWh and Home Consumption = 247.52 kWh.

31-Jul should show its saved calculation values.
