/*
 * Solar Energy Dashboard
 * APSPDCL tariff and settlement engine
 * Commit 9 - Versioned tariff configuration
 */

import { CONFIG } from "./config.js";

var STORAGE_KEY = "solarEnergyDashboard.tariffConfig";
var VERSIONS_STORAGE_KEY = "solarEnergyDashboard.tariffConfigs";

var BASE_SLABS = [
    { from: 0, to: 30, rate: 1.90 },
    { from: 31, to: 75, rate: 3.00 },
    { from: 76, to: 125, rate: 4.50 },
    { from: 126, to: 225, rate: 6.00 },
    { from: 226, to: 400, rate: 8.75 },
    { from: 401, to: null, rate: 9.75 }
];

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function deriveDates(tariffYear) {
    var match = String(tariffYear || "").match(/^(\d{4})-(\d{2})$/);
    var startYear;

    if (!match) {
        return {
            effectiveFrom: "",
            effectiveTo: ""
        };
    }

    startYear = Number(match[1]);

    return {
        effectiveFrom: String(startYear) + "-04-01",
        effectiveTo: String(startYear + 1) + "-03-31"
    };
}

var DEFAULT_2026 = {
    tariffYear: "2026-27",
    effectiveFrom: "2026-04-01",
    effectiveTo: "2027-03-31",
    consumerCategory: "LT-I Domestic",
    supplyPhase: "Single Phase",
    recordedMdKw: 4,
    fixedChargePerKw: 10,
    customerCharge: 30,
    exportSettlementRate: Number(CONFIG.ENERGY.EXPORT_RATE) || 2.09,
    includeFppca: false,
    slabs: clone(BASE_SLABS)
};

var DEFAULT_2025 = clone(DEFAULT_2026);
DEFAULT_2025.tariffYear = "2025-26";
DEFAULT_2025.effectiveFrom = "2025-04-01";
DEFAULT_2025.effectiveTo = "2026-03-31";

function normalizeNumber(value, fallback, minimum) {
    var number = Number(value);

    if (!isFinite(number) || number < minimum) {
        return fallback;
    }

    return number;
}

function normalizeSlabs(value) {
    var source = Array.isArray(value) && value.length
        ? value
        : BASE_SLABS;

    return source.map(function (slab) {
        return {
            from: normalizeNumber(slab.from, 0, 0),
            to: slab.to === null || slab.to === ""
                ? null
                : normalizeNumber(slab.to, null, 0),
            rate: normalizeNumber(slab.rate, 0, 0)
        };
    });
}

function normalizeConfig(value, fallback) {
    var source = value && typeof value === "object"
        ? value
        : {};
    var base = fallback || DEFAULT_2026;
    var config = clone(base);
    var dates;

    config.tariffYear = String(
        source.tariffYear || config.tariffYear
    );

    dates = deriveDates(config.tariffYear);

    config.effectiveFrom = String(
        source.effectiveFrom || config.effectiveFrom || dates.effectiveFrom
    );
    config.effectiveTo = String(
        source.effectiveTo || config.effectiveTo || dates.effectiveTo
    );
    config.consumerCategory = String(
        source.consumerCategory || config.consumerCategory
    );
    config.supplyPhase = String(
        source.supplyPhase || config.supplyPhase
    );
    config.recordedMdKw = normalizeNumber(
        source.recordedMdKw,
        config.recordedMdKw,
        0
    );
    config.fixedChargePerKw = normalizeNumber(
        source.fixedChargePerKw,
        config.fixedChargePerKw,
        0
    );
    config.customerCharge = normalizeNumber(
        source.customerCharge,
        config.customerCharge,
        0
    );
    config.exportSettlementRate = normalizeNumber(
        source.exportSettlementRate,
        config.exportSettlementRate,
        0
    );
    config.includeFppca = false;
    config.slabs = normalizeSlabs(source.slabs || config.slabs);

    return config;
}

function sortConfigs(configs) {
    return configs.slice().sort(function (a, b) {
        return String(a.effectiveFrom || "").localeCompare(
            String(b.effectiveFrom || "")
        );
    });
}

function readStoredVersions() {
    var stored = null;
    var legacy = null;
    var versions = [];

    try {
        stored = JSON.parse(
            localStorage.getItem(VERSIONS_STORAGE_KEY) || "null"
        );
    } catch (error) {
        stored = null;
    }

    if (Array.isArray(stored)) {
        versions = stored.map(function (item) {
            return normalizeConfig(item);
        });
    }

    if (!versions.length) {
        try {
            legacy = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "null"
            );
        } catch (legacyError) {
            legacy = null;
        }

        if (!legacy) {
            try {
                var legacyRaw = localStorage.getItem(
                    "solarEnergyDashboard.analytics.exportRate"
                );
                var legacyRate;

                if (legacyRaw !== null && legacyRaw !== "") {
                    legacyRate = Number(legacyRaw);

                    if (isFinite(legacyRate) && legacyRate >= 0) {
                        legacy = {
                            exportSettlementRate: legacyRate
                        };
                    }
                }
            } catch (rateError) {}
        }

        if (legacy) {
            var migrated = normalizeConfig(legacy, DEFAULT_2026);
            var migrated2025 = clone(migrated);

            migrated.tariffYear = "2026-27";
            migrated.effectiveFrom = "2026-04-01";
            migrated.effectiveTo = "2027-03-31";

            migrated2025.tariffYear = "2025-26";
            migrated2025.effectiveFrom = "2025-04-01";
            migrated2025.effectiveTo = "2026-03-31";

            versions = [migrated2025, migrated];
        }
    }

    if (!versions.length) {
        versions = [clone(DEFAULT_2025), clone(DEFAULT_2026)];
    }

    if (!versions.some(function (item) {
        return item.tariffYear === "2025-26";
    })) {
        versions.push(clone(DEFAULT_2025));
    }

    if (!versions.some(function (item) {
        return item.tariffYear === "2026-27";
    })) {
        versions.push(clone(DEFAULT_2026));
    }

    return sortConfigs(versions);
}

function writeVersions(versions) {
    try {
        localStorage.setItem(
            VERSIONS_STORAGE_KEY,
            JSON.stringify(sortConfigs(versions))
        );

        return true;
    } catch (error) {
        console.error("Unable to save tariff configurations:", error);
        return false;
    }
}

function todayIso() {
    var date = new Date();
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());

    if (month.length < 2) {
        month = "0" + month;
    }

    if (day.length < 2) {
        day = "0" + day;
    }

    return String(date.getFullYear()) + "-" + month + "-" + day;
}

function toPeriodDate(value) {
    var text = String(value || "");

    if (/^\d{4}-\d{2}$/.test(text)) {
        var parts = text.split("-");
        var year = Number(parts[0]);
        var month = Number(parts[1]);
        var lastDay = new Date(year, month, 0).getDate();

        return text + "-" + (lastDay < 10 ? "0" : "") + lastDay;
    }

    return text.substring(0, 10);
}

export function getTariffConfigs() {
    return readStoredVersions().map(function (config) {
        return clone(config);
    });
}

export function getDefaultTariffConfig() {
    return clone(DEFAULT_2026);
}

export function getTariffConfigForDate(value) {
    var date = String(value || todayIso()).substring(0, 10);
    var versions = readStoredVersions();
    var matched = null;
    var earlier = null;

    versions.forEach(function (config) {
        if (
            config.effectiveFrom &&
            config.effectiveTo &&
            date >= config.effectiveFrom &&
            date <= config.effectiveTo
        ) {
            matched = config;
        }

        if (
            config.effectiveFrom &&
            config.effectiveFrom <= date
        ) {
            if (!earlier || config.effectiveFrom > earlier.effectiveFrom) {
                earlier = config;
            }
        }
    });

    return clone(matched || earlier || versions[0] || DEFAULT_2026);
}

export function getTariffConfigForPeriod(period) {
    return getTariffConfigForDate(toPeriodDate(period));
}

export function getTariffConfig() {
    return getTariffConfigForDate(todayIso());
}

export function saveTariffConfig(value) {
    var config = normalizeConfig(value);
    var versions = readStoredVersions();
    var replaced = false;

    versions = versions.map(function (item) {
        if (item.tariffYear === config.tariffYear) {
            replaced = true;
            return config;
        }

        return item;
    });

    if (!replaced) {
        versions.push(config);
    }

    if (!writeVersions(versions)) {
        return false;
    }

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(config)
        );
    } catch (error) {}

    return true;
}

export function calculateDomesticTelescopicBill(usage, configValue) {
    var config = normalizeConfig(configValue || getTariffConfig());
    var remaining = Math.max(0, Number(usage) || 0);
    var energyCharge = 0;
    var breakdown = [];
    var index;
    var slab;
    var units;
    var slabWidth;

    for (index = 0; index < config.slabs.length; index += 1) {
        slab = config.slabs[index];

        if (remaining <= 0) {
            break;
        }

        slabWidth = slab.to === null
            ? remaining
            : (slab.from === 0
                ? slab.to
                : Math.max(0, slab.to - slab.from + 1));

        units = Math.min(remaining, slabWidth);

        if (units > 0) {
            energyCharge += units * Number(slab.rate);
            breakdown.push({
                label: slab.to === null
                    ? slab.from + "+"
                    : slab.from + "-" + slab.to,
                units: units,
                rate: Number(slab.rate),
                charge: units * Number(slab.rate)
            });
            remaining -= units;
        }
    }

    var fixedCharge =
        config.recordedMdKw * config.fixedChargePerKw;
    var customerCharge = config.customerCharge;
    var total = energyCharge + fixedCharge + customerCharge;

    return {
        units: Math.max(0, Number(usage) || 0),
        energyCharge: energyCharge,
        fixedCharge: fixedCharge,
        customerCharge: customerCharge,
        total: total,
        breakdown: breakdown,
        fppca: 0,
        fppcaIncluded: false,
        tariffYear: config.tariffYear,
        effectiveFrom: config.effectiveFrom,
        effectiveTo: config.effectiveTo
    };
}

export function roundTariffUnits(value) {
    var units = Math.max(0, Number(value) || 0);

    return Math.floor(units + 0.5);
}

export function calculateNetSettlement(gridExport, gridImport, configValue) {
    var config = normalizeConfig(configValue || getTariffConfig());
    var exp = Math.max(0, Number(gridExport) || 0);
    var imp = Math.max(0, Number(gridImport) || 0);
    var net = exp - imp;
    var tariffUnits;

    if (net > 0) {
        tariffUnits = roundTariffUnits(net);

        return {
            type: "export",
            net: net,
            calculationUnits: tariffUnits,
            settlementRate: config.exportSettlementRate,
            settlementValue: tariffUnits * config.exportSettlementRate,
            tariffYear: config.tariffYear,
            effectiveFrom: config.effectiveFrom,
            effectiveTo: config.effectiveTo
        };
    }

    if (net < 0) {
        tariffUnits = roundTariffUnits(Math.abs(net));

        var bill = calculateDomesticTelescopicBill(
            tariffUnits,
            config
        );

        bill.rawUnits = Math.abs(net);
        bill.tariffUnits = tariffUnits;

        return {
            type: "import",
            net: net,
            calculationUnits: tariffUnits,
            bill: bill,
            tariffYear: config.tariffYear,
            effectiveFrom: config.effectiveFrom,
            effectiveTo: config.effectiveTo
        };
    }

    return {
        type: "balanced",
        net: 0,
        calculationUnits: 0,
        tariffYear: config.tariffYear,
        effectiveFrom: config.effectiveFrom,
        effectiveTo: config.effectiveTo
    };
}
