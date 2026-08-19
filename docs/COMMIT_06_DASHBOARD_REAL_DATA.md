# Commit 6 — Dashboard Real Data

## Status
Implemented.

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


## Implemented Dashboard View

The dashboard now uses the saved readings in `solarEnergyDashboard.readings`.

### Current-period view

The selected period displays:

- Solar Generation as the saved direct period value.
- Grid Import usage using the saved calculation result.
- Grid Export usage using the saved calculation result.
- Home Consumption using the saved calculation result.

### Period filter

A period selector is populated from periods that have saved readings.

The latest available period is selected by default.

### Latest reading

The dashboard shows the latest reading date for the selected period and the saved cumulative/current input values.

### Month-end baseline

The dashboard shows the latest applicable month-end baseline used for cumulative Grid Import and Grid Export calculations.

If no applicable month-end baseline exists, Grid Import and Grid Export are shown as unavailable rather than displaying a misleading zero.

### Recent periods

The dashboard shows up to the latest six available periods, using the latest reading from each period.

### Empty state

When no readings exist, the dashboard provides an Add Reading action instead of displaying zero-valued metrics.

### Calculation source

The dashboard prefers the calculation result saved with each reading. For older records without a saved calculation object, it reuses the established Reading module calculation rather than duplicating the calculation formula.

### Responsive behavior

The dashboard uses a four-column KPI layout on larger screens, a two-column KPI layout on smaller screens, and stacked detail sections on Android/mobile layouts.

### Verification

Using the established sample:

- 31-Jul-2026 month-end Grid Import = 2078.00
- 31-Jul-2026 month-end Grid Export = 2312.00
- 18-Aug-2026 Grid Import = 2217.52
- 18-Aug-2026 Grid Export = 2487.50
- 18-Aug-2026 Solar Generation = 283.50

The dashboard shows:

- Solar Generation = 283.50 kWh
- Grid Import = 139.52 kWh
- Grid Export = 175.50 kWh
- Home Consumption = 247.52 kWh
- Baseline date = 31-Jul-2026
