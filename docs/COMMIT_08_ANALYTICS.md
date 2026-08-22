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

Using an illustrative sample dataset:

| Range | Periods | Positive Net | Negative Net | Net Balance |
|---|---:|---:|---:|---:|
| Last 6 months | sample range | +200.00 kWh | -150.00 kWh | +50.00 kWh |
| Last 12 months | sample range | +300.00 kWh | -150.00 kWh | +150.00 kWh |
| All periods | sample range | +300.00 kWh | -150.00 kWh | +150.00 kWh |

The dashboard's two-value summary intentionally shows only **Positive Net** and **Negative Net**. The net balance is included here only as a verification check and is not rendered as a third summary value.

## Current latest period verification

The latest available sample reading is labelled **MTD / Latest Reading** when the latest period is not month-end.

Illustrative latest-period values:

- Solar Generation: **160.00 kWh**
- Grid Import: **100.00 kWh**
- Grid Export: **150.00 kWh**
- Home Consumption: **210.00 kWh**
- Net Export: **+50.00 kWh**
- Settlement at ₹2.09/kWh: **₹104.50**

## Out of scope

- Meter calculation rule changes.
- Tariff configuration changes beyond the existing analytics estimate.
- PWA/offline implementation.
- Changes to `modules/reading/reading.js`.
