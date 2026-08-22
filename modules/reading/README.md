# Reading Module

## Inputs

1. Starting Grid Import — cumulative net-meter import reading.
2. Starting Solar Export — cumulative net-meter export reading.
3. Current Grid Import — current cumulative import reading.
4. Current Solar Export — current cumulative export reading.
5. Inverter Generation — direct solar generation value for the current period.

## Calculations

```text
Grid Import Units = Current Grid Import - Previous Month-End Grid Import
Grid Export Units = Current Grid Export - Previous Month-End Grid Export
Net Grid Position = Grid Export Units - Grid Import Units
Home Consumption = Solar Generation + Grid Import Units - Grid Export Units
```

Solar Generation is stored as the direct value for the current month/period. It is not calculated as a cumulative difference.

## Month-end

A month-end reading is saved as the baseline for subsequent cumulative Grid Import and Grid Export calculations. The previous baseline must be the latest saved month-end reading strictly before the selected reading date.

## Persistence

Local Storage remains the browser cache/fallback. Google Sheets synchronization is implemented separately and does not change the reading calculation rules.
