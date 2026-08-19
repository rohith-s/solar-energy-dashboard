# Commit 7 — Google Sheets Integration

## Status
Planned.

## Purpose

Introduce Google Sheets as the online synchronization/data-sharing layer while preserving a usable local application.

## Prerequisites

Manual Google setup will be required before implementation can be completed.

Expected manual inputs/setup:

- Google account access.
- Google Sheet: `Solar Energy Dashboard`.
- Google Cloud project.
- Appropriate Google Sheets API configuration.
- Required credentials/API configuration according to the selected client-side/server-side architecture.
- Confirmation of the final sheet columns/schema.
- Any required OAuth consent configuration.

## Scope

- Define the Google Sheet schema.
- Read/write application data as agreed.
- Synchronize readings.
- Handle synchronization errors.
- Avoid duplicate records.
- Preserve reading IDs and dates.
- Establish conflict/overwrite rules.
- Keep local functionality usable when synchronization is unavailable.

## Security

No private API secret should be hard-coded into frontend JavaScript.

Credentials and access strategy must be appropriate for the final deployment architecture.

## Out of scope

- Advanced analytics.
- Tariff configuration.
- PWA installability.
