/*
 * Solar Energy Dashboard
 * Commit 7 - Google Sheets API
 *
 * IMPORTANT:
 * Create this Apps Script from the target Google Sheet:
 * Google Sheet -> Extensions -> Apps Script
 *
 * Sheet used by this API:
 *   Solar Energy Dashboard
 *
 * The web app should execute as the spreadsheet owner.
 *
 * Commit 7 is append/update synchronization only.
 * Deletion propagation is intentionally out of scope.
 */

var SHEET_NAME = "Solar Energy Dashboard";

var HEADERS = [
    "ID",
    "Reading Date",
    "Grid Import",
    "Grid Export",
    "Solar Generation",
    "Month End",
    "Solar Generation Units",
    "Grid Import Units",
    "Grid Export Units",
    "Home Consumption",
    "Created At"
];

function jsonResponse(payload, callbackName) {
    var body = JSON.stringify(payload);

    if (callbackName) {
        body =
            String(callbackName) +
            "(" +
            body +
            ");";

        return ContentService
            .createTextOutput(body)
            .setMimeType(
                ContentService.MimeType.JAVASCRIPT
            );
    }

    return ContentService
        .createTextOutput(body)
        .setMimeType(
            ContentService.MimeType.JSON
        );
}

function getParameter(e, name) {
    return e &&
        e.parameter &&
        e.parameter[name]
        ? String(e.parameter[name])
        : "";
}

function getSafeCallbackName(e) {
    var callbackName =
        getParameter(e, "callback");

    if (!callbackName) {
        return "";
    }

    if (!/^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callbackName)) {
        throw new Error(
            "Invalid JSONP callback name."
        );
    }

    return callbackName;
}

function parsePayload(payload) {
    if (!payload) {
        return {};
    }

    return JSON.parse(payload);
}

function getSheet() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (!spreadsheet) {
        throw new Error(
            "No active spreadsheet. Bind this Apps Script project to the Solar Energy Dashboard Google Sheet."
        );
    }

    var sheet =
        spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
        sheet =
            spreadsheet.insertSheet(SHEET_NAME);
    }

    ensureHeaders(sheet);

    return sheet;
}

function ensureHeaders(sheet) {
    var range;

    if (sheet.getLastRow() === 0) {
        range =
            sheet.getRange(
                1,
                1,
                1,
                HEADERS.length
            );

        range.setValues([HEADERS]);
        range.setFontWeight("bold");
        sheet.setFrozenRows(1);
        return;
    }

    range =
        sheet.getRange(
            1,
            1,
            1,
            HEADERS.length
        );

    var current =
        range.getValues()[0];

    var needsUpdate = false;
    var index;

    for (index = 0; index < HEADERS.length; index += 1) {
        if (current[index] !== HEADERS[index]) {
            needsUpdate = true;
            break;
        }
    }

    if (needsUpdate) {
        range.setValues([HEADERS]);
        range.setFontWeight("bold");
        sheet.setFrozenRows(1);
    }
}

function toReading(row) {
    return {
        id: String(row[0] || ""),
        readingDate: String(row[1] || ""),
        gridImport: Number(row[2] || 0),
        gridExport: Number(row[3] || 0),
        solarInverter: Number(row[4] || 0),
        isMonthEnd:
            row[5] === true ||
            String(row[5]).toLowerCase() === "true",
        calculation: {
            solarGeneration:
                Number(row[6] || 0),
            gridImportUnits:
                Number(row[7] || 0),
            gridExportUnits:
                Number(row[8] || 0),
            homeConsumption:
                Number(row[9] || 0)
        },
        createdAt: String(row[10] || "")
    };
}

function readAllReadings() {
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) {
        return [];
    }

    var values =
        sheet
            .getRange(
                2,
                1,
                lastRow - 1,
                HEADERS.length
            )
            .getValues();

    return values
        .map(toReading)
        .filter(function (reading) {
            return reading.id !== "";
        });
}

function readingToRow(reading) {
    var calculation =
        reading.calculation || {};

    return [
        String(reading.id || ""),
        String(reading.readingDate || ""),
        Number(reading.gridImport || 0),
        Number(reading.gridExport || 0),
        Number(reading.solarInverter || 0),
        Boolean(reading.isMonthEnd),
        Number(
            calculation.solarGeneration ||
            reading.solarInverter ||
            0
        ),
        Number(
            calculation.gridImportUnits || 0
        ),
        Number(
            calculation.gridExportUnits || 0
        ),
        Number(
            calculation.homeConsumption || 0
        ),
        String(reading.createdAt || "")
    ];
}

function upsertReadings(readings) {
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();
    var existingIds = {};
    var row;
    var index;
    var id;

    if (lastRow >= 2) {
        var existing =
            sheet
                .getRange(
                    2,
                    1,
                    lastRow - 1,
                    1
                )
                .getValues();

        for (
            index = 0;
            index < existing.length;
            index += 1
        ) {
            id = String(
                existing[index][0] || ""
            );

            if (id) {
                existingIds[id] =
                    index + 2;
            }
        }
    }

    var created = 0;
    var updated = 0;

    readings.forEach(function (reading) {
        if (
            !reading ||
            !reading.id
        ) {
            return;
        }

        id = String(reading.id);
        row = readingToRow(reading);

        if (existingIds[id]) {
            sheet
                .getRange(
                    existingIds[id],
                    1,
                    1,
                    HEADERS.length
                )
                .setValues([row]);

            updated += 1;
        } else {
            sheet
                .getRange(
                    sheet.getLastRow() + 1,
                    1,
                    1,
                    HEADERS.length
                )
                .setValues([row]);

            existingIds[id] =
                sheet.getLastRow();

            created += 1;
        }
    });

    return {
        created: created,
        updated: updated
    };
}

function doGet(e) {
    var callbackName = getSafeCallbackName(e);

    try {
        var action =
            getParameter(e, "action") ||
            "readings";

        if (action === "health") {
            return jsonResponse({
                ok: true,
                service:
                    "Solar Energy Dashboard Google Sheets API",
                version: 2
            }, callbackName);
        }

        if (action === "readings") {
            return jsonResponse({
                ok: true,
                readings:
                    readAllReadings()
            }, callbackName);
        }

        if (action === "sync") {
            var payload = parsePayload(
                getParameter(e, "payload")
            );

            if (payload.action !== "sync") {
                return jsonResponse({
                    ok: false,
                    error:
                        "Unsupported sync payload."
                }, callbackName);
            }

            var readings =
                Array.isArray(payload.readings)
                    ? payload.readings
                    : [];

            var result =
                upsertReadings(readings);

            return jsonResponse({
                ok: true,
                message:
                    "Synchronization completed.",
                created:
                    result.created,
                updated:
                    result.updated,
                count:
                    readAllReadings().length
            }, callbackName);
        }

        return jsonResponse({
            ok: false,
            error:
                "Unsupported GET action."
        }, callbackName);
    } catch (error) {
        return jsonResponse({
            ok: false,
            error: String(error.message || error)
        }, callbackName);
    }
}

function doPost(e) {
    try {
        var body =
            e &&
            e.postData &&
            e.postData.contents
                ? JSON.parse(
                    e.postData.contents
                )
                : {};

        if (
            body.action !== "sync"
        ) {
            return jsonResponse({
                ok: false,
                error:
                    "Unsupported POST action."
            });
        }

        var readings =
            Array.isArray(body.readings)
                ? body.readings
                : [];

        var result =
            upsertReadings(
                readings
            );

        return jsonResponse({
            ok: true,
            message:
                "Synchronization completed.",
            created:
                result.created,
            updated:
                result.updated,
            count:
                readAllReadings().length
        });
    } catch (error) {
        return jsonResponse({
            ok: false,
            error: String(error.message || error)
        });
    }
}
