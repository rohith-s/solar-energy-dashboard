/* ============================================================
   Solar Energy Dashboard
   Dashboard Module
   Commit 6 - Real Data
   ES5-compatible module syntax
   ============================================================ */

import {
    getReadings,
    getPreviousReading,
    calculateReading
} from "../reading/reading.js";

var selectedPeriod = "";
var dashboardEventsBound = false;

/* ------------------------------------------------------------
   Helpers
   ------------------------------------------------------------ */

function escapeHtml(value) {
    return String(
        value === null || value === undefined
            ? ""
            : value
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatNumber(value, decimals) {
    var number = Number(value);

    if (isNaN(number) || !isFinite(number)) {
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

    var date = new Date(
        dateString + "T00:00:00"
    );

    if (isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getPeriodKey(dateString) {
    if (!dateString || dateString.length < 7) {
        return "";
    }

    return dateString.substring(0, 7);
}

function getPeriodLabel(periodKey) {
    if (!periodKey) {
        return "";
    }

    var parts = periodKey.split("-");
    var date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        1
    );

    if (isNaN(date.getTime())) {
        return periodKey;
    }

    return date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });
}

function getSortedReadings() {
    return getReadings()
        .filter(function (reading) {
            return reading &&
                reading.readingDate;
        })
        .slice()
        .sort(function (a, b) {
            if (a.readingDate !== b.readingDate) {
                return b.readingDate.localeCompare(
                    a.readingDate
                );
            }

            return String(
                b.createdAt || ""
            ).localeCompare(
                String(a.createdAt || "")
            );
        });
}

function getAvailablePeriods(readings) {
    var seen = {};

    readings.forEach(function (reading) {
        var key = getPeriodKey(
            reading.readingDate
        );

        if (key) {
            seen[key] = true;
        }
    });

    return Object.keys(seen).sort(
        function (a, b) {
            return b.localeCompare(a);
        }
    );
}

function getLatestReadingForPeriod(
    readings,
    periodKey
) {
    return readings
        .filter(function (reading) {
            return getPeriodKey(
                reading.readingDate
            ) === periodKey;
        })
        .sort(function (a, b) {
            if (a.readingDate !== b.readingDate) {
                return b.readingDate.localeCompare(
                    a.readingDate
                );
            }

            return String(
                b.createdAt || ""
            ).localeCompare(
                String(a.createdAt || "")
            );
        })[0] || null;
}

function getCalculation(reading) {
    if (!reading) {
        return null;
    }

    /*
     * Prefer the calculation saved with the reading.
     * This preserves the exact calculation result that
     * was produced when the reading was saved.
     */
    if (
        reading.calculation &&
        typeof reading.calculation === "object"
    ) {
        return {
            solarGenerationUnits:
                Number(
                    reading.calculation.solarGeneration
                ) || 0,

            gridImportUnits:
                Number(
                    reading.calculation.gridImportUnits
                ) || 0,

            gridExportUnits:
                Number(
                    reading.calculation.gridExportUnits
                ) || 0,

            homeConsumption:
                Number(
                    reading.calculation.homeConsumption
                ) || 0
        };
    }

    /*
     * Backward-compatible fallback for readings saved
     * before the calculation object was persisted.
     *
     * Reuse the established Reading module calculation;
     * do not duplicate the formula here.
     */
    var previous =
        getPreviousReading(
            reading.readingDate,
            reading.id
        );

    return calculateReading(
        reading,
        previous
    );
}

function getBaselineForReading(reading) {
    if (!reading) {
        return null;
    }

    return getPreviousReading(
        reading.readingDate,
        reading.id
    );
}

function getPeriodRows(readings) {
    var periods = getAvailablePeriods(
        readings
    );

    return periods.map(
        function (periodKey) {
            var reading =
                getLatestReadingForPeriod(
                    readings,
                    periodKey
                );

            return {
                periodKey: periodKey,
                reading: reading,
                calculation:
                    getCalculation(reading)
            };
        }
    );
}

function getPreviousPeriodRow(
    periodRows,
    selectedPeriodKey
) {
    var index = -1;

    periodRows.some(function (row, rowIndex) {
        if (
            row.periodKey ===
            selectedPeriodKey
        ) {
            index = rowIndex;
            return true;
        }

        return false;
    });

    if (index === -1) {
        return null;
    }

    return periodRows[index + 1] || null;
}

/* ------------------------------------------------------------
   Empty state
   ------------------------------------------------------------ */

function renderEmptyState() {
    return '' +
        '<section class="page dashboard-page" ' +
            'aria-labelledby="dashboard-title">' +

            '<div class="page-header">' +
                '<div>' +
                    '<p class="eyebrow">Energy overview</p>' +
                    '<h1 id="dashboard-title" ' +
                        'class="page-title">' +
                        'Good evening 👋' +
                    '</h1>' +
                    '<p class="page-description">' +
                        'Start tracking your solar generation, ' +
                        'grid import and export.' +
                    '</p>' +
                '</div>' +

                '<a class="button" href="#/reading">' +
                    '＋ Add Reading' +
                '</a>' +
            '</div>' +

            '<div class="card dashboard-empty">' +
                '<div class="dashboard-empty-icon" ' +
                    'aria-hidden="true">☀</div>' +
                '<h2>No readings yet</h2>' +
                '<p>' +
                    'Add your first reading to see your ' +
                    'energy dashboard.' +
                '</p>' +
                '<a class="button button-primary" ' +
                    'href="#/reading">' +
                    'Add Reading' +
                '</a>' +
            '</div>' +

        '</section>';
}

/* ------------------------------------------------------------
   KPI card
   ------------------------------------------------------------ */

function renderMetricCard(
    icon,
    label,
    value,
    note,
    modifier
) {
    var valueHtml =
        value === "—"
            ? '<span class="dashboard-metric-value ' +
                'is-unavailable">—</span>'
            : '<strong class="dashboard-metric-value">' +
                escapeHtml(value) +
                '</strong>';

    return '' +
        '<article class="card dashboard-metric ' +
            escapeHtml(modifier || '') + '">' +

            '<div class="dashboard-metric-top">' +
                '<span class="dashboard-metric-icon" ' +
                    'aria-hidden="true">' +
                    escapeHtml(icon) +
                '</span>' +

                '<span class="dashboard-metric-label">' +
                    escapeHtml(label) +
                '</span>' +
            '</div>' +

            valueHtml +

            '<span class="dashboard-metric-note">' +
                escapeHtml(note) +
            '</span>' +

        '</article>';
}

/* ------------------------------------------------------------
   Main dashboard
   ------------------------------------------------------------ */

export function render() {
    var readings = getSortedReadings();

    if (!readings.length) {
        return renderEmptyState();
    }

    var periods =
        getAvailablePeriods(readings);

    if (
        !selectedPeriod ||
        periods.indexOf(selectedPeriod) === -1
    ) {
        selectedPeriod = periods[0];
    }

    var periodRows =
        getPeriodRows(readings);

    var currentReading =
        getLatestReadingForPeriod(
            readings,
            selectedPeriod
        );

    var currentCalculation =
        getCalculation(currentReading);

    var baseline =
        getBaselineForReading(
            currentReading
        );

    var previousPeriod =
        getPreviousPeriodRow(
            periodRows,
            selectedPeriod
        );

    var baselineDate =
        baseline
            ? formatDate(
                baseline.readingDate
            )
            : "No month-end baseline";

    var gridImportValue =
        baseline
            ? formatNumber(
                currentCalculation.gridImportUnits,
                2
            ) + " kWh"
            : "—";

    var gridExportValue =
        baseline
            ? formatNumber(
                currentCalculation.gridExportUnits,
                2
            ) + " kWh"
            : "—";

    var solarValue =
        formatNumber(
            currentCalculation.solarGenerationUnits,
            2
        ) + " kWh";

    var homeValue =
        formatNumber(
            currentCalculation.homeConsumption,
            2
        ) + " kWh";

    var homeComparisonNote =
        'Solar + Grid Import − Grid Export';

    if (
        previousPeriod &&
        previousPeriod.calculation
    ) {
        var currentHome =
            Number(
                currentCalculation.homeConsumption
            ) || 0;

        var previousHome =
            Number(
                previousPeriod.calculation
                    .homeConsumption
            ) || 0;

        if (previousHome > 0) {
            var difference =
                currentHome -
                previousHome;

            var percentage =
                Math.abs(
                    difference /
                    previousHome *
                    100
                );

            var direction =
                difference > 0
                    ? "↑"
                    : difference < 0
                        ? "↓"
                        : "→";

            homeComparisonNote =
                direction +
                ' ' +
                formatNumber(
                    percentage,
                    1
                ) +
                '% vs ' +
                getPeriodLabel(
                    previousPeriod.periodKey
                );
        }
    }

    var periodOptions =
        periods.map(function (periodKey) {
            return '<option value="' +
                escapeHtml(periodKey) + '"' +
                (
                    periodKey === selectedPeriod
                        ? ' selected'
                        : ''
                ) +
                '>' +
                escapeHtml(
                    getPeriodLabel(periodKey)
                ) +
                '</option>';
        }).join("");

    var recentRows =
        periodRows.slice(0, 6)
            .map(function (row) {
                var calculation =
                    row.calculation || {
                        solarGenerationUnits: 0,
                        gridImportUnits: 0,
                        gridExportUnits: 0,
                        homeConsumption: 0
                    };

                var rowBaseline =
                    getBaselineForReading(
                        row.reading
                    );

                return '' +
                    '<tr class="' +
                        (
                            row.periodKey ===
                            selectedPeriod
                                ? 'is-selected'
                                : ''
                        ) +
                    '">' +

                        '<td>' +
                            '<strong>' +
                                escapeHtml(
                                    getPeriodLabel(
                                        row.periodKey
                                    )
                                ) +
                            '</strong>' +
                            '<small>' +
                                escapeHtml(
                                    formatDate(
                                        row.reading
                                            .readingDate
                                    )
                                ) +
                            '</small>' +
                        '</td>' +

                        '<td class="number-cell">' +
                            formatNumber(
                                calculation
                                    .solarGenerationUnits,
                                2
                            ) +
                        '</td>' +

                        '<td class="number-cell">' +
                            (
                                rowBaseline
                                    ? formatNumber(
                                        calculation
                                            .gridImportUnits,
                                        2
                                    )
                                    : "—"
                            ) +
                        '</td>' +

                        '<td class="number-cell">' +
                            (
                                rowBaseline
                                    ? formatNumber(
                                        calculation
                                            .gridExportUnits,
                                        2
                                    )
                                    : "—"
                            ) +
                        '</td>' +

                        '<td class="number-cell">' +
                            formatNumber(
                                calculation
                                    .homeConsumption,
                                2
                            ) +
                        '</td>' +

                    '</tr>';
            })
            .join("");

    return '' +
        '<section class="page dashboard-page" ' +
            'aria-labelledby="dashboard-title">' +

            '<div class="page-header">' +

                '<div>' +
                    '<p class="eyebrow">Energy overview</p>' +

                    '<h1 id="dashboard-title" ' +
                        'class="page-title">' +
                        'Good evening 👋' +
                    '</h1>' +

                    '<p class="page-description">' +
                        'Track your solar generation, grid import ' +
                        'and export for ' +
                        '<strong>' +
                            escapeHtml(
                                getPeriodLabel(
                                    selectedPeriod
                                )
                            ) +
                        '</strong>.' +
                    '</p>' +
                '</div>' +

                '<div class="dashboard-header-actions">' +

                    '<label class="dashboard-period-filter">' +
                        '<span>Period</span>' +
                        '<select id="dashboard-period">' +
                            periodOptions +
                        '</select>' +
                    '</label>' +

                    '<a class="button" href="#/reading">' +
                        '＋ Add Reading' +
                    '</a>' +

                '</div>' +

            '</div>' +

            '<div class="dashboard-section-heading">' +
                '<h2>Current period</h2>' +
                '<span>' +
                    escapeHtml(
                        formatDate(
                            currentReading.readingDate
                        )
                    ) +
                    ' latest reading' +
                '</span>' +
            '</div>' +

            '<div class="dashboard-metrics">' +

                renderMetricCard(
                    '☀',
                    'Solar Generation',
                    solarValue,
                    'Direct period value',
                    'dashboard-metric-solar'
                ) +

                renderMetricCard(
                    '↓',
                    'Grid Import',
                    gridImportValue,
                    baseline
                        ? 'Since ' + baselineDate
                        : 'Baseline unavailable',
                    'dashboard-metric-import'
                ) +

                renderMetricCard(
                    '↑',
                    'Grid Export',
                    gridExportValue,
                    baseline
                        ? 'Since ' + baselineDate
                        : 'Baseline unavailable',
                    'dashboard-metric-export'
                ) +

                renderMetricCard(
                    '⌂',
                    'Home Consumption',
                    homeValue,
                    homeComparisonNote,
                    'dashboard-metric-home'
                ) +

            '</div>' +

            '<div class="dashboard-secondary-grid">' +

                '<section class="card dashboard-detail-card">' +
                    '<div class="card-header">' +
                        '<div>' +
                            '<h2>Latest reading</h2>' +
                            '<p>' +
                                'Meter values saved on ' +
                                escapeHtml(
                                    formatDate(
                                        currentReading
                                            .readingDate
                                    )
                                ) +
                            '</p>' +
                        '</div>' +
                    '</div>' +

                    '<div class="dashboard-detail-list">' +

                        '<div>' +
                            '<span>Grid Import meter</span>' +
                            '<strong>' +
                                formatNumber(
                                    currentReading
                                        .gridImport,
                                    2
                                ) +
                                ' kWh' +
                            '</strong>' +
                        '</div>' +

                        '<div>' +
                            '<span>Grid Export meter</span>' +
                            '<strong>' +
                                formatNumber(
                                    currentReading
                                        .gridExport,
                                    2
                                ) +
                                ' kWh' +
                            '</strong>' +
                        '</div>' +

                        '<div>' +
                            '<span>Solar Generation</span>' +
                            '<strong>' +
                                formatNumber(
                                    currentReading
                                        .solarInverter,
                                    2
                                ) +
                                ' kWh' +
                            '</strong>' +
                        '</div>' +

                    '</div>' +
                '</section>' +

                '<section class="card dashboard-detail-card">' +
                    '<div class="card-header">' +
                        '<div>' +
                            '<h2>Calculation baseline</h2>' +
                            '<p>' +
                                (
                                    baseline
                                        ? 'Latest month-end baseline used for cumulative grid meters.'
                                        : 'A previous month-end reading is required for grid usage.'
                                ) +
                            '</p>' +
                        '</div>' +
                    '</div>' +

                    '<div class="dashboard-baseline">' +
                        '<span>Baseline date</span>' +
                        '<strong>' +
                            escapeHtml(
                                baselineDate
                            ) +
                        '</strong>' +

                        (
                            baseline
                                ? (
                                    '<div class="dashboard-baseline-values">' +
                                        '<span>Grid Import: ' +
                                            formatNumber(
                                                baseline
                                                    .gridImport,
                                                2
                                            ) +
                                            ' kWh' +
                                        '</span>' +
                                        '<span>Grid Export: ' +
                                            formatNumber(
                                                baseline
                                                    .gridExport,
                                                2
                                            ) +
                                            ' kWh' +
                                        '</span>' +
                                    '</div>'
                                )
                                : ''
                        ) +

                    '</div>' +
                '</section>' +

            '</div>' +

            '<section class="card dashboard-history-card">' +

                '<div class="card-header">' +
                    '<div>' +
                        '<h2>Recent periods</h2>' +
                        '<p>' +
                            'Latest available reading from each period.' +
                        '</p>' +
                    '</div>' +

                    '<a href="#/history" ' +
                        'class="dashboard-history-link">' +
                        'View History →' +
                    '</a>' +
                '</div>' +

                '<div class="dashboard-table-wrapper">' +
                    '<table class="dashboard-table">' +

                        '<thead>' +
                            '<tr>' +
                                '<th>Period</th>' +
                                '<th>Solar</th>' +
                                '<th>Grid Import</th>' +
                                '<th>Grid Export</th>' +
                                '<th>Consumption</th>' +
                            '</tr>' +
                        '</thead>' +

                        '<tbody>' +
                            recentRows +
                        '</tbody>' +

                    '</table>' +
                '</div>' +

            '</section>' +

        '</section>';
}

/* ------------------------------------------------------------
   Events
   ------------------------------------------------------------ */

function bindDashboardEvents() {
    var periodSelect =
        document.getElementById(
            "dashboard-period"
        );

    if (periodSelect) {
        periodSelect.addEventListener(
            "change",
            function () {
                selectedPeriod =
                    periodSelect.value;

                var appContent =
                    document.getElementById(
                        "app-content"
                    );

                if (appContent) {
                    appContent.innerHTML =
                        render();

                    bindDashboardEvents();
                }
            }
        );
    }

    if (!dashboardEventsBound) {
        window.addEventListener(
            "solar:reading-saved",
            function () {
                selectedPeriod = "";

                if (
                    window.location.hash
                        .indexOf("#/dashboard") === 0
                ) {
                    var appContent =
                        document.getElementById(
                            "app-content"
                        );

                    if (appContent) {
                        appContent.innerHTML =
                            render();

                        bindDashboardEvents();
                    }
                }
            }
        );

        dashboardEventsBound = true;
    }
}

export function init() {
    bindDashboardEvents();
}
