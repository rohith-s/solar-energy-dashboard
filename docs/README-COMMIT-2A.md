# Commit 2A — UI/Foundation fixes

## Scope

Commit 2A is a foundation-polish commit before implementing the energy reading engine.

### Included

- Added SVG favicon and `<link rel="icon">`.
- Added explicit system UI typography.
- Added responsive mobile navigation drawer.
- Added mobile menu backdrop and close behavior.
- Added accessible navigation state with `aria-current`.
- Added keyboard skip link.
- Added `:focus-visible` styling.
- Added reduced-motion support.
- Improved small-screen spacing and touch targets.
- Kept the application dependency-free and Vite-free.

## Local test

From the repository root:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

Do not use `file://` for testing ES modules.

## Expected routes

- `#/dashboard`
- `#/reading`
- `#/history`
- `#/analytics`
- `#/settings`

## Console

The previous favicon 404 should no longer occur.

The expected application log is:

```text
Solar Energy Dashboard v0.1.0 — Commit 2A
```
