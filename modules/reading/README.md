# Reading Module — Commit 3

## Inputs

1. Starting Grid Import — cumulative net-meter import reading.
2. Starting Solar Export — cumulative net-meter export reading.
3. Current Grid Import — current cumulative import reading.
4. Current Solar Export — current cumulative export reading.
5. Inverter Generation — cumulative solar generation reading.

## Calculations

```text
Grid Import = Current Grid Import - Starting Grid Import

Solar Export = Current Solar Export - Starting Solar Export

Net Grid Position = Solar Export - Grid Import

Solar Used at Home = Inverter Generation - Solar Export

Home Consumption = Inverter Generation + Grid Import - Solar Export
```

Interpretation:

- Net Grid Position > 0 → more energy supplied to the grid.
- Net Grid Position < 0 → more energy consumed from the grid.
- Net Grid Position = 0 → balanced.

## Month-end

The checkbox saves the current cumulative meter values as a month-end reference in local storage.

The Google Sheets adapter will replace this local persistence later without changing the calculation engine.

## Important

The current implementation intentionally uses localStorage only. It is a development fallback and is **not yet multi-device storage**. Google Sheets integration is the next persistence step.
