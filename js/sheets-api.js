/*
 * Solar Energy Dashboard
 * Commit 7 - Google Sheets synchronization
 *
 * Client-side transport only.
 * No Google API secret is stored in the browser.
 *
 * Google Identity Services is used only to obtain a short-lived
 * Google ID token for synchronization writes. The Apps Script backend
 * validates that token and checks WRITE_ALLOWED_EMAIL.
 */

import { CONFIG } from "./config.js";
import { replaceTariffConfigs } from "./tariff-engine.js";

var STORAGE_KEY = "solarEnergyDashboard.readings";
var GOOGLE_IDENTITY_SCRIPT_URL =
    "https://accounts.google.com/gsi/client";

function getReadUrl() {
    return CONFIG.API.GOOGLE_SCRIPT_READ_URL || "";
}

function getWriteUrl() {
    return CONFIG.API.GOOGLE_SCRIPT_WRITE_URL || "";
}

function getGoogleClientId() {
    if (CONFIG.GOOGLE_CLIENT_ID) {
        return CONFIG.GOOGLE_CLIENT_ID;
    }

    if (
        CONFIG.API &&
        CONFIG.API.GOOGLE_CLIENT_ID
    ) {
        return CONFIG.API.GOOGLE_CLIENT_ID;
    }

    return "";
}

function isConfigured() {
    return (
        getReadUrl().trim() !== "" &&
        getWriteUrl().trim() !== "" &&
        getGoogleClientId().trim() !== ""
    );
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
        console.error(
            "Unable to read local readings:",
            error
        );

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
        console.error(
            "Unable to save synchronized readings:",
            error
        );

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
    match = text.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

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
    month = String(
        date.getMonth() + 1
    );
    day = String(
        date.getDate()
    );

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

    Object.keys(reading).forEach(
        function (key) {
            normalized[key] =
                reading[key];
        }
    );

    normalized.readingDate =
        normalizeReadingDate(
            reading.readingDate
        );

    return normalized;
}

function normalizeReadings(readings) {
    return (
        Array.isArray(readings)
            ? readings
            : []
    ).map(function (reading) {
        return normalizeReading(
            reading
        );
    });
}

function nextCallbackName() {
    return (
        "solarSheetsCallback_" +
        String(Date.now()) +
        "_" +
        String(
            Math.floor(
                Math.random() * 100000
            )
        )
    );
}

/*
 * Google Identity Services loader.
 */
var googleIdentityScriptPromise = null;

function loadGoogleIdentityServices(
    callback
) {
    if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
    ) {
        callback(null);
        return;
    }

    if (
        googleIdentityScriptPromise
    ) {
        googleIdentityScriptPromise(
            callback
        );
        return;
    }

    googleIdentityScriptPromise =
        function (done) {
            var script;
            var completed = false;

            function finish(error) {
                if (completed) {
                    return;
                }

                completed = true;

                if (error) {
                    done(error);
                    return;
                }

                if (
                    window.google &&
                    window.google.accounts &&
                    window.google.accounts.id
                ) {
                    done(null);
                    return;
                }

                done(
                    new Error(
                        "Google sign-in is unavailable."
                    )
                );
            }

            script =
                document.createElement(
                    "script"
                );

            script.src =
                GOOGLE_IDENTITY_SCRIPT_URL;

            script.async = true;
            script.defer = true;

            script.onload =
                function () {
                    finish(null);
                };

            script.onerror =
                function () {
                    finish(
                        new Error(
                            "Unable to load Google sign-in."
                        )
                    );
                };

            document.head.appendChild(
                script
            );

            window.setTimeout(
                function () {
                    finish(
                        new Error(
                            "Google sign-in timed out while loading."
                        )
                    );
                },
                CONFIG.API.REQUEST_TIMEOUT ||
                30000
            );
        };

    googleIdentityScriptPromise(
        callback
    );
}

/*
 * Google Identity Services session state.
 *
 * The ID token is kept only in memory for the lifetime of the page.
 * It is never written to localStorage, sessionStorage, cookies, or config.
 */
var googleCredential = "";
var googleCredentialExpiry = 0;
var googleIdentityInitialized = false;

function getJwtExpiry(credential) {
    var parts;
    var payload;
    var decoded;
    var json;

    if (!credential) {
        return 0;
    }

    parts = String(credential).split(".");

    if (parts.length < 2) {
        return 0;
    }

    try {
        payload = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        while (payload.length % 4) {
            payload += "=";
        }

        decoded = window.atob(payload);
        json = JSON.parse(decoded);

        return Number(json.exp || 0);
    } catch (error) {
        return 0;
    }
}

function cacheGoogleCredential(credential) {
    googleCredential =
        String(credential || "").trim();

    googleCredentialExpiry =
        getJwtExpiry(
            googleCredential
        );
}

function clearGoogleCredential() {
    googleCredential = "";
    googleCredentialExpiry = 0;
}

function isGoogleSignedIn() {
    var nowSeconds =
        Math.floor(
            new Date().getTime() / 1000
        );

    return (
        googleCredential !== "" &&
        googleCredentialExpiry > nowSeconds + 30
    );
}

function initializeGoogleIdentity(callback) {
    var clientId =
        getGoogleClientId();

    callback =
        callback ||
        function () {};

    if (!clientId) {
        callback(
            new Error(
                "Google Client ID is not configured."
            )
        );
        return;
    }

    if (googleIdentityInitialized) {
        callback(null);
        return;
    }

    loadGoogleIdentityServices(
        function (loadError) {
            if (loadError) {
                callback(
                    loadError
                );
                return;
            }

            try {
                window.google.accounts.id.initialize({
                    client_id:
                        clientId,
                    auto_select:
                        false,
                    cancel_on_tap_outside:
                        false,
                    callback:
                        function (
                            response
                        ) {
                            if (
                                response &&
                                response.credential
                            ) {
                                cacheGoogleCredential(
                                    response.credential
                                );
                            }
                        }
                });

                googleIdentityInitialized =
                    true;

                callback(null);
            } catch (error) {
                callback(
                    error
                );
            }
        }
    );
}

/*
 * Render the official Google sign-in button.
 *
 * The caller receives the short-lived credential through the callback
 * result, but the credential itself is retained only in this module's
 * memory so a later Sync can reuse it without showing the prompt again.
 */
function renderGoogleSignInButton(
    container,
    callback
) {
    callback =
        callback ||
        function () {};

    if (!container) {
        callback({
            ok: false,
            error:
                "Google sign-in container was not found."
        });
        return;
    }

    initializeGoogleIdentity(
        function (error) {
            if (error) {
                callback({
                    ok: false,
                    error:
                        error.message ||
                        String(error)
                });
                return;
            }

            try {
                container.innerHTML = "";

                window.google.accounts.id.renderButton(
                    container,
                    {
                        type: "standard",
                        theme: "outline",
                        size: "medium",
                        text: "signin_with",
                        shape: "rectangular",
                        width: 130,
                        logo_alignment: "left"
                    }
                );

                /*
                 * GIS invokes the initialize callback when the user
                 * completes the button sign-in. Poll briefly for the
                 * in-memory credential so the UI caller can react.
                 */
                var attempts = 0;
                var checkId =
                    window.setInterval(
                        function () {
                            attempts += 1;

                            if (
                                isGoogleSignedIn()
                            ) {
                                window.clearInterval(
                                    checkId
                                );

                                callback({
                                    ok: true
                                });

                                return;
                            }

                            if (
                                attempts >= 150
                            ) {
                                window.clearInterval(
                                    checkId
                                );
                            }
                        },
                        200
                    );
            } catch (renderError) {
                callback({
                    ok: false,
                    error:
                        renderError.message ||
                        String(renderError)
                });
            }
        }
    );
}

/*
 * Obtain a Google Identity Services ID token.
 *
 * If the user has already signed in using the header button, reuse the
 * still-valid in-memory token. Otherwise show the Google sign-in prompt.
 */
function getGoogleIdToken(callback) {
    var completed = false;
    var timeoutId;

    callback =
        callback ||
        function () {};

    if (
        isGoogleSignedIn()
    ) {
        callback({
            ok: true,
            credential:
                googleCredential
        });
        return;
    }

    initializeGoogleIdentity(
        function (loadError) {
            if (loadError) {
                callback({
                    ok: false,
                    error:
                        loadError.message ||
                        String(loadError)
                });
                return;
            }

            function finish(result) {
                if (completed) {
                    return;
                }

                completed = true;

                if (timeoutId) {
                    window.clearTimeout(
                        timeoutId
                    );
                }

                callback(result);
            }

            try {
                /*
                 * initialize() is intentionally not called again here.
                 * Google documents that initialize should be called once;
                 * the same initialized client is reused for prompt().
                 */
                window.google.accounts.id.prompt(
                    function (
                        notification
                    ) {
                        if (
                            notification &&
                            notification.isNotDisplayed &&
                            notification.isNotDisplayed()
                        ) {
                            /*
                             * Do not fail immediately. The browser may
                             * still complete the credential flow.
                             */
                        }

                        if (
                            notification &&
                            notification.isSkippedMoment &&
                            notification.isSkippedMoment()
                        ) {
                            /*
                             * Wait for the timeout so the caller receives
                             * one deterministic error.
                             */
                        }
                    }
                );

                timeoutId =
                    window.setTimeout(
                        function () {
                            if (
                                isGoogleSignedIn()
                            ) {
                                finish({
                                    ok: true,
                                    credential:
                                        googleCredential
                                });
                                return;
                            }

                            finish({
                                ok: false,
                                error:
                                    "Google sign-in is required for synchronization. Please complete the Google sign-in prompt and try Sync again."
                            });
                        },
                        CONFIG.API.REQUEST_TIMEOUT ||
                        30000
                    );

                /*
                 * If the credential arrives before the timeout, finish
                 * without waiting for the full timeout.
                 */
                var attempts = 0;
                var checkId =
                    window.setInterval(
                        function () {
                            attempts += 1;

                            if (
                                isGoogleSignedIn()
                            ) {
                                window.clearInterval(
                                    checkId
                                );

                                finish({
                                    ok: true,
                                    credential:
                                        googleCredential
                                });

                                return;
                            }

                            if (
                                completed ||
                                attempts >= 150
                            ) {
                                window.clearInterval(
                                    checkId
                                );
                            }
                        },
                        200
                    );
            } catch (error) {
                finish({
                    ok: false,
                    error:
                        error.message ||
                        String(error)
                });
            }
        }
    );
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
    var url = getReadUrl();
    var completed = false;

    if (!url) {
        callback({
            ok: false,
            configured: false,
            error:
                "Google Sheets read URL is not configured."
        });
        return;
    }

    callbackName =
        nextCallbackName();

    function cleanup() {
        if (
            script &&
            script.parentNode
        ) {
            script.parentNode.removeChild(
                script
            );
        }

        try {
            delete window[
                callbackName
            ];
        } catch (error) {
            window[
                callbackName
            ] = undefined;
        }
    }

    window[callbackName] =
        function (response) {
            if (completed) {
                return;
            }

            completed = true;
            cleanup();

            callback({
                ok:
                    response &&
                    response.ok === true,
                configured: true,
                data:
                    response || null,
                error:
                    response &&
                    response.error
                        ? response.error
                        : null
            });
        };

    script =
        document.createElement(
            "script"
        );

    script.async = true;

    script.src =
        url +
        (
            url.indexOf("?") === -1
                ? "?"
                : "&"
        ) +
        "action=readings&callback=" +
        encodeURIComponent(
            callbackName
        );

    script.onerror =
        function () {
            if (completed) {
                return;
            }

            completed = true;
            cleanup();

            callback({
                ok: false,
                configured: true,
                error:
                    "Unable to connect to Google Sheets."
            });
        };

    document.head.appendChild(
        script
    );

    window.setTimeout(
        function () {
            if (completed) {
                return;
            }

            completed = true;
            cleanup();

            callback({
                ok: false,
                configured: true,
                error:
                    "Google Sheets request timed out."
            });
        },
        CONFIG.API.REQUEST_TIMEOUT ||
        30000
    );
}

function requestSyncReading(
    reading,
    credential,
    callback
) {
    var script;
    var callbackName;
    var url = getWriteUrl();
    var completed = false;

    var payload =
        JSON.stringify({
            action: "sync",
            credential:
                credential,
            readings: [
                reading
            ]
        });

    if (!url) {
        callback({
            ok: false,
            configured: false,
            error:
                "Google Sheets write URL is not configured."
        });
        return;
    }

    if (!credential) {
        callback({
            ok: false,
            configured: true,
            error:
                "Google sign-in is required for synchronization writes."
        });
        return;
    }

    callbackName =
        nextCallbackName();

    function cleanup() {
        if (
            script &&
            script.parentNode
        ) {
            script.parentNode.removeChild(
                script
            );
        }

        try {
            delete window[
                callbackName
            ];
        } catch (error) {
            window[
                callbackName
            ] = undefined;
        }
    }

    window[callbackName] =
        function (response) {
            if (completed) {
                return;
            }

            completed = true;
            cleanup();

            callback({
                ok:
                    response &&
                    response.ok === true,
                configured: true,
                data:
                    response || null,
                error:
                    response &&
                    response.error
                        ? response.error
                        : null
            });
        };

    script =
        document.createElement(
            "script"
        );

    script.async = true;

    script.src =
        url +
        (
            url.indexOf("?") === -1
                ? "?"
                : "&"
        ) +
        "action=sync&callback=" +
        encodeURIComponent(
            callbackName
        ) +
        "&payload=" +
        encodeURIComponent(
            payload
        );

    script.onerror =
        function () {
            if (completed) {
                return;
            }

            completed = true;
            cleanup();

            callback({
                ok: false,
                configured: true,
                error:
                    "Unable to synchronize with Google Sheets."
            });
        };

    document.head.appendChild(
        script
    );

    window.setTimeout(
        function () {
            if (completed) {
                return;
            }

            completed = true;
            cleanup();

            callback({
                ok: false,
                configured: true,
                error:
                    "Google Sheets synchronization timed out."
            });
        },
        CONFIG.API.REQUEST_TIMEOUT ||
        30000
    );
}

function sortReadings(
    readings
) {
    return readings
        .slice()
        .sort(
            function (a, b) {
                var dateA =
                    String(
                        a.readingDate ||
                        ""
                    );

                var dateB =
                    String(
                        b.readingDate ||
                        ""
                    );

                if (
                    dateA !== dateB
                ) {
                    return dateA.localeCompare(
                        dateB
                    );
                }

                return String(
                    a.createdAt ||
                    ""
                ).localeCompare(
                    String(
                        b.createdAt ||
                        ""
                    )
                );
            }
        );
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
function mergeReadings(
    localReadings,
    remoteReadings
) {
    var merged = [];
    var localById = {};
    var remoteById = {};
    var normalizedLocalReadings =
        normalizeReadings(
            localReadings
        );
    var normalizedRemoteReadings =
        normalizeReadings(
            remoteReadings
        );
    var index;

    for (
        index = 0;
        index <
        normalizedLocalReadings.length;
        index += 1
    ) {
        if (
            normalizedLocalReadings[
                index
            ] &&
            normalizedLocalReadings[
                index
            ].id
        ) {
            localById[
                String(
                    normalizedLocalReadings[
                        index
                    ].id
                )
            ] =
                normalizedLocalReadings[
                    index
                ];
        }
    }

    for (
        index = 0;
        index <
        normalizedRemoteReadings.length;
        index += 1
    ) {
        if (
            normalizedRemoteReadings[
                index
            ] &&
            normalizedRemoteReadings[
                index
            ].id
        ) {
            remoteById[
                String(
                    normalizedRemoteReadings[
                        index
                    ].id
                )
            ] =
                normalizedRemoteReadings[
                    index
                ];
        }
    }

    for (
        index = 0;
        index <
        normalizedLocalReadings.length;
        index += 1
    ) {
        if (
            normalizedLocalReadings[
                index
            ]
        ) {
            merged.push(
                normalizedLocalReadings[
                    index
                ]
            );
        }
    }

    Object.keys(
        remoteById
    ).forEach(
        function (id) {
            if (
                !localById[id]
            ) {
                merged.push(
                    remoteById[id]
                );
            }
        }
    );

    return sortReadings(
        merged
    );
}

function saveRemoteTariffs(
    tariffs
) {
    if (
        !Array.isArray(
            tariffs
        ) ||
        !tariffs.length
    ) {
        return false;
    }

    return replaceTariffConfigs(
        tariffs
    );
}

function syncReadings(
    callback
) {
    var localReadings;

    callback =
        callback ||
        function () {};

    if (!isConfigured()) {
        callback({
            ok: false,
            configured: false,
            synced: false,
            error:
                "Google Sheets read/write URLs or Google Client ID are not configured."
        });
        return;
    }

    localReadings =
        getLocalReadings();

    requestReadings(
        function (
            readResult
        ) {
            var remoteReadings;
            var remoteTariffs;
            var tariffsSynced;
            var merged;

            if (!readResult.ok) {
                callback({
                    ok: false,
                    configured: true,
                    synced: false,
                    error:
                        readResult.error
                });
                return;
            }

            remoteReadings =
                readResult.data &&
                Array.isArray(
                    readResult.data.readings
                )
                    ? readResult.data.readings
                    : [];

            remoteTariffs =
                readResult.data &&
                Array.isArray(
                    readResult.data.tariffs
                )
                    ? readResult.data.tariffs
                    : [];

            tariffsSynced =
                saveRemoteTariffs(
                    remoteTariffs
                );

            if (tariffsSynced) {
                window.dispatchEvent(
                    new CustomEvent(
                        "solar:tariff-settings-changed"
                    )
                );
            }

            merged =
                mergeReadings(
                    localReadings,
                    remoteReadings
                );

            if (
                !saveLocalReadings(
                    merged
                )
            ) {
                callback({
                    ok: false,
                    configured: true,
                    synced: false,
                    error:
                        "Unable to update local readings after synchronization."
                });
                return;
            }

            /*
             * Obtain one Google ID token for the whole synchronization.
             * The token is not persisted.
             */
            getGoogleIdToken(
                function (
                    authResult
                ) {
                    var credential;
                    var writeIndex =
                        0;

                    if (
                        !authResult ||
                        !authResult.ok ||
                        !authResult.credential
                    ) {
                        callback({
                            ok: false,
                            configured: true,
                            synced: false,
                            localMerged: true,
                            error:
                                authResult &&
                                authResult.error
                                    ? authResult.error
                                    : "Google sign-in is required for synchronization writes."
                        });
                        return;
                    }

                    credential =
                        authResult.credential;

                    function writeNext() {
                        if (
                            writeIndex >=
                            merged.length
                        ) {
                            callback({
                                ok: true,
                                configured: true,
                                synced: true,
                                count:
                                    merged.length,
                                tariffCount:
                                    remoteTariffs.length,
                                tariffsSynced:
                                    tariffsSynced,
                                message:
                                    "Google Sheets synchronization completed."
                            });
                            return;
                        }

                        requestSyncReading(
                            merged[
                                writeIndex
                            ],
                            credential,
                            function (
                                writeResult
                            ) {
                                if (
                                    !writeResult.ok
                                ) {
                                    callback({
                                        ok: false,
                                        configured: true,
                                        synced: false,
                                        localMerged: true,
                                        error:
                                            writeResult.error
                                    });
                                    return;
                                }

                                writeIndex +=
                                    1;

                                writeNext();
                            }
                        );
                    }

                    writeNext();
                }
            );
        }
    );
}

export {
    getLocalReadings,
    isConfigured,
    syncReadings,
    renderGoogleSignInButton,
    isGoogleSignedIn
};
