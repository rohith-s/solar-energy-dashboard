import {
    getTariffConfig,
    getTariffConfigs,
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
        ) + '</td><td>₹' + Number(slab.rate).toFixed(2) +
        '</td><td>₹' + Number(slab.customerCharge || 0).toFixed(2) +
        '</td></tr>';
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
        '<p class="page-description">Tariff versions are loaded from the Google Sheets tariff master. Historical periods keep the tariff applicable to their effective dates.</p>' +
        '</div></div>' +
        '<div class="settings-grid">' +
        '<section class="card settings-card settings-main-card">' +
        '<div class="section-heading"><div><h2>Connection & tariff</h2><p>Tariff master data is managed in Google Sheets. This page is a read-only view; saved meter readings are not changed.</p></div></div>' +
        '<div class="settings-form-grid">' +
        '<label><span>Tariff version</span><select name="selectedTariffYear" id="settings-tariff-version">' +
        renderVersionOptions(configs, config) +
        '</select></label>' +
        '<label><span>Tariff year</span><input name="tariffYear" value="' + esc(config.tariffYear) + '" readonly></label>' +
        '<label><span>Effective from</span><input name="effectiveFrom" type="date" value="' + esc(config.effectiveFrom) + '" readonly></label>' +
        '<label><span>Effective to</span><input name="effectiveTo" type="date" value="' + esc(config.effectiveTo) + '" readonly></label>' +
        '<label><span>Consumer category</span><input name="consumerCategory" value="' + esc(config.consumerCategory) + '" readonly></label>' +
        '<label><span>Supply</span><input name="supplyPhase" value="' + esc(config.supplyPhase) + '" readonly></label>' +
        '<label><span>Recorded MD / load (kW)</span><input name="recordedMdKw" type="number" min="0" step="0.01" value="' + esc(config.recordedMdKw) + '" readonly></label>' +
        '<label><span>Fixed charge (₹ / kW)</span><input name="fixedChargePerKw" type="number" min="0" step="0.01" value="' + esc(config.fixedChargePerKw) + '" readonly></label>' +
        '<label><span>Customer charge</span><input name="customerCharge" value="Slab based" readonly></label>' +
        '<label><span>Export settlement rate (₹ / kWh)</span><input name="exportSettlementRate" type="number" min="0" step="0.01" value="' + esc(config.exportSettlementRate) + '" readonly></label>' +
        '<label><span>Electricity duty (₹ / unit)</span><input name="electricityDutyPerUnit" type="number" min="0" step="0.01" value="' + esc(config.electricityDutyPerUnit) + '" readonly></label>' +
        '<label><span>FPPCA</span><input value="Excluded" readonly></label>' +
        '</div>' +
        '<div class="settings-actions"><span id="settings-message" role="status">Source: Google Sheets · Tariff Master + Tariff Slabs</span></div>' +
        '</section>' +
        '<aside class="card settings-card settings-summary">' +
        '<div class="section-heading"><div><h2>Current configuration</h2><p>Tariff currently applicable today.</p></div></div>' +
        '<div class="settings-summary-value"><span>Active tariff</span><strong>' + esc(todayConfig.tariffYear) + '</strong></div>' +
        '<div class="settings-summary-value"><span>Effective period</span><strong>' + esc(todayConfig.effectiveFrom) + ' → ' + esc(todayConfig.effectiveTo) + '</strong></div>' +
        '<div class="settings-summary-value"><span>Recorded MD</span><strong>' + esc(Number(todayConfig.recordedMdKw).toFixed(2)) + ' kW</strong></div>' +
        '<div class="settings-summary-value"><span>Fixed charge</span><strong>' + money(todayConfig.recordedMdKw * todayConfig.fixedChargePerKw) + ' / month</strong></div>' +
        '<div class="settings-summary-value"><span>Customer charge</span><strong>Slab based</strong></div>' +
        '<div class="settings-summary-value"><span>Electricity duty</span><strong>₹' + Number(todayConfig.electricityDutyPerUnit || 0).toFixed(2) + ' / unit</strong></div>' +
        '<div class="settings-summary-value"><span>Export settlement</span><strong>' + money(todayConfig.exportSettlementRate) + ' / kWh</strong></div>' +
        '</aside>' +
        '<section class="card settings-card tariff-table-card">' +
        '<div class="section-heading"><div><h2>LT-I Domestic energy tariff · FY ' + esc(config.tariffYear) + '</h2><p>Telescopic energy charges used when Net Energy Position is negative for this tariff period.</p></div></div>' +
        '<div class="table-scroll"><table class="settings-table"><thead><tr><th>Units</th><th>Rate</th><th>Customer Charge</th></tr></thead><tbody>' + renderSlabs(config) + '</tbody></table></div>' +
        '<p class="settings-note">Bill estimate = telescopic energy charge + fixed charge + slab-based customer charge + electricity duty. Electricity duty is applied only to positive tariff/billed units; export settlement revenue does not include customer charge, fixed charge or electricity duty. FPPCA is intentionally excluded. Consumer-specific arrears, adjustments, subsidies and other bill-only items are not estimated. To add a future tariff, add a new row to <strong>Tariff Master</strong> and its slab rows to <strong>Tariff Slabs</strong> in Google Sheets, then refresh/sync the application. Existing tariff versions remain preserved.</p>' +
        '</section>' +
        '</div>' +
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
    var version = document.getElementById("settings-tariff-version");

    if (!version || bound) {
        return;
    }

    bound = true;

    version.addEventListener("change", function () {
        selectedTariffYear = version.value;
        rerender();
    });
}

export function init() {
    bound = false;
    bind();
}
