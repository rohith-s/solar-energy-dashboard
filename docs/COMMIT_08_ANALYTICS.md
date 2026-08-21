# Commit 8 — Analytics

## Purpose

Provide historical analysis based on saved readings without changing the established reading calculation rules.

## Analytics behavior

- Default range: **Last 6 months**.
- Options: **Last 6 months**, **Last 12 months**, **All periods**.
- Grid Import/Export usage continues to use month-end cumulative baselines.
- Solar Generation remains a direct monthly/period value.
- Home Consumption remains `Solar Generation + Grid Import - Grid Export`.
- Export settlement rate defaults to **₹2.09/kWh** and remains configurable.
- Current/latest settlement is shown for the latest available period and is explicitly labelled **MTD / Latest Reading** when the latest period is not month-end.
- **Net Position Summary** shows the sum of positive monthly net positions and the sum of negative monthly net positions separately for the selected range.
- Analytics energy and currency values are displayed to **2 decimal places**. Percentages are also displayed to 2 decimal places.
- `Solar contribution` is presented as **Solar Generation Coverage**.

## Net Position Summary verification

Using the current verified readings through August 2026:

| Range | Periods | Positive Net | Negative Net | Net Balance |
|---|---:|---:|---:|---:|
| Last 6 months | Mar–Aug 2026 | +384.57 kWh | -316.00 kWh | +68.57 kWh |
| Last 12 months | Jan–Aug 2026 | +544.57 kWh | -316.00 kWh | +228.57 kWh |
| All periods | Jan–Aug 2026 | +544.57 kWh | -316.00 kWh | +228.57 kWh |

The dashboard's two-value summary intentionally shows only **Positive Net** and **Negative Net**. The net balance is included here only as a verification check and is not rendered as a third summary value.

## Current latest period verification

The latest available reading is **August 2026** (20-Aug-2026), so the dashboard labels it **MTD / Latest Reading**.

Latest August values:

- Solar Generation: **309.40 kWh**
- Grid Import: **157.26 kWh**
- Grid Export: **192.83 kWh**
- Home Consumption: **273.83 kWh**
- Net Export: **+35.57 kWh**
- Settlement at ₹2.09/kWh: **₹74.34**

## Out of scope

- Meter calculation rule changes.
- Tariff configuration changes beyond the existing analytics estimate.
- PWA/offline implementation.
- Changes to `modules/reading/reading.js`.
