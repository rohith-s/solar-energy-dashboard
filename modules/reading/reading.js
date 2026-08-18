/* ============================================================
   Solar Energy Dashboard
   Reading Module
   Commit 3 - Reading Form + Calculation Engine Integration
   ============================================================ */


const STORAGE_KEY = "solarEnergyDashboard.readings";

/* ------------------------------------------------------------
   Helpers
   ------------------------------------------------------------ */

function getReadings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const data = JSON.parse(raw);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Unable to read stored readings:", error);
        return [];
    }
}

function saveReadings(readings) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(readings)
        );

        return true;
    } catch (error) {
        console.error("Unable to save readings:", error);
        return false;
    }
}

/**
 * Return the latest reading strictly before the supplied reading date.
 *
 * Important: a reading on the same date must never be used as its own
 * previous reading. This matters when an existing reading is reopened
 * or when the user enters another reading for the current date.
 */
function getPreviousReading(readingDate, excludeId) {
    const readings = getReadings();

    if (!readings.length || !readingDate) {
        return null;
    }

    return readings
        .filter(function (reading) {
            if (!reading || !reading.readingDate) {
                return false;
            }

            if (excludeId && reading.id === excludeId) {
                return false;
            }

            return reading.readingDate < readingDate;
        })
        .sort(function (a, b) {
            if (a.readingDate !== b.readingDate) {
                return b.readingDate.localeCompare(a.readingDate);
            }

            // Deterministic ordering if legacy data contains duplicate dates.
            return String(b.createdAt || "").localeCompare(
                String(a.createdAt || "")
            );
        })[0] || null;
}

/**
 * Keep the old helper for callers that genuinely need the latest saved
 * record, while ensuring the Reading form uses getPreviousReading().
 */
function getLatestReading() {
    const readings = getReadings();

    if (!readings.length) {
        return null;
    }

    return readings
        .slice()
        .sort(function (a, b) {
            if (a.readingDate !== b.readingDate) {
                return b.readingDate.localeCompare(a.readingDate);
            }

            return String(b.createdAt || "").localeCompare(
                String(a.createdAt || "")
            );
        })[0] || null;
}

// function getPreviousReading(readingDate, excludeId) {
//     if (!readingDate) {
//         return null;
//     }

//     return getReadings()
//         .filter(function (reading) {
//             if (excludeId && reading.id === excludeId) {
//                 return false;
//             }

//             return reading.readingDate < readingDate;
//         })
//         .sort(function (a, b) {
//             if (a.readingDate !== b.readingDate) {
//                 return b.readingDate.localeCompare(a.readingDate);
//             }

//             const aCreatedAt = new Date(a.createdAt || 0).getTime();
//             const bCreatedAt = new Date(b.createdAt || 0).getTime();

//             return bCreatedAt - aCreatedAt;
//         })[0] || null;
// }

function formatNumber(value, decimals) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
    const date = new Date();

    return date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ------------------------------------------------------------
   Reading calculations
   ------------------------------------------------------------ */

function calculateReading(current, previous) {
    const currentGridImport = Number(current.gridImport);
    const currentGridExport = Number(current.gridExport);
    const currentSolarInverter = Number(current.solarInverter);

    const previousGridImport = previous
        ? Number(previous.gridImport)
        : null;

    const previousGridExport = previous
        ? Number(previous.gridExport)
        : null;

    let gridImportUnits = 0;
    let gridExportUnits = 0;

    if (previous) {
        gridImportUnits =
            currentGridImport - previousGridImport;

        gridExportUnits =
            currentGridExport - previousGridExport;
    }

    // Solar inverter value is already the
    // production for the current month.
    const solarGenerationUnits = currentSolarInverter;

    gridImportUnits = Math.max(0, gridImportUnits);
    gridExportUnits = Math.max(0, gridExportUnits);

    const homeConsumption =
        solarGenerationUnits +
        gridImportUnits -
        gridExportUnits;

    return {
        gridImportUnits,
        gridExportUnits,
        solarGenerationUnits,
        homeConsumption: Math.max(0, homeConsumption)
    };
}

/* ------------------------------------------------------------
   Validation
   ------------------------------------------------------------ */

function validateReading(values, previous) {
    const errors = [];

    if (!values.readingDate) {
        errors.push("Please select the reading date.");
    }

    if (
        values.gridImport === "" ||
        !Number.isFinite(Number(values.gridImport)) ||
        Number(values.gridImport) < 0
    ) {
        errors.push("Enter a valid Grid Import reading.");
    }

    if (
        values.gridExport === "" ||
        !Number.isFinite(Number(values.gridExport)) ||
        Number(values.gridExport) < 0
    ) {
        errors.push("Enter a valid Grid Export reading.");
    }

    // if (
    //     values.solarInverter === "" ||
    //     !Number.isFinite(Number(values.solarInverter)) ||
    //     Number(values.solarInverter) < 0
    // ) {
    //     errors.push("Enter a valid Solar Inverter reading.");
    // }

    if (previous) {
        if (
            Number(values.gridImport) <
            Number(previous.gridImport)
        ) {
            errors.push(
                "Grid Import reading cannot be lower than the previous reading."
            );
        }

        if (
            Number(values.gridExport) <
            Number(previous.gridExport)
        ) {
            errors.push(
                "Grid Export reading cannot be lower than the previous reading."
            );
        }

        if (
            values.solarInverter === "" ||
            !Number.isFinite(Number(values.solarInverter)) ||
            Number(values.solarInverter) < 0
        ) {
            errors.push("Enter a valid Solar Inverter reading.");
        }
        if (
            Number(values.solarInverter) <
            Number(previous.solarInverter)
        ) {
            errors.push(
                "Solar Inverter reading cannot be lower than the previous reading."
            );
        }
        if (
            values.readingDate <= previous.readingDate
        ) {
            errors.push(
                "Reading date must be after the previous reading date."
            );
        }
    }

    return errors;
}

/* ------------------------------------------------------------
   Reading form
   ------------------------------------------------------------ */

function renderForm() {
    const readingDate = getToday();
    const previous = getPreviousReading(readingDate);

    const previousDate = previous
        ? formatDate(previous.readingDate)
        : "No previous reading";

    const previousGridImport = previous
        ? formatNumber(previous.gridImport, 2)
        : "—";

    const previousGridExport = previous
        ? formatNumber(previous.gridExport, 2)
        : "—";

    const previousSolarInverter = previous
        ? formatNumber(previous.solarInverter, 2)
        : "—";

    return `
            <section class="reading-page">

                <div class="page-header">
                    <div>
                        <div class="eyebrow">Energy tracking</div>
                        <h1>Enter Reading</h1>
                        <p>
                            Record your latest electricity meter and
                            solar inverter readings.
                        </p>
                    </div>

                    <div class="page-month">
                        ${escapeHtml(getCurrentMonth())}
                    </div>
                </div>

                <div class="reading-layout">

                    <div class="card reading-form-card">

                        <div class="card-header">
                            <div>
                                <h2>Current readings</h2>
                                <p>
                                    Enter the values exactly as shown
                                    on your meters.
                                </p>
                            </div>
                        </div>

                        <form id="reading-form" novalidate>

                            <div class="form-grid">

                                <div class="form-field form-field-full">
                                    <label for="reading-date">
                                        Reading Date
                                    </label>

                                    <input
                                        type="date"
                                        id="reading-date"
                                        name="readingDate"
                                        value="${getToday()}"
                                        required
                                    />
                                </div>

                                <div class="reading-input-card">
                                    <div class="reading-icon">
                                        ↓
                                    </div>

                                    <div class="reading-input-content">

                                        <label for="grid-import">
                                            Grid Current Reading
                                        </label>

                                        <span class="field-help">
                                            Grid Import
                                        </span>

                                        <div class="input-with-unit">
                                            <input
                                                type="number"
                                                id="grid-import"
                                                name="gridImport"
                                                min="0"
                                                step="0.01"
                                                inputmode="decimal"
                                                placeholder="0.00"
                                                required
                                            />

                                            <span>kWh</span>
                                        </div>

                                    </div>
                                </div>

                                <div class="reading-input-card">
                                    <div class="reading-icon">
                                        ↑
                                    </div>

                                    <div class="reading-input-content">

                                        <label for="grid-export">
                                            Solar Current Reading
                                        </label>

                                        <span class="field-help">
                                            Grid Export
                                        </span>

                                        <div class="input-with-unit">
                                            <input
                                                type="number"
                                                id="grid-export"
                                                name="gridExport"
                                                min="0"
                                                step="0.01"
                                                inputmode="decimal"
                                                placeholder="0.00"
                                                required
                                            />

                                            <span>kWh</span>
                                        </div>

                                    </div>
                                </div>

                                <div class="reading-input-card form-field-full">
                                    <div class="reading-icon">
                                        ☀
                                    </div>

                                    <div class="reading-input-content">

                                        <label for="solar-inverter">
                                            Inverter Current Month Value
                                        </label>

                                        <span class="field-help">
                                            Solar Inverter
                                        </span>

                                        <div class="input-with-unit">
                                            <input
                                                type="number"
                                                id="solar-inverter"
                                                name="solarInverter"
                                                min="0"
                                                step="0.01"
                                                inputmode="decimal"
                                                placeholder="0.00"
                                                required
                                            />

                                            <span>kWh</span>
                                        </div>

                                    </div>
                                </div>

                            </div>

                            <div class="previous-reading">

                                <div class="previous-reading-header">
                                    <div>
                                        <h3>Previous reading</h3>
                                        <p id="previous-reading-date">
                                            ${escapeHtml(previousDate)}
                                        </p>
                                    </div>
                                </div>

                                <div class="previous-reading-grid">

                                    <div>
                                        <span>Grid Import</span>
                                        <strong id="previous-grid-import">
                                            ${previousGridImport} kWh
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Grid Export</span>
                                        <strong id="previous-grid-export">
                                            ${previousGridExport} kWh
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Solar Inverter</span>
                                        <strong id="previous-solar-inverter">
                                            ${previousSolarInverter} kWh
                                        </strong>
                                    </div>

                                </div>

                            </div>

                            <div
                                id="reading-preview"
                                class="reading-preview"
                                hidden
                            ></div>

                            <div
                                id="reading-errors"
                                class="form-errors"
                                role="alert"
                                hidden
                            ></div>

                            <label class="month-end-option">

                                <input
                                    type="checkbox"
                                    id="is-month-end"
                                    name="isMonthEnd"
                                />

                                <span class="checkbox-ui"></span>

                                <span class="month-end-text">
                                    <strong>
                                        Consider these as month-end readings
                                    </strong>

                                    <small>
                                        Save these values as the month-end
                                        baseline for future calculations.
                                    </small>
                                </span>

                            </label>

                            <div class="form-actions">

                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    id="reading-cancel"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    class="btn btn-primary"
                                >
                                    Save Reading
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </section>
        `;
}

/* ------------------------------------------------------------
   Previous-reading display
   ------------------------------------------------------------ */

function updatePreviousReading() {
    const dateInput = document.getElementById("reading-date");
    const previousDateElement = document.getElementById("previous-reading-date");
    const previousGridImportElement = document.getElementById("previous-grid-import");
    const previousGridExportElement = document.getElementById("previous-grid-export");
    const previousSolarInverterElement = document.getElementById("previous-solar-inverter");

    if (
        !dateInput ||
        !previousDateElement ||
        !previousGridImportElement ||
        !previousGridExportElement ||
        !previousSolarInverterElement
    ) {
        return null;
    }

    const previous = getPreviousReading(dateInput.value);

    previousDateElement.textContent = previous
        ? formatDate(previous.readingDate)
        : "No previous reading";

    previousGridImportElement.textContent = previous
        ? `${formatNumber(previous.gridImport, 2)} kWh`
        : "— kWh";

    previousGridExportElement.textContent = previous
        ? `${formatNumber(previous.gridExport, 2)} kWh`
        : "— kWh";

    previousSolarInverterElement.textContent = previous
        ? `${formatNumber(previous.solarInverter, 2)} kWh`
        : "— kWh";

    return previous;
}

/* ------------------------------------------------------------
   Preview
   ------------------------------------------------------------ */

function updatePreview() {
    const preview = document.getElementById("reading-preview");

    if (!preview) {
        return;
    }

    const gridImport =
        document.getElementById("grid-import");

    const gridExport =
        document.getElementById("grid-export");

    const solarInverter =
        document.getElementById("solar-inverter");

    if (
        !gridImport ||
        !gridExport ||
        !solarInverter
    ) {
        return;
    }

    const gridImportValue = gridImport.value;
    const gridExportValue = gridExport.value;
    const solarInverterValue = solarInverter.value;

    if (
        gridImportValue === "" ||
        gridExportValue === "" ||
        solarInverterValue === ""
    ) {
        preview.hidden = true;
        return;
    }

    const readingDate =
        document.getElementById("reading-date")?.value;

    const previous = getPreviousReading(readingDate);


    const calculation = calculateReading(
        {
            gridImport: gridImportValue,
            gridExport: gridExportValue,
            solarInverter: solarInverterValue
        },
        previous
    );

    preview.innerHTML = `
            <div class="preview-header">
                <h3>Calculated period usage</h3>
                <span>Based on previous reading</span>
            </div>

            <div class="preview-grid">

                <div class="preview-item">
                    <span>Solar Generation</span>
                    <strong>
                        ${formatNumber(
        calculation.solarGenerationUnits,
        2
    )} kWh
                    </strong>
                </div>

                <div class="preview-item">
                    <span>Grid Import</span>
                    <strong>
                        ${formatNumber(
        calculation.gridImportUnits,
        2
    )} kWh
                    </strong>
                </div>

                <div class="preview-item">
                    <span>Grid Export</span>
                    <strong>
                        ${formatNumber(
        calculation.gridExportUnits,
        2
    )} kWh
                    </strong>
                </div>

                <div class="preview-item preview-highlight">
                    <span>Home Consumption</span>
                    <strong>
                        ${formatNumber(
        calculation.homeConsumption,
        2
    )} kWh
                    </strong>
                </div>

            </div>
        `;

    preview.hidden = false;
}

/* ------------------------------------------------------------
   Save reading
   ------------------------------------------------------------ */

function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const values = {
        readingDate:
            document.getElementById("reading-date").value,

        gridImport:
            document.getElementById("grid-import").value,

        gridExport:
            document.getElementById("grid-export").value,

        solarInverter:
            document.getElementById("solar-inverter").value,

        isMonthEnd:
            document.getElementById("is-month-end").checked
    };

    const previous = getPreviousReading(
        values.readingDate
    );

    const errors = validateReading(
        values,
        previous
    );

    const errorContainer =
        document.getElementById("reading-errors");

    if (errors.length) {
        errorContainer.innerHTML = `
                <strong>Please correct the following:</strong>
                <ul>
                    ${errors
                .map(function (error) {
                    return `<li>${escapeHtml(error)}</li>`;
                })
                .join("")}
                </ul>
            `;

        errorContainer.hidden = false;

        return;
    }

    errorContainer.hidden = true;

    const calculation = calculateReading(
        values,
        previous
    );

    const reading = {
        id:
            "reading-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8),

        readingDate: values.readingDate,

        gridImport: Number(values.gridImport),

        gridExport: Number(values.gridExport),

        solarInverter: Number(values.solarInverter),

        isMonthEnd: Boolean(values.isMonthEnd),

        calculation: {
            solarGeneration:
                calculation.solarGenerationUnits,

            gridImportUnits:
                calculation.gridImportUnits,

            gridExportUnits:
                calculation.gridExportUnits,

            homeConsumption:
                calculation.homeConsumption
        },

        createdAt:
            new Date().toISOString()
    };

    const readings = getReadings();

    readings.push(reading);

    if (!saveReadings(readings)) {
        errorContainer.innerHTML = `
                <strong>Unable to save reading.</strong>
                <p>
                    Your browser storage may be unavailable.
                </p>
            `;

        errorContainer.hidden = false;

        return;
    }

    /*
     * Notify the rest of the application that a new
     * reading has been saved.
     */
    window.dispatchEvent(
        new CustomEvent("solar:reading-saved", {
            detail: reading
        })
    );

    showSuccess(reading);

    form.reset();

    const dateInput =
        document.getElementById("reading-date");

    if (dateInput) {
        dateInput.value = getToday();
    }

    updatePreview();
}

/* ------------------------------------------------------------
   Success message
   ------------------------------------------------------------ */

function showSuccess(reading) {
    const appContent =
        document.getElementById("app-content");

    if (!appContent) {
        return;
    }

    const message = document.createElement("div");

    message.className = "toast toast-success";

    message.innerHTML = `
            <strong>Reading saved successfully.</strong>
            <span>
                ${escapeHtml(formatDate(reading.readingDate))}
                has been added to your readings.
            </span>
        `;

    document.body.appendChild(message);

    window.setTimeout(function () {
        message.classList.add("is-visible");
    }, 10);

    window.setTimeout(function () {
        message.classList.remove("is-visible");

        window.setTimeout(function () {
            message.remove();
        }, 300);
    }, 3500);
}

function updatePreviousReading() {
    const dateInput =
        document.getElementById("reading-date");

    if (!dateInput) {
        return;
    }

    const previous =
        getPreviousReading(dateInput.value);

    const previousDate =
        document.querySelector(
            ".previous-reading-header p"
        );

    const previousValues =
        document.querySelectorAll(
            ".previous-reading-grid strong"
        );

    if (previousDate) {
        previousDate.textContent = previous
            ? formatDate(previous.readingDate)
            : "No previous reading";
    }

    if (previousValues.length >= 3) {
        previousValues[0].textContent =
            `${previous ? formatNumber(previous.gridImport, 2) : "—"} kWh`;

        previousValues[1].textContent =
            `${previous ? formatNumber(previous.gridExport, 2) : "—"} kWh`;

        previousValues[2].textContent =
            `${previous ? formatNumber(previous.solarInverter, 2) : "—"} kWh`;
    }
}

/* ------------------------------------------------------------
   Event binding
   ------------------------------------------------------------ */

function bindEvents() {
    const form =
        document.getElementById("reading-form");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        handleSubmit
    );

    const dateInput =
        document.getElementById("reading-date");

    // if (dateInput) {
    //     dateInput.addEventListener(
    //         "change",
    //         function () {
    //             updatePreviousReading();
    //             updatePreview();
    //         }
    //     );
    // }
    if (dateInput) {
        dateInput.addEventListener("input", function () {
            updatePreviousReading();
            updatePreview();
        });

        dateInput.addEventListener("change", function () {
            updatePreviousReading();
            updatePreview();
        });
    }

    [
        "grid-import",
        "grid-export",
        "solar-inverter"
    ].forEach(function (id) {
        const input = document.getElementById(id);

        if (input) {
            input.addEventListener(
                "input",
                updatePreview
            );
        }
    });

    const cancelButton =
        document.getElementById("reading-cancel");

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            function () {
                form.reset();

                const dateInput =
                    document.getElementById("reading-date");

                if (dateInput) {
                    dateInput.value = getToday();
                }

                updatePreview();
            }
        );
    }
}

/* ------------------------------------------------------------
   Public render function
   ------------------------------------------------------------ */

function render() {
    return renderForm();
}

/* ------------------------------------------------------------
   Public API
   ------------------------------------------------------------ */

window.SolarReading = {
    render: render,
    getReadings: getReadings,
    getLatestReading: getLatestReading,
    getPreviousReading: getPreviousReading,
    calculateReading: calculateReading
};

/*
 * app.js should call:
 *
 * appContent.innerHTML = SolarReading.render();
 * SolarReading.init();
 *
 * Keep init separate so the router can render the HTML
 * first and then attach events.
 */

function init() {

    bindEvents();
    updatePreview();
};


export {
    calculateReading, getLatestReading, getReadings, init, render
};

