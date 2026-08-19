# Data Model & Calculation Rules

## Reading record

The current reading model includes concepts equivalent to:

- `id`
- `readingDate`
- `gridImport`
- `gridExport`
- `solarInverter` (used as the current-period Solar Generation value)
- `isMonthEnd`
- `calculation`
- `createdAt`

## Meaning of fields

### gridImport
Cumulative Grid Import meter reading.

### gridExport
Cumulative Grid Export meter reading.

### solarInverter
Despite the existing field name, the confirmed business meaning is:

**Solar Generation for the current month/period.**

It is not a cumulative value.

Future UI terminology should make this distinction clear.

### isMonthEnd
Marks whether a saved reading is eligible to serve as a previous baseline.

## Previous baseline algorithm

For a selected reading date:

1. Load saved readings.
2. Remove the current record when editing.
3. Keep only readings with `isMonthEnd === true`.
4. Keep only readings strictly before the selected date.
5. Sort by reading date descending.
6. Use `createdAt` for deterministic duplicate-date ordering.
7. Select the first record.

## Calculations

### Solar Generation

`solarGeneration = current.solarInverter`

### Grid Import Usage

If a previous month-end exists:

`gridImportUnits = current.gridImport - previous.gridImport`

### Grid Export Usage

If a previous month-end exists:

`gridExportUnits = current.gridExport - previous.gridExport`

### Home Consumption

`homeConsumption = solarGeneration + gridImportUnits - gridExportUnits`

## Current example

July month-end:

`2078.00`, `2312.00`, `413.10`

August period:

`2217.52`, `2487.50`, `283.50`

Results:

- Solar Generation = 283.50
- Grid Import = 139.52
- Grid Export = 175.50
- Home Consumption = 247.52

## Critical rule

Never convert the Solar Generation value into a cumulative meter calculation unless the business requirement explicitly changes.
