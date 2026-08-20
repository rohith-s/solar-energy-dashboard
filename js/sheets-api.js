/*
 * Solar Energy Dashboard
 * Commit 7 - Google Sheets synchronization
 *
 * Client-side transport only.
 * No Google API secret is stored in the browser.
 */

import { CONFIG } from "./config.js";

var STORAGE_KEY = "solarEnergyDashboard.readings";

function getUrl() {
    return CONFIG.API.GOOGLE_SCRIPT_URL || "";
}

function isConfigured() {
    return getUrl().trim() !== "";
}

function getLocalReadings() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        var data = JSON.parse(raw);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to read local readings:", error);
        return [];
    }
}

function saveLocalReadings(readings) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(readings)
        );

        return true;
    } catch (error) {
        console.error("Unable to save synchronized readings:", error);
        return false;
    }
}
function normalizeReadingDate(value) {
    var text;
    var match;
    var date;
    var year;
    var month;
    var day;

    if (!value) {
        return "";
    }

    text = String(value).trim();

    /*
     * Application's canonical date format.
     */
    match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
        return text;
    }

    /*
     * Google Apps Script may return a date cell as:
     *
     * Tue Mar 31 2026 00:00:00 GMT+0530
     *
     * Use local date components so the date does not
     * shift because of UTC conversion.
     */
    date = new Date(text);

    if (isNaN(date.getTime())) {
        return text;
    }

    year = date.getFullYear();
    month = String(date.getMonth() + 1);
    day = String(date.getDate());

    if (month.length < 2) {
        month = "0" + month;
    }

    if (day.length < 2) {
        day = "0" + day;
    }

    return (
        String(year) +
        "-" +
        month +
        "-" +
        day
    );
}

function normalizeReading(reading) {
    var normalized;

    if (!reading) {
        return reading;
    }

    normalized = {};

    Object.keys(reading).forEach(function (key) {
        normalized[key] = reading[key];
    });

    normalized.readingDate =
        normalizeReadingDate(
            reading.readingDate
        );

    return normalized;
}

function normalizeReadings(readings) {
    return (Array.isArray(readings)
        ? readings
        : []
    ).map(function (reading) {
        return normalizeReading(reading);
    });
}

function nextCallbackName() {
    return "solarSheetsCallback_" +
        String(Date.now()) +
        "_" +
        String(Math.floor(Math.random() * 100000));
}

/*
 * Google Apps Script Web Apps redirect their ContentService response to a
 * googleusercontent.com URL and do not provide browser CORS headers.
 * Therefore XMLHttpRequest/fetch cannot be used directly from localhost or
 * another web origin. Commit 7 uses JSONP for GET and a GET-based sync action
 * so the browser never needs CORS permission from Apps Script.
 */
function requestReadings(callback) {
    var script;
    var callbackName;
    var url = getUrl();
    var completed = false;

    if (!url) {
        callback({
            ok: false,
            configured: false,
            error: "Google Sheets URL is not configured."
        });
        return;
    }

    callbackName = nextCallbackName();

    function cleanup() {
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }

        try {
            delete window[callbackName];
        } catch (error) {
            window[callbackName] = undefined;
        }
    }

    window[callbackName] = function (response) {
        if (completed) {
            return;
        }

        completed = true;
        cleanup();

        callback({
            ok: response && response.ok === true,
            configured: true,
            data: response || null,
            error:
                response && response.error
                    ? response.error
                    : null
        });
    };

    script = document.createElement("script");
    script.async = true;
    script.src =
        url +
        (url.indexOf("?") === -1 ? "?" : "&") +
        "action=readings&callback=" +
        encodeURIComponent(callbackName);

    script.onerror = function () {
        if (completed) {
            return;
        }

        completed = true;
        cleanup();

        callback({
            ok: false,
            configured: true,
            error: "Unable to connect to Google Sheets."
        });
    };

    document.head.appendChild(script);

    window.setTimeout(function () {
        if (completed) {
            return;
        }

        completed = true;
        cleanup();

        callback({
            ok: false,
            configured: true,
            error: "Google Sheets request timed out."
        });
    }, CONFIG.API.REQUEST_TIMEOUT || 30000);
}

function requestSyncReading(reading, callback) {
    var script;
    var callbackName;
    var url = getUrl();
    var completed = false;
    var payload = JSON.stringify({
        action: "sync",
        readings: [reading]
    });

    if (!url) {
        callback({
            ok: false,
            configured: false,
            error: "Google Sheets URL is not configured."
        });
        return;
    }

    callbackName = nextCallbackName();

    function cleanup() {
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }

        try {
            delete window[callbackName];
        } catch (error) {
            window[callbackName] = undefined;
        }
    }

    window[callbackName] = function (response) {
        if (completed) {
            return;
        }

        completed = true;
        cleanup();

        callback({
            ok: response && response.ok === true,
            configured: true,
            data: response || null,
            error:
                response && response.error
                    ? response.error
                    : null
        });
    };

    script = document.createElement("script");
    script.async = true;
    script.src =
        url +
        (url.indexOf("?") === -1 ? "?" : "&") +
        "action=sync&callback=" +
        encodeURIComponent(callbackName) +
        "&payload=" +
        encodeURIComponent(payload);

    script.onerror = function () {
        if (completed) {
            return;
        }

        completed = true;
        cleanup();

        callback({
            ok: false,
            configured: true,
            error: "Unable to synchronize with Google Sheets."
        });
    };

    document.head.appendChild(script);

    window.setTimeout(function () {
        if (completed) {
            return;
        }

        completed = true;
        cleanup();

        callback({
            ok: false,
            configured: true,
            error: "Google Sheets synchronization timed out."
        });
    }, CONFIG.API.REQUEST_TIMEOUT || 30000);
}

function sortReadings(readings) {
    return readings.slice().sort(function (a, b) {
        var dateA = String(a.readingDate || "");
        var dateB = String(b.readingDate || "");

        if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
        }

        return String(a.createdAt || "").localeCompare(
            String(b.createdAt || "")
        );
    });
}

/*
 * Commit 7 conflict rule:
 *
 * - Reading ID is the primary identity.
 * - Remote-only records are added locally.
 * - Local-only records are uploaded.
 * - If the same ID exists on both sides, the local record wins.
 * - Records are append/update only; deletion propagation is out of scope.
 */
function mergeReadings(localReadings, remoteReadings) {
    var merged = [];
    var localById = {};
    var remoteById = {};
    var normalizedLocalReadings =
        normalizeReadings(localReadings);
    var normalizedRemoteReadings =
        normalizeReadings(remoteReadings);
    var index;

    for (
        index = 0;
        index < normalizedLocalReadings.length;
        index += 1
    ) {
        if (
            normalizedLocalReadings[index] &&
            normalizedLocalReadings[index].id
        ) {
            localById[
                String(
                    normalizedLocalReadings[index].id
                )
            ] =
                normalizedLocalReadings[index];
        }
    }

    for (
        index = 0;
        index < normalizedRemoteReadings.length;
        index += 1
    ) {
        if (
            normalizedRemoteReadings[index] &&
            normalizedRemoteReadings[index].id
        ) {
            remoteById[
                String(
                    normalizedRemoteReadings[index].id
                )
            ] =
                normalizedRemoteReadings[index];
        }
    }

    for (
        index = 0;
        index < normalizedLocalReadings.length;
        index += 1
    ) {
        if (normalizedLocalReadings[index]) {
            merged.push(
                normalizedLocalReadings[index]
            );
        }
    }

    Object.keys(remoteById).forEach(function (id) {
        if (!localById[id]) {
            merged.push(remoteById[id]);
        }
    });

    return sortReadings(merged);
}

function syncReadings(callback) {
    var localReadings;

    callback = callback || function () { };

    if (!isConfigured()) {
        callback({
            ok: false,
            configured: false,
            synced: false,
            error: "Google Sheets URL is not configured."
        });
        return;
    }

    localReadings = getLocalReadings();

    requestReadings(function (readResult) {
        var remoteReadings;
        var merged;

        if (!readResult.ok) {
            callback({
                ok: false,
                configured: true,
                synced: false,
                error: readResult.error
            });
            return;
        }

        remoteReadings =
            readResult.data &&
                Array.isArray(readResult.data.readings)
                ? readResult.data.readings
                : [];

        merged = mergeReadings(
            localReadings,
            remoteReadings
        );

        if (!saveLocalReadings(merged)) {
            callback({
                ok: false,
                configured: true,
                synced: false,
                error: "Unable to update local readings after synchronization."
            });
            return;
        }

        var writeIndex = 0;

        function writeNext() {
            if (writeIndex >= merged.length) {
                callback({
                    ok: true,
                    configured: true,
                    synced: true,
                    count: merged.length,
                    message:
                        "Google Sheets synchronization completed."
                });
                return;
            }

            requestSyncReading(merged[writeIndex], function (writeResult) {
                if (!writeResult.ok) {
                    callback({
                        ok: false,
                        configured: true,
                        synced: false,
                        localMerged: true,
                        error: writeResult.error
                    });
                    return;
                }

                writeIndex += 1;
                writeNext();
            });
        }

        writeNext();
    });
}

export {
    getLocalReadings,
    isConfigured,
    syncReadings
};
