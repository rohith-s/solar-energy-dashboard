# Development Workflow

## Incremental commit strategy

Each commit should represent one logical feature.

For each commit:

1. Define scope.
2. Identify affected files.
3. Make the smallest required code changes.
4. Run syntax checks.
5. Test the feature in browser.
6. Verify Console has no errors.
7. Verify existing functionality still works.
8. Commit with a descriptive message.
9. Push to GitHub.
10. Record verification notes.

## JavaScript module rule

The application uses native ES modules.

`index.html` loads:

`<script type="module" src="js/app.js"></script>`

Do not mix module and non-module loading patterns.

## Reading module change rule

For future changes to `modules/reading/reading.js`, prefer targeted modifications/diffs and specify:

- exact function/block.
- existing code to locate.
- replacement code.
- reason.
- validation/test.

Do not provide the entire file unless required.

## Testing commands

Syntax check:

`node --check modules/reading/reading.js`

Browser checks:

- Dashboard loads.
- Reading loads.
- History loads.
- Navigation works.
- No Console errors.
- Mobile layout works.

## Git commit naming

Use concise descriptive messages, for example:

`feat: add reading history`

`feat: populate dashboard with real reading data`

`feat: add google sheets synchronization`

`feat: add analytics`

`feat: add tariff settings`

`feat: add pwa offline support`
