/*
 * Solar Energy Dashboard
 * Commit 7 - Google Sheets synchronization bootstrap
 *
 * This module deliberately avoids changing reading.js.
 * reading.js already dispatches "solar:reading-saved" after a
 * successful Local Storage save.
 */

import { syncReadings, isConfigured } from "./sheets-api.js";

function isRefreshableRoute() {
    var hash = window.location.hash || "";

    return (
        hash.indexOf("#/dashboard") === 0 ||
        hash.indexOf("#/history") === 0 ||
        hash.indexOf("#/analytics") === 0 ||
        hash === "" ||
        hash === "#/"
    );
}

function refreshCurrentDataView() {
    if (!isRefreshableRoute()) {
        return;
    }

    /*
     * app.js already owns route rendering. Triggering the same
     * browser event lets the existing renderer refresh without
     * creating a second router.
     */
    window.dispatchEvent(new Event("hashchange"));
}

function notifySync(result) {
    var message;

    if (!result || !result.configured) {
        return;
    }

    if (result.ok) {
        message =
            "Google Sheets synchronized (" +
            result.count +
            " readings).";
    } else {
        message =
            "Google Sheets sync unavailable. Local data is still available.";
        console.warn(
            "Google Sheets synchronization:",
            result.error
        );
    }

    window.dispatchEvent(
        new CustomEvent(
            "solar:sync-status",
            {
                detail: {
                    ok: result.ok,
                    message: message,
                    error: result.error || null
                }
            }
        )
    );
}

function runSync(refresh) {
    if (!isConfigured()) {
        return;
    }

    window.dispatchEvent(new CustomEvent("solar:sync-start"));

    syncReadings(function (result) {
        notifySync(result);

        if (result.ok && refresh) {
            refreshCurrentDataView();
        }
    });
}

window.addEventListener(
    "solar:reading-saved",
    function () {
        runSync(false);
    }
);

window.addEventListener(
    "load",
    function () {
        runSync(true);
    }
);
