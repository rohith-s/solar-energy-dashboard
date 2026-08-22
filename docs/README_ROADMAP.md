# Solar Energy Dashboard — Project Roadmap

## Project
**Application:** Solar Energy Dashboard  
**Architecture:** Vanilla HTML / CSS / JavaScript  
**Build tooling:** No Vite / no framework  
**Initial storage:** Browser Local Storage  
**Future synchronization:** Google Sheets  
**Target platforms:** Laptop/Desktop and Android mobile

## Current implementation status

| Commit | Scope | Status |
|---|---|---|
| 3 | Reading Entry + Calculation Engine | ✅ Completed |
| 4 | Month-End Previous Reading + Period Calculation | ✅ Completed |
| 5 | History | ⏭ Next |
| 6 | Dashboard — Real Data | Completed |
| 7 | Google Sheets | Completed |
| 8 | Analytics | Completed |
| 9 | Settings / Tariff Configuration | Completed |
| 10 | PWA / Offline / Installability | Next |

> Note: The original roadmap called the History work "Commit 4". Commit 4 was already used for the month-end/calculation correction, so the repository should retain its actual commit history. The functional roadmap therefore continues with Commit 5 = History.

## Confirmed data model and calculation rules

### Grid Import
Grid Import is a cumulative meter reading.

Period usage:

`Current Grid Import - Previous Month-End Grid Import`

### Grid Export
Grid Export is a cumulative meter reading.

Period usage:

`Current Grid Export - Previous Month-End Grid Export`

### Solar Generation
The Solar Generation / Solar Inverter Current Month value is a direct value for the current month/period.

It is **not** cumulative.

Therefore:

`Solar Generation = Current Solar Generation value`

Do not calculate:

`Current Solar - Previous Solar`

### Home Consumption

`Home Consumption = Solar Generation + Grid Import Usage - Grid Export Usage`

## Previous-reading rule

The previous baseline must:

1. Be a saved reading.
2. Have `isMonthEnd === true`.
3. Have `readingDate < current readingDate`.
4. Exclude the record currently being edited.
5. Select the latest qualifying month-end reading.
6. Use deterministic `createdAt` ordering for legacy duplicate month-end dates.

A non-month-end reading must never become the previous baseline.

## Current confirmed example

31-Jul-YYYY:

- Grid Import: 1000.00
- Grid Export: 1200.00
- Solar Generation: 150.00
- Month End: Yes

18-Aug-YYYY:

- Grid Import: 1100.00
- Grid Export: 1250.00
- Solar Generation: 160.00
- Month End: No

For the 18-Aug period:

- Solar Generation = 160.00 kWh
- Grid Import = 1100.00 - 1000.00 = 100.00 kWh
- Grid Export = 1250.00 - 1200.00 = 50.00 kWh
- Home Consumption = 160.00 + 100.00 - 50.00 = 210.00 kWh

## Development principle

Implement each commit incrementally.

For future `modules/reading/reading.js` changes, provide targeted changes/diffs rather than replacing the entire file unless a full replacement is genuinely required.
