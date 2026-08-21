import {
    getTariffConfig,
    getTariffConfigs,
    saveTariffConfig,
    getDefaultTariffConfig
} from "../../js/tariff-engine.js";

var bound = false;
var selectedTariffYear = "";

function esc(value) {
    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function money(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getSelectedConfig() {
    var configs = getTariffConfigs();
    var current = getTariffConfig();
    var selected = configs.filter(function (config) {
        return config.tariffYear === selectedTariffYear;
    })[0];

    return selected || current || getDefaultTariffConfig();
}

function renderVersionOptions(configs, selected) {
    return configs.map(function (config) {
        return '<option value="' + esc(config.tariffYear) + '" ' +
            (config.tariffYear === selected.tariffYear ? "selected" : "") + '>' +
            esc(config.tariffYear) + ' (' +
            esc(config.effectiveFrom) + ' → ' +
            esc(config.effectiveTo) + ')' +
            '</option>';
    }).join("");
}

function renderSlabs(config) {
    return config.slabs.map(function (slab) {
        return '<tr><td>' + esc(
            slab.to === null ? slab.from + "+" : slab.from + "–" + slab.to
        ) + '</td><td>₹' + Number(slab.rate).toFixed(2) + '</td><td>/ kWh</td></tr>';
    }).join("");
}

export function render() {
    var configs = getTariffConfigs();
    var config = getSelectedConfig();
    var fixed = config.recordedMdKw * config.fixedChargePerKw;
    var todayConfig = getTariffConfig();

    selectedTariffYear = config.tariffYear;

    return '<section class="page settings-page">' +
        '<div class="page-header"><div>' +
        '<p class="eyebrow">Application configuration</p>' +
        '<h1 class="page-title">Settings</h1>' +
        '<p class="page-description">Configure versioned APSPDCL tariffs and solar settlement values. Historical periods keep the tariff applicable to their effective dates.</p>' +
        '</div></div>' +
        '<form id="tariff-settings-form" class="settings-grid">' +
        '<section class="card settings-card settings-main-card">' +
        '<div class="section-heading"><div><h2>Connection & tariff</h2><p>Tariff versions are selected by effective period; saved meter readings are not changed.</p></div></div>' +
        '<div class="settings-form-grid">' +
        '<label><span>Tariff version</span><select name="selectedTariffYear" id="settings-tariff-version">' +
        renderVersionOptions(configs, config) +
        '</select></label>' +
        '<label><span>Tariff year</span><input name="tariffYear" value="' + esc(config.tariffYear) + '"></label>' +
        '<label><span>Effective from</span><input name="effectiveFrom" type="date" value="' + esc(config.effectiveFrom) + '"></label>' +
        '<label><span>Effective to</span><input name="effectiveTo" type="date" value="' + esc(config.effectiveTo) + '"></label>' +
        '<label><span>Consumer category</span><input name="consumerCategory" value="' + esc(config.consumerCategory) + '" readonly></label>' +
        '<label><span>Supply</span><input name="supplyPhase" value="' + esc(config.supplyPhase) + '" readonly></label>' +
        '<label><span>Recorded MD / load (kW)</span><input name="recordedMdKw" type="number" min="0" step="0.01" value="' + esc(config.recordedMdKw) + '"></label>' +
        '<label><span>Fixed charge (₹ / kW)</span><input name="fixedChargePerKw" type="number" min="0" step="0.01" value="' + esc(config.fixedChargePerKw) + '"></label>' +
        '<label><span>Customer charge (₹ / month)</span><input name="customerCharge" type="number" min="0" step="0.01" value="' + esc(config.customerCharge) + '"></label>' +
        '<label><span>Export settlement rate (₹ / kWh)</span><input name="exportSettlementRate" type="number" min="0" step="0.01" value="' + esc(config.exportSettlementRate) + '"></label>' +
        '<label><span>FPPCA</span><input value="Excluded" readonly></label>' +
        '</div>' +
        '<div class="settings-actions"><button class="button" type="submit">Save tariff settings</button><button class="button button-secondary" id="tariff-reset" type="button">Reset 2026-27 defaults</button><span id="settings-message" role="status"></span></div>' +
        '</section>' +
        '<aside class="card settings-card settings-summary">' +
        '<div class="section-heading"><div><h2>Current configuration</h2><p>Tariff currently applicable today.</p></div></div>' +
        '<div class="settings-summary-value"><span>Active tariff</span><strong>' + esc(todayConfig.tariffYear) + '</strong></div>' +
        '<div class="settings-summary-value"><span>Effective period</span><strong>' + esc(todayConfig.effectiveFrom) + ' → ' + esc(todayConfig.effectiveTo) + '</strong></div>' +
        '<div class="settings-summary-value"><span>Recorded MD</span><strong>' + esc(Number(todayConfig.recordedMdKw).toFixed(2)) + ' kW</strong></div>' +
        '<div class="settings-summary-value"><span>Fixed charge</span><strong>' + money(todayConfig.recordedMdKw * todayConfig.fixedChargePerKw) + ' / month</strong></div>' +
        '<div class="settings-summary-value"><span>Customer charge</span><strong>' + money(todayConfig.customerCharge) + ' / month</strong></div>' +
        '<div class="settings-summary-value"><span>Export settlement</span><strong>' + money(todayConfig.exportSettlementRate) + ' / kWh</strong></div>' +
        '</aside>' +
        '<section class="card settings-card tariff-table-card">' +
        '<div class="section-heading"><div><h2>LT-I Domestic energy tariff · FY ' + esc(config.tariffYear) + '</h2><p>Telescopic energy charges used when Net Energy Position is negative for this tariff period.</p></div></div>' +
        '<div class="table-scroll"><table class="settings-table"><thead><tr><th>Units</th><th>Rate</th><th>Unit</th></tr></thead><tbody>' + renderSlabs(config) + '</tbody></table></div>' +
        '<p class="settings-note">Bill estimate = telescopic energy charge + fixed charge + customer charge. FPPCA is intentionally excluded. Consumer-specific arrears, adjustments, subsidies and other bill-only items are not estimated. To add a future tariff, select any version, change the tariff year/effective dates and save; the existing versions remain preserved.</p>' +
        '</section>' +
        '</form>' +
        '</section>';
}

function rerender() {
    var app = document.getElementById("app-content");

    if (app) {
        app.innerHTML = render();
        bound = false;
        bind();
    }
}

function bind() {
    var form = document.getElementById("tariff-settings-form");
    var reset = document.getElementById("tariff-reset");
    var version = document.getElementById("settings-tariff-version");
    var message = document.getElementById("settings-message");

    if (!form || bound) {
        return;
    }

    bound = true;

    if (version) {
        version.addEventListener("change", function () {
            selectedTariffYear = version.value;
            rerender();
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        var current = getSelectedConfig();
        var data = new FormData(form);
        var tariffYear = String(data.get("tariffYear") || "").trim();
        var effectiveFrom = String(data.get("effectiveFrom") || "").trim();
        var effectiveTo = String(data.get("effectiveTo") || "").trim();
        var recordedMdKw = Number(data.get("recordedMdKw"));
        var fixedChargePerKw = Number(data.get("fixedChargePerKw"));
        var customerCharge = Number(data.get("customerCharge"));
        var exportSettlementRate = Number(data.get("exportSettlementRate"));

        if (!/^\d{4}-\d{2}$/.test(tariffYear) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(effectiveTo) ||
            effectiveFrom > effectiveTo) {
            message.textContent = "Enter a valid tariff year and effective date range.";
            return;
        }

        if (!isFinite(recordedMdKw) || recordedMdKw < 0 ||
            !isFinite(fixedChargePerKw) || fixedChargePerKw < 0 ||
            !isFinite(customerCharge) || customerCharge < 0 ||
            !isFinite(exportSettlementRate) || exportSettlementRate < 0) {
            message.textContent = "Please enter valid non-negative values.";
            return;
        }

        current.tariffYear = tariffYear;
        current.effectiveFrom = effectiveFrom;
        current.effectiveTo = effectiveTo;
        current.recordedMdKw = recordedMdKw;
        current.fixedChargePerKw = fixedChargePerKw;
        current.customerCharge = customerCharge;
        current.exportSettlementRate = exportSettlementRate;

        if (saveTariffConfig(current)) {
            selectedTariffYear = tariffYear;
            window.dispatchEvent(new CustomEvent("solar:tariff-settings-changed"));
            rerender();
        } else {
            message.textContent = "Unable to save settings.";
        }
    });

    if (reset) {
        reset.addEventListener("click", function () {
            var defaults = getDefaultTariffConfig();
            saveTariffConfig(defaults);
            selectedTariffYear = defaults.tariffYear;
            rerender();
        });
    }
}

export function init() {
    bound = false;
    bind();
}
