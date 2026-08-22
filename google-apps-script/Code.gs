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
 * Deployment model:
 *   - Public read deployment: anonymous reads are allowed.
 *   - Authenticated write deployment: signed-in users are allowed to
 *     reach the web app, but only WRITE_ALLOWED_EMAIL may synchronize.
 *
 * The write deployment should execute as the user accessing the web app.
 * WRITE_ALLOWED_EMAIL is stored in Apps Script Script Properties and is
 * intentionally not committed to the repository.
 *
 * Readings remain append/update synchronized.
 * Tariff Master and Tariff Slabs are read-only master data for the browser.
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

var TARIFF_MASTER_SHEET_NAME = "Tariff Master";
var TARIFF_SLABS_SHEET_NAME = "Tariff Slabs";

var TARIFF_MASTER_HEADERS = [
    "Tariff Year",
    "Effective From",
    "Effective To",
    "Consumer Category",
    "Supply Phase",
    "Recorded MD (kW)",
    "Fixed Charge (₹/kW)",
    "Customer Charge (₹/month)",
    "Export Settlement Rate (₹/kWh)",
    "FPPCA Included"
];

var TARIFF_SLAB_HEADERS = [
    "Tariff Year",
    "From Unit",
    "To Unit",
    "Rate (₹/kWh)"
];

var DEFAULT_TARIFF_SLABS = [
    [0, 30, 1.90],
    [31, 75, 3.00],
    [76, 125, 4.50],
    [126, 225, 6.00],
    [226, 400, 8.75],
    [401, "", 9.75]
];

var DEFAULT_TARIFF_MASTER = [
    ["2025-26", "2025-04-01", "2026-03-31", "LT-I Domestic", "Single Phase", 4, 10, 30, 2.09, false],
    ["2026-27", "2026-04-01", "2027-03-31", "LT-I Domestic", "Single Phase", 4, 10, 30, 2.09, false]
];
var WRITE_ALLOWED_EMAIL_PROPERTY = "WRITE_ALLOWED_EMAIL";

function requireAuthorizedWriter() {
    var allowedEmails = String(
        PropertiesService
            .getScriptProperties()
            .getProperty(WRITE_ALLOWED_EMAIL_PROPERTY) || ""
    )
        .split(",")
        .map(function (email) {
            return email.trim().toLowerCase();
        })
        .filter(function (email) {
            return email !== "";
        });

    var activeEmail = String(
        Session.getActiveUser().getEmail() || ""
    )
        .trim()
        .toLowerCase();

    if (!allowedEmails.length) {
        throw new Error(
            "Write access is not configured. Set the WRITE_ALLOWED_EMAIL script property."
        );
    }

    if (!activeEmail) {
        throw new Error(
            "Google sign-in is required for synchronization writes."
        );
    }

    if (allowedEmails.indexOf(activeEmail) === -1) {
        throw new Error(
            "You are not authorized to modify Solar Energy Dashboard data."
        );
    }
}

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


function ensureSheetHeaders(sheet, headers) {
    var range;
    var current;
    var needsUpdate = false;
    var index;

    if (sheet.getLastRow() === 0) {
        range = sheet.getRange(1, 1, 1, headers.length);
        range.setValues([headers]);
        range.setFontWeight("bold");
        sheet.setFrozenRows(1);
        return;
    }

    range = sheet.getRange(1, 1, 1, headers.length);
    current = range.getValues()[0];

    for (index = 0; index < headers.length; index += 1) {
        if (current[index] !== headers[index]) {
            needsUpdate = true;
            break;
        }
    }

    if (needsUpdate) {
        range.setValues([headers]);
        range.setFontWeight("bold");
        sheet.setFrozenRows(1);
    }
}

function getTariffMasterSheet() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;

    if (!spreadsheet) {
        throw new Error(
            "No active spreadsheet. Bind this Apps Script project to the Solar Energy Dashboard Google Sheet."
        );
    }

    sheet = spreadsheet.getSheetByName(TARIFF_MASTER_SHEET_NAME);

    if (!sheet) {
        sheet = spreadsheet.insertSheet(TARIFF_MASTER_SHEET_NAME);
    }

    ensureSheetHeaders(sheet, TARIFF_MASTER_HEADERS);

    if (sheet.getLastRow() < 2) {
        sheet.getRange(
            2,
            1,
            DEFAULT_TARIFF_MASTER.length,
            TARIFF_MASTER_HEADERS.length
        ).setValues(DEFAULT_TARIFF_MASTER);
    }

    return sheet;
}

function getTariffSlabsSheet() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;
    var rows = [];
    var tariffIndex;
    var slabIndex;

    if (!spreadsheet) {
        throw new Error(
            "No active spreadsheet. Bind this Apps Script project to the Solar Energy Dashboard Google Sheet."
        );
    }

    sheet = spreadsheet.getSheetByName(TARIFF_SLABS_SHEET_NAME);

    if (!sheet) {
        sheet = spreadsheet.insertSheet(TARIFF_SLABS_SHEET_NAME);
    }

    ensureSheetHeaders(sheet, TARIFF_SLAB_HEADERS);

    if (sheet.getLastRow() < 2) {
        for (tariffIndex = 0; tariffIndex < DEFAULT_TARIFF_MASTER.length; tariffIndex += 1) {
            for (slabIndex = 0; slabIndex < DEFAULT_TARIFF_SLABS.length; slabIndex += 1) {
                rows.push([
                    DEFAULT_TARIFF_MASTER[tariffIndex][0],
                    DEFAULT_TARIFF_SLABS[slabIndex][0],
                    DEFAULT_TARIFF_SLABS[slabIndex][1],
                    DEFAULT_TARIFF_SLABS[slabIndex][2]
                ]);
            }
        }

        sheet.getRange(
            2,
            1,
            rows.length,
            TARIFF_SLAB_HEADERS.length
        ).setValues(rows);
    }

    return sheet;
}

function formatTariffDate(value) {
    var date;

    if (!value) {
        return "";
    }

    if (Object.prototype.toString.call(value) === "[object Date]") {
        if (isNaN(value.getTime())) {
            return "";
        }

        return Utilities.formatDate(
            value,
            Session.getScriptTimeZone() || "Asia/Kolkata",
            "yyyy-MM-dd"
        );
    }

    return String(value).substring(0, 10);
}

function readTariffConfigs() {
    var masterSheet = getTariffMasterSheet();
    var slabSheet = getTariffSlabsSheet();
    var masterLastRow = masterSheet.getLastRow();
    var slabLastRow = slabSheet.getLastRow();
    var masters = masterLastRow >= 2
        ? masterSheet.getRange(
            2,
            1,
            masterLastRow - 1,
            TARIFF_MASTER_HEADERS.length
        ).getValues()
        : [];
    var slabRows = slabLastRow >= 2
        ? slabSheet.getRange(
            2,
            1,
            slabLastRow - 1,
            TARIFF_SLAB_HEADERS.length
        ).getValues()
        : [];
    var slabsByYear = {};
    var configs = [];
    var index;
    var year;
    var slab;

    for (index = 0; index < slabRows.length; index += 1) {
        year = String(slabRows[index][0] || "").trim();

        if (!year) {
            continue;
        }

        if (!slabsByYear[year]) {
            slabsByYear[year] = [];
        }

        slab = {
            from: Number(slabRows[index][1] || 0),
            to: slabRows[index][2] === "" || slabRows[index][2] === null
                ? null
                : Number(slabRows[index][2]),
            rate: Number(slabRows[index][3] || 0)
        };

        slabsByYear[year].push(slab);
    }

    for (index = 0; index < masters.length; index += 1) {
        year = String(masters[index][0] || "").trim();

        if (!year) {
            continue;
        }

        configs.push({
            tariffYear: year,
            effectiveFrom: formatTariffDate(masters[index][1]),
            effectiveTo: formatTariffDate(masters[index][2]),
            consumerCategory: String(masters[index][3] || ""),
            supplyPhase: String(masters[index][4] || ""),
            recordedMdKw: Number(masters[index][5] || 0),
            fixedChargePerKw: Number(masters[index][6] || 0),
            customerCharge: Number(masters[index][7] || 0),
            exportSettlementRate: Number(masters[index][8] || 0),
            includeFppca: false,
            slabs: slabsByYear[year] || []
        });
    }

    return configs;
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
                    readAllReadings(),
                tariffs:
                    readTariffConfigs()
            }, callbackName);
        }

        if (action === "tariffs") {
            return jsonResponse({
                ok: true,
                tariffs:
                    readTariffConfigs()
            }, callbackName);
        }

        if (action === "sync") {
            requireAuthorizedWriter();

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
        requireAuthorizedWriter();

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
