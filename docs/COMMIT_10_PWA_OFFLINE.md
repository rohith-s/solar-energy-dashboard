# Commit 10 — PWA / Offline / Installability

## Status
Planned.

## Purpose

Make the Solar Energy Dashboard installable and usable as a Progressive Web App on supported laptop/Android browsers.

## Scope

- Web App Manifest.
- Service Worker.
- App icons.
- Offline application shell.
- Cache strategy.
- Local Storage operation while offline.
- Installability checks.
- Mobile-friendly experience.
- Appropriate update/version strategy.

## Requirements

Local reading entry must continue to work without network access.

Google Sheets synchronization must not make the entire application unusable offline.

Synchronization should occur when connectivity is available according to the final sync design.

## Out of scope

- Rewriting the application in a framework.
- Introducing Vite unless explicitly reconsidered later.
