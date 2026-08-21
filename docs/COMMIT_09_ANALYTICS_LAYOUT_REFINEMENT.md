# Commit 9 — Analytics Scope Layout Refinement

## Status
Implemented.

## Purpose

Separate Analytics into two clearly defined scopes without changing any calculation logic.

### Historical Energy & Settlement Analytics

Controlled by the existing Period range:

- Last 6 months
- Last 12 months
- All periods

Contains the selected-range KPI totals, Net Position Summary, historical charts and Monthly summary.

### Current Period

Uses the latest available period dynamically, for example:

- Current Period — August 2026
- MTD / Latest Reading

Contains the current-period APSPDCL net energy position, Latest Energy Flow and Insights together.

## Additional refinement

- Fixed the duplicated period label in the Grid Import vs Export SVG export tooltip text.
- No changes to reading calculations, tariff calculations, tariff versioning or Monthly summary values.
- Existing Google Sheets sync refresh and dynamic sync-status behavior are preserved.
