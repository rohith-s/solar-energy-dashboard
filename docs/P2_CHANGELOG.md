# P2 Revision — Google Sheets Tariff Master

Implemented from the latest Commit 9 baseline.

## Changed
- Added Google Sheets tariff master support.
- Added `Tariff Master` and `Tariff Slabs` tabs in Apps Script.
- Preserved the existing `Solar Energy Dashboard` reading-sheet schema unchanged.
- Google Sheets now returns tariff versions together with readings.
- Tariff versions are cached in Local Storage for offline/fallback use.
- Settings now displays synchronized tariff versions as a read-only master-data view.
- Added support for future FY versions such as `2027-28` without JavaScript changes.
- Kept FPPCA excluded.
- Settings/Analytics refresh after tariff synchronization.

## Validation
- JavaScript syntax checked for modified frontend modules.
- Apps Script JavaScript syntax checked.
