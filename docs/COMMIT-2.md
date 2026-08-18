# Commit 2 — Dashboard framework and reusable components

Version: 0.1.0

## Included

- Separated CSS architecture:
  - `variables.css`
  - `layout.css`
  - `components.css`
  - `utilities.css`
  - `responsive.css`
- Lightweight hash router
- Local storage abstraction
- Shared utility functions
- Dashboard module using `render()`
- Responsive desktop/mobile navigation
- KPI cards
- Quick actions
- System status card
- Loading overlay
- Snackbar foundation

## Important local testing note

Because this project uses native ES modules, do not open `index.html` directly with
`file://` for reliable testing. Use a local static HTTP server.

Example with Python:

```text
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

GitHub Pages will serve the project over HTTP(S), so no build tool is required.

## Commit message

`feat: dashboard framework and reusable components`
