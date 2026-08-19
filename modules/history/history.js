/* ============================================================
    Solar Energy Dashboard
    History Module
    Commit 5 - Reading History
    ES5 Compatible
    ============================================================ */

var STORAGE_KEY = "solarEnergyDashboard.readings";
var currentPage = 1;
var pageSize = 10;
var monthEndOnly = false;
var fromDate = "";
var toDate = "";

/* ------------------------------------------------------------
    Storage
    ------------------------------------------------------------ */

function getReadings() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        var data = JSON.parse(raw);

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(
            "Unable to read stored readings:",
            error
        );

        return [];
    }
}

/* ------------------------------------------------------------
    Helpers
    ------------------------------------------------------------ */

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

function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ------------------------------------------------------------
    Reading Calculations
    ------------------------------------------------------------ */

/*
    * Previous calculation baseline must be the most recent
    * month-end reading before the current reading.
    */
function getPreviousReading(
    readings,
    currentReading
) {
    return readings
        .filter(function (reading) {
            if (!reading || !reading.readingDate) {
                return false;
            }

            if (!reading.isMonthEnd) {
                return false;
            }

            return (
                reading.readingDate <
                currentReading.readingDate
            );
        })
        .sort(function (a, b) {
            return b.readingDate.localeCompare(
                a.readingDate
            );
        })[0] || null;
}

/*
    * Calculate period units.
    *
    * Grid Import:
    *   Current cumulative reading - previous month-end reading
    *
    * Grid Export:
    *   Current cumulative reading - previous month-end reading
    *
    * Solar Generation:
    *   Current-period value directly.
    *   DO NOT subtract previous solar generation.
    */
function calculateUnits(
    reading,
    previous
) {
    var currentGridImport =
        Number(reading.gridImport) || 0;

    var currentGridExport =
        Number(reading.gridExport) || 0;

    var previousGridImport = previous
        ? Number(previous.gridImport) || 0
        : 0;

    var previousGridExport = previous
        ? Number(previous.gridExport) || 0
        : 0;

    var gridImportUnits = previous
        ? Math.max(
            0,
            currentGridImport -
            previousGridImport
        )
        : 0;

    var gridExportUnits = previous
        ? Math.max(
            0,
            currentGridExport -
            previousGridExport
        )
        : 0;

    /*
        * Solar Generation Current Month is already
        * the period value.
        */
    var solarGenerationUnits =
        Number(reading.solarInverter) || 0;

    /*
        * Home Consumption =
        * Solar Generation
        * + Grid Import
        * - Grid Export
        */
    var homeConsumption = Math.max(
        0,
        solarGenerationUnits +
        gridImportUnits -
        gridExportUnits
    );

    return {
        gridImportUnits: gridImportUnits,
        gridExportUnits: gridExportUnits,
        solarGenerationUnits: solarGenerationUnits,
        homeConsumption: homeConsumption
    };
}

/* ------------------------------------------------------------
    Render
    ------------------------------------------------------------ */

function getFilteredReadings(readings) {
    return readings.filter(function (reading) {
        if (
            monthEndOnly &&
            !reading.isMonthEnd
        ) {
            return false;
        }

        if (
            fromDate &&
            reading.readingDate < fromDate
        ) {
            return false;
        }

        if (
            toDate &&
            reading.readingDate > toDate
        ) {
            return false;
        }

        return true;
    });
}

function getTotalPages(totalRecords) {
    if (!totalRecords) {
        return 1;
    }

    return Math.ceil(
        totalRecords / pageSize
    );
}


function getPageReadings(readings) {
    var startIndex =
        (currentPage - 1) * pageSize;

    var endIndex =
        startIndex + pageSize;

    return readings.slice(
        startIndex,
        endIndex
    );
}

export function render() {
    var allReadings = getReadings()
        .slice()
        .sort(function (a, b) {
            return b.readingDate.localeCompare(
                a.readingDate
            );
        });

    var filteredReadings =
        getFilteredReadings(
            allReadings
        );

    var totalPages =
        getTotalPages(
            filteredReadings.length
        );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    var readings =
        getPageReadings(
            filteredReadings
        );

    if (!allReadings.length) {
    return '' +
        '<section class="history-page">' +

            '<div class="page-header">' +

                '<div>' +
                    '<div class="eyebrow">' +
                        'Energy tracking' +
                    '</div>' +

                    '<h1>History</h1>' +

                    '<p>' +
                        'View your previous electricity ' +
                        'and solar readings.' +
                    '</p>' +

                '</div>' +

            '</div>' +

            '<div class="card history-empty">' +

                '<h2>No readings yet</h2>' +

                '<p>' +
                    'Add your first reading to see ' +
                    'your energy history here.' +
                '</p>' +

                '<button ' +
                    'type="button" ' +
                    'class="button button-primary" ' +
                    'id="history-add-reading">' +
                    'Add Reading' +
                '</button>' +

            '</div>' +

        '</section>';
}
    var noFilteredResults =
        filteredReadings.length === 0;
    var rows = noFilteredResults
    ? (
        '<tr>' +
            '<td ' +
                'colspan="9" ' +
                'class="history-no-results">' +
                'No readings match the selected filters.' +
            '</td>' +
        '</tr>'
      )
    : readings.map(
        function (reading) {
            var previous =
                getPreviousReading(
                    filteredReadings,
                    reading
                );

            var calculation =
                calculateUnits(
                    reading,
                    previous
                );

            var statusHtml =
                '<label class="month-end-status">' +
                    '<input ' +
                        'type="checkbox" ' +
                        'disabled ' +
                        (
                            reading.isMonthEnd
                                ? 'checked '
                                : ''
                        ) +
                        'aria-label="' +
                        (
                            reading.isMonthEnd
                                ? 'Month End reading'
                                : 'Not a Month End reading'
                        ) +
                    '">' +
                '</label>';

            return '' +
                '<tr>' +

                    '<td>' +
                        escapeHtml(
                            formatDate(
                                reading.readingDate
                            )
                        ) +
                    '</td>' +

                    '<td class="number-cell">' +
                        formatNumber(
                            reading.gridImport,
                            2
                        ) +
                    '</td>' +

                    '<td class="number-cell">' +
                        formatNumber(
                            reading.gridExport,
                            2
                        ) +
                    '</td>' +

                    '<td class="number-cell">' +
                        formatNumber(
                            reading.solarInverter,
                            2
                        ) +
                    '</td>' +

                    '<td class="number-cell">' +
                        formatNumber(
                            calculation.gridImportUnits,
                            2
                        ) +
                    '</td>' +

                    '<td class="number-cell">' +
                        formatNumber(
                            calculation.gridExportUnits,
                            2
                        ) +
                    '</td>' +

                    '<td class="number-cell">' +
                        formatNumber(
                            calculation.solarGenerationUnits,
                            2
                        ) +
                    '</td>' +

                    '<td class="number-cell">' +
                        formatNumber(
                            calculation.homeConsumption,
                            2
                        ) +
                    '</td>' +

                    '<td class="month-end-column">' +
                        statusHtml +
                    '</td>' +

                '</tr>';
        }
    ).join("");

    return '' +
        '<section class="history-page">' +

            '<div class="page-header">' +

                '<div>' +

                    '<div class="eyebrow">' +
                        'Energy tracking' +
                    '</div>' +

                    '<h1>History</h1>' +

                    '<p>' +
                        'View your previous electricity ' +
                        'and solar readings.' +
                    '</p>' +

                '</div>' +

                '<div>' +

                    '<button ' +
                        'type="button" ' +
                        'class="button button-primary" ' +
                        'id="history-add-reading">' +
                        'Add Reading' +
                    '</button>' +

                '</div>' +

            '</div>' +

            '<div class="card history-card">' +

                '<div class="card-header">' +

                    '<div>' +

                        '<h2>Reading History</h2>' +

                        '<p>' +
                            'Readings are shown from newest ' +
                            'to oldest.' +
                        '</p>' +

                    '</div>' +

                    '<div class="history-count">' +
                        filteredReadings.length +
                        ' reading' +
                        (
                            filteredReadings.length === 1
                                ? ''
                                : 's'
                        ) +
                    '</div>' +

                '</div>' +

                '<div class="history-table-wrapper">' +
                    '<div class="history-filters">' +

                        '<div class="history-filter-group">' +

                            '<label class="history-filter-checkbox">' +

                                '<input ' +
                                    'type="checkbox" ' +
                                    'id="history-month-end-only"' +
                                    (
                                        monthEndOnly
                                            ? ' checked'
                                            : ''
                                    ) +
                                '>' +

                                '<span>Month End Only</span>' +

                            '</label>' +

                        '</div>' +

                        '<div class="history-filter-group">' +

                            '<label for="history-from-date">' +
                                'From' +
                            '</label>' +

                            '<input ' +
                                'type="date" ' +
                                'id="history-from-date" ' +
                                'value="' +
                                    escapeHtml(fromDate) +
                                '"' +
                            '>' +

                        '</div>' +

                        '<div class="history-filter-group">' +

                            '<label for="history-to-date">' +
                                'To' +
                            '</label>' +

                            '<input ' +
                                'type="date" ' +
                                'id="history-to-date" ' +
                                'value="' +
                                    escapeHtml(toDate) +
                                '"' +
                            '>' +

                        '</div>' +

                        '<button ' +
                            'type="button" ' +
                            'class="button button-secondary" ' +
                            'id="history-clear-filters">' +
                            'Clear Filters' +
                        '</button>' +

                    '</div>' +
                    '<table class="history-table">' +

                        '<thead>' +

                            '<tr>' +

                                '<th>' +
                                    'Reading Date' +
                                '</th>' +

                                '<th>' +
                                    'Grid Import' +
                                '</th>' +

                                '<th>' +
                                    'Grid Export' +
                                '</th>' +

                                '<th>' +
                                    'Solar Generation' +
                                '</th>' +

                                '<th>' +
                                    'Grid Import Units' +
                                '</th>' +

                                '<th>' +
                                    'Grid Export Units' +
                                '</th>' +

                                '<th>' +
                                    'Solar Generation Units' +
                                '</th>' +

                                '<th>' +
                                    'Home Consumption' +
                                '</th>' +

                                '<th class="month-end-column">' +
                                    'Month End' +
                                '</th>' +

                            '</tr>' +

                        '</thead>' +

                        '<tbody>' +
                            rows +
                        '</tbody>' +

                    '</table>' +

                '</div>' +
                '<div class="history-pagination">' +
                    '<div class="history-pagination-info">' +
                        (
                            filteredReadings.length
                            ? (
                                'Showing ' +
                                (((currentPage - 1) * pageSize) + 1) +
                                '–' +
                                Math.min(
                                    currentPage * pageSize,
                                    filteredReadings.length
                                ) +
                                ' of ' +
                                filteredReadings.length
                            )
                            : 'No matching readings'
                        ) +
                    '</div>' +

                    '<div class="history-pagination-controls">' +

                        '<label for="history-page-size">' +
                            'Rows' +
                        '</label>' +

                        '<select id="history-page-size">' +

                            '<option value="10"' +
                                (
                                    pageSize === 10
                                        ? ' selected'
                                        : ''
                                ) +
                            '>10</option>' +

                            '<option value="25"' +
                                (
                                    pageSize === 25
                                        ? ' selected'
                                        : ''
                                ) +
                            '>25</option>' +

                            '<option value="50"' +
                                (
                                    pageSize === 50
                                        ? ' selected'
                                        : ''
                                ) +
                            '>50</option>' +

                        '</select>' +

                        '<button ' +
                            'type="button" ' +
                            'class="button button-secondary" ' +
                            'id="history-first-page"' +
                            (
                                currentPage === 1
                                    ? ' disabled'
                                    : ''
                            ) +
                        '>' +
                            'First' +
                        '</button>' +

                        '<button ' +
                            'type="button" ' +
                            'class="button button-secondary" ' +
                            'id="history-previous-page"' +
                            (
                                currentPage === 1
                                    ? ' disabled'
                                    : ''
                            ) +
                        '>' +
                            'Previous' +
                        '</button>' +

                        '<span class="history-page-number">' +
                            'Page ' +
                            currentPage +
                            ' of ' +
                            totalPages +
                        '</span>' +

                        '<button ' +
                            'type="button" ' +
                            'class="button button-secondary" ' +
                            'id="history-next-page"' +
                            (
                                currentPage >= totalPages
                                    ? ' disabled'
                                    : ''
                            ) +
                        '>' +
                            'Next' +
                        '</button>' +

                        '<button ' +
                            'type="button" ' +
                            'class="button button-secondary" ' +
                            'id="history-last-page"' +
                            (
                                currentPage >= totalPages
                                    ? ' disabled'
                                    : ''
                            ) +
                        '>' +
                            'Last' +
                        '</button>' +

                    '</div>' +

                '</div>'

            '</div>' +

        '</section>';
}

function refreshHistory() {
    var appContent =
        document.getElementById(
            "app-content"
        );

    if (!appContent) {
        return;
    }

    appContent.innerHTML = render();

    bindEvents();
}
function bindPaginationEvents() {
    var firstButton =
        document.getElementById(
            "history-first-page"
        );

    var previousButton =
        document.getElementById(
            "history-previous-page"
        );

    var nextButton =
        document.getElementById(
            "history-next-page"
        );

    var lastButton =
        document.getElementById(
            "history-last-page"
        );

    var pageSizeSelect =
        document.getElementById(
            "history-page-size"
        );

    if (firstButton) {
        firstButton.addEventListener(
            "click",
            function () {
                currentPage = 1;
                refreshHistory();
            }
        );
    }

    if (previousButton) {
        previousButton.addEventListener(
            "click",
            function () {
                if (currentPage > 1) {
                    currentPage--;
                    refreshHistory();
                }
            }
        );
    }

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            function () {
                var totalPages =
                    getTotalPages(
                        getFilteredReadings(
                            getReadings()
                        ).length
                    );

                if (
                    currentPage <
                    totalPages
                ) {
                    currentPage++;
                    refreshHistory();
                }
            }
        );
    }

    if (lastButton) {
        lastButton.addEventListener(
            "click",
            function () {
                var totalPages =
                    getTotalPages(
                        getFilteredReadings(
                            getReadings()
                        ).length
                    );

                currentPage = totalPages;

                refreshHistory();
            }
        );
    }

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener(
            "change",
            function () {
                pageSize =
                    Number(
                        pageSizeSelect.value
                    );

                currentPage = 1;

                refreshHistory();
            }
        );
    }
}
/* ------------------------------------------------------------
    Events
    ------------------------------------------------------------ */
export function bindEvents(
    onAddReading
) {
    var addReadingButton =
        document.getElementById(
            "history-add-reading"
        );

    if (addReadingButton) {
        addReadingButton.addEventListener(
            "click",
            function () {
                if (
                    typeof onAddReading ===
                    "function"
                ) {
                    onAddReading();
                }
            }
        );
    }

    var monthEndFilter =
        document.getElementById(
            "history-month-end-only"
        );

    if (monthEndFilter) {
        monthEndFilter.addEventListener(
            "change",
            function () {
                monthEndOnly =
                    monthEndFilter.checked;

                currentPage = 1;

                refreshHistory();
            }
        );
    }

    var fromDateInput =
        document.getElementById(
            "history-from-date"
        );

    if (fromDateInput) {
        fromDateInput.addEventListener(
            "change",
            function () {
                fromDate =
                    fromDateInput.value;

                currentPage = 1;

                refreshHistory();
            }
        );
    }

    var toDateInput =
        document.getElementById(
            "history-to-date"
        );

    if (toDateInput) {
        toDateInput.addEventListener(
            "change",
            function () {
                toDate =
                    toDateInput.value;

                currentPage = 1;

                refreshHistory();
            }
        );
    }

    var clearFiltersButton =
        document.getElementById(
            "history-clear-filters"
        );

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener(
            "click",
            function () {
                monthEndOnly = false;
                fromDate = "";
                toDate = "";
                currentPage = 1;

                refreshHistory();
            }
        );
    }

    bindPaginationEvents();
}