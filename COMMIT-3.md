# Commit 3 — Reading Form + Calculation Engine

## Added

- Reading entry form.
- Cumulative Grid Import input.
- Cumulative Solar Export input.
- Inverter Generation input.
- Starting meter readings.
- Month-end checkbox.
- Live calculation preview.
- Progressive APSPDCL LT-1 tariff calculation.
- LocalStorage persistence for development.
- Validation preventing cumulative meter rollback.
- Home-consumption calculation.

## Calculation model

Grid import:

`currentGridImport - startGridImport`

Solar export:

`currentSolarExport - startSolarExport`

Net grid position:

`solarExport - gridImport`

Home consumption:

`inverterGeneration + gridImport - solarExport`

This is based on the agreed meter model:

- Net meter Import = electricity taken from grid.
- Net meter Export = electricity supplied to grid.
- Inverter = total solar generation.

## Tariff model

Progressive slabs:

| Units | Energy rate | Customer charge |
|---:|---:|---:|
| 1–30 | ₹1.90 | ₹25 |
| 31–75 | ₹3.00 | ₹30 |
| 76–125 | ₹4.50 | ₹45 |
| 126–225 | ₹6.00 | ₹50 |
| 226–400 | ₹8.75 | ₹55 |
| >400 | ₹9.75 | ₹55 |

The bill engine applies the slabs progressively and adds the customer charge for the highest slab reached.

## Not included yet

- Google Sheets API.
- Authentication.
- History screen.
- Dashboard charts.
- Settings UI.
- Multi-device synchronization.

These remain separate commits.
