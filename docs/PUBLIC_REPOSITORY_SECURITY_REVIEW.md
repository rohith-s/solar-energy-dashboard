# Public Repository Security Review

## Result

The frontend contains no detected passwords, private keys, OAuth client secrets, service-account keys, or other credential material.

The deployed Google Apps Script URL in `js/config.js` is an endpoint, not a private credential. However, the current Apps Script code exposes anonymous read and synchronization write operations. A public GitHub repository would make the endpoint easy to discover, but the endpoint is already callable by anyone who knows its URL.

## Blocker before making the repository public

Do not publish the repository publicly until the Apps Script write path is restricted/authenticated.

The frontend cannot safely solve this by embedding a secret: any secret shipped in browser JavaScript is visible to users.

## Cleanup performed

- Removed unrelated payment receipt and solar-plant report exports.
- Removed local browser/server logs and PID artifacts.
- Removed obsolete/empty reading module artifacts.
- Removed the local seed page containing sample household readings.
- Sanitized user-specific meter values from public documentation examples.
- Repaired and strengthened `.gitignore` rules for generated/local artifacts.
- Updated stale project documentation where practical.

## Recommended next security change

Keep the repository private for now. Harden the Apps Script backend so public frontend access can use a read-only path, while synchronization writes require an authenticated/trusted path. After that change is tested, GitHub Pages can be enabled safely for the intended audience.
