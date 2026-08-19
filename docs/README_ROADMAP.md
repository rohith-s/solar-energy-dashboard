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
| 6 | Dashboard — Real Data | Planned |
| 7 | Google Sheets | Planned |
| 8 | Analytics | Planned |
| 9 | Settings / Tariff Configuration | Planned |
| 10 | PWA / Offline / Installability | Planned |

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

31-Jul-2026:

- Grid Import: 2078.00
- Grid Export: 2312.00
- Solar Generation: 413.10
- Month End: Yes

18-Aug-2026:

- Grid Import: 2217.52
- Grid Export: 2487.50
- Solar Generation: 283.50
- Month End: No

For the 18-Aug period:

- Solar Generation = 283.50 kWh
- Grid Import = 2217.52 - 2078.00 = 139.52 kWh
- Grid Export = 2487.50 - 2312.00 = 175.50 kWh
- Home Consumption = 283.50 + 139.52 - 175.50 = 247.52 kWh

## Development principle

Implement each commit incrementally.

For future `modules/reading/reading.js` changes, provide targeted changes/diffs rather than replacing the entire file unless a full replacement is genuinely required.
