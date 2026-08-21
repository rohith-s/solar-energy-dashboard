# Commit 9 — Versioned Settings / Tariff Configuration

## Status
Implemented.

## Purpose

Provide connection-specific APSPDCL tariff configuration and use the tariff applicable to each historical period for net-metering settlement estimates.

## Tariff versions

Tariffs are preserved by effective period rather than overwritten when a new FY is introduced.

### FY 2025-26

- Effective: **01-Apr-2025 → 31-Mar-2026**
- LT-I Domestic / Single Phase
- Current configured rates are the same as FY 2026-27.

### FY 2026-27

- Effective: **01-Apr-2026 → 31-Mar-2027**
- LT-I Domestic / Single Phase
- Recorded MD: 4 kW
- Fixed charge: ₹10/kW of recorded MD
- Customer charge: ₹30/month
- Export settlement rate: ₹2.09/kWh
- FPPCA: excluded
- Energy slabs: ₹1.90, ₹3.00, ₹4.50, ₹6.00, ₹8.75 and ₹9.75 as configured.

Future tariff years can be added without changing or replacing historical tariff versions.

## Confirmed calculation rules

### Net Energy Position

`Net Energy Position = Grid Export Units - Grid Import Units`

The displayed net position retains its calculated decimal precision.

### Tariff calculation rounding

For tariff / settlement calculations only, net units are rounded to the nearest whole unit:

- 34.40 → 34 units
- 34.50 → 35 units
- 34.60 → 35 units

The displayed Net value is not rounded this way.

### Positive Net Position

If the result is positive:

`Revenue = Rounded Positive Net Units × Export Settlement Rate`

### Negative Net Position

If the result is negative, the absolute net value is rounded to whole tariff units and the LT-I Domestic telescopic tariff is applied.

`Estimated APSPDCL charge = Energy Charges + Fixed Charge + Customer Charge`

For the current connection:

`Fixed Charge = Recorded MD × ₹10 = 4 × ₹10 = ₹40`

Customer charge is ₹30/month.

FPPCA is explicitly excluded.

Consumer-specific arrears, adjustments, subsidies, taxes and other bill-only items are not estimated.

## Analytics monthly summary

The Monthly summary now includes **Tariff / Revenue**:

- Positive / green Net → **Revenue** amount.
- Negative / red Net → **Tariff** estimated APSPDCL charge.
- Balanced Net → ₹0.00 / —.

Each row selects its tariff by the period's effective tariff date, so historical months continue to use the tariff that applied during that period.

## August 2026 acceptance test

For the test reading:

- Grid Export: 192.83 kWh
- Grid Import: 227.23 kWh
- Net Import: **-34.40 kWh**
- Tariff units: **34 kWh**
- Energy charge: **₹69.00**
- Fixed charge: **₹40.00**
- Customer charge: **₹30.00**
- Estimated APSPDCL charge: **₹139.00**
