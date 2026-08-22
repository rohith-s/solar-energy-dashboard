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

previous month-end:

`1000.00`, `1200.00`, `150.00`

sample period:

`1100.00`, `1250.00`, `160.00`

Results:

- Solar Generation = 160.00
- Grid Import = 100.00
- Grid Export = 50.00
- Home Consumption = 210.00

## Critical rule

Never convert the Solar Generation value into a cumulative meter calculation unless the business requirement explicitly changes.
