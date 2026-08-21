import { getReadings, getPreviousReading, calculateReading } from "../reading/reading.js";
import { getTariffConfig, getTariffConfigForPeriod, calculateNetSettlement } from "../../js/tariff-engine.js";

var RANGE_KEY = "solarEnergyDashboard.analytics.range";
var range = "6";
var bound = false;

function esc(v) {
    return String(v === null || v === undefined ? "" : v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function num(v, d) {
    var n = Number(v);

    if (isNaN(n) || !isFinite(n)) {
        n = 0;
    }

    return n.toLocaleString("en-IN", {
        minimumFractionDigits: d,
        maximumFractionDigits: d
    });
}

function money(v) {
    var n = Number(v);

    if (isNaN(n) || !isFinite(n)) {
        n = 0;
    }

    return n.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function key(d) {
    return d && String(d).length >= 7
        ? String(d).substring(0, 7)
        : "";
}

function label(k, long) {
    if (!k) {
        return "";
    }

    var p = k.split("-");
    var d = new Date(
        Number(p[0]),
        Number(p[1]) - 1,
        1
    );

    return d.toLocaleDateString("en-IN", {
        month: long ? "long" : "short",
        year: "numeric"
    });
}

function readings() {
    return getReadings()
        .filter(function (r) {
            return r && r.readingDate;
        })
        .slice()
        .sort(function (a, b) {
            return a.readingDate === b.readingDate
                ? String(b.createdAt || "").localeCompare(
                    String(a.createdAt || "")
                )
                : b.readingDate.localeCompare(a.readingDate);
        });
}

function calc(r) {
    if (!r) {
        return null;
    }

    if (r.calculation) {
        return {
            solar: Number(r.calculation.solarGeneration) || 0,
            imp: Number(r.calculation.gridImportUnits) || 0,
            exp: Number(r.calculation.gridExportUnits) || 0,
            home: Number(r.calculation.homeConsumption) || 0
        };
    }

    var c = calculateReading(
        r,
        getPreviousReading(r.readingDate, r.id)
    );

    return {
        solar: c.solarGenerationUnits,
        imp: c.gridImportUnits,
        exp: c.gridExportUnits,
        home: c.homeConsumption
    };
}

function rows() {
    var rs = readings();
    var seen = {};

    rs.forEach(function (r) {
        var k = key(r.readingDate);

        if (k && !seen[k]) {
            seen[k] = r;
        }
    });

    return Object.keys(seen)
        .sort(function (a, b) {
            return b.localeCompare(a);
        })
        .map(function (k) {
            var c = calc(seen[k]);

            return {
                period: k,
                solar: c.solar,
                imp: c.imp,
                exp: c.exp,
                home: c.home
            };
        });
}

function limited(rs) {
    if (range === "all") {
        return rs;
    }

    return rs.slice(0, Number(range));
}

function load() {
    try {
        var r = localStorage.getItem(RANGE_KEY);

        if (r === "6" || r === "12" || r === "all") {
            range = r;
        }

    } catch (e) { }
}

function save() {
    try {
        localStorage.setItem(RANGE_KEY, range);
    } catch (e) { }
}

function settlement(r) {
    return calculateNetSettlement(
        r.exp,
        r.imp,
        getTariffConfigForPeriod(r.period)
    );
}

function metric(title, value, note, cls) {
    return '<article class="card analytics-metric ' + cls + '">' +
        '<span>' + esc(title) + '</span>' +
        '<strong>' + esc(value) + '</strong>' +
        '<small>' + esc(note) + '</small>' +
        '</article>';
}

function lineChart(rs) {
    var data = rs.slice().reverse();
    var w = 900;
    var h = 300;
    var l = 48;
    var right = 18;
    var t = 20;
    var b = 42;
    var max = 1;

    data.forEach(function (x) {
        max = Math.max(max, x.solar);
    });

    var pts = data.map(function (x, i) {
        var xx = data.length === 1
            ? w / 2
            : l + i * (w - l - right) / (data.length - 1);
        var yy = t + (h - t - b) * (1 - x.solar / max);

        return xx + "," + yy;
    }).join(" ");

    var labels = data.map(function (x, i) {
        var xx = data.length === 1
            ? w / 2
            : l + i * (w - l - right) / (data.length - 1);

        return '<text x="' + xx + '" y="' + (h - 12) +
            '" text-anchor="middle" class="chart-text">' +
            esc(label(x.period, false)) +
            '</text>';
    }).join("");

    return '<svg viewBox="0 0 ' + w + ' ' + h +
        '" class="analytics-svg" role="img" aria-label="Solar generation trend">' +
        '<line x1="' + l + '" y1="' + (h - b) +
        '" x2="' + (w - right) + '" y2="' + (h - b) +
        '" class="chart-grid"/>' +
        '<polyline points="' + pts + '" class="chart-line"/>' +
        labels +
        '</svg>';
}

function bars(rs) {
    var data = rs.slice().reverse();
    var w = 900;
    var h = 300;
    var l = 48;
    var right = 18;
    var t = 20;
    var b = 42;
    var max = 1;
    var step;
    var out = "";

    data.forEach(function (x) {
        max = Math.max(max, x.imp, x.exp);
    });

    step = (w - l - right) / Math.max(1, data.length);

    data.forEach(function (x, i) {
        var cx = l + (i + 0.5) * step;
        var bw = Math.min(20, step * 0.25);
        var ih = (x.imp / max) * (h - t - b);
        var eh = (x.exp / max) * (h - t - b);

        out += '<rect x="' + (cx - bw - 2) +
            '" y="' + (t + h - t - b - ih) +
            '" width="' + bw + '" height="' + ih +
            '" rx="3" class="bar-import"><title>' +
            esc(label(x.period, false)) +
            ' Import ' + num(x.imp, 2) + ' kWh</title></rect>';

        out += '<rect x="' + (cx + 2) +
            '" y="' + (t + h - t - b - eh) +
            '" width="' + bw + '" height="' + eh +
            '" rx="3" class="bar-export"><title>' +
            esc(label(x.period, false)) +
            ' Export ' + num(x.exp, 2) + ' kWh</title></rect>';

        out += '<text x="' + cx + '" y="' + (h - 12) +
            '" text-anchor="middle" class="chart-text">' +
            esc(label(x.period, false)) +
            '</text>';
    });

    return '<svg viewBox="0 0 ' + w + ' ' + h +
        '" class="analytics-svg" role="img" aria-label="Grid import and export comparison">' +
        '<line x1="' + l + '" y1="' + (h - b) +
        '" x2="' + (w - right) + '" y2="' + (h - b) +
        '" class="chart-grid"/>' +
        out +
        '</svg>';
}

function flow(r) {
    var a = [
        ["Solar", r.solar, "solar"],
        ["Grid Import", r.imp, "imp"],
        ["Grid Export", r.exp, "exp"],
        ["Home Consumption", r.home, "home"]
    ];
    var max = Math.max.apply(
        null,
        a.map(function (x) { return x[1]; }).concat([1])
    );

    return a.map(function (x) {
        return '<div class="flow-row">' +
            '<div><span>' + x[0] + '</span><strong>' +
            num(x[1], 2) + ' kWh</strong></div>' +
            '<i><b class="' + x[2] + '" style="width:' +
            Math.max(4, x[1] / max * 100) + '%"></b></i>' +
            '</div>';
    }).join("");
}

function settlementCard(r) {
    var s = settlement(r);
    var periodContext = label(r.period, true) +
        " · MTD / Latest Reading";

    if (s.type === "export") {
        return '<section class="card settlement export">' +
            '<div class="settlement-top"><div>' +
            '<p class="eyebrow">APSPDCL net energy position · ' +
            esc(periodContext) + '</p>' +
            '<h2>Net Export</h2>' +
            '</div><b>NET EXPORT</b></div>' +
            '<strong class="settlement-number">+' +
            num(s.net, 2) + ' kWh</strong>' +
            '<div class="settlement-math">Grid Export ' +
            num(r.exp, 2) + ' − Grid Import ' +
            num(r.imp, 2) + ' = ' + num(s.net, 2) +
            ' kWh</div>' +
            '<div class="settlement-value"><span>Estimated settlement</span>' +
            '<strong>' + esc(money(s.settlementValue)) + '</strong>' +
            '<small>' + num(s.calculationUnits, 0) + ' tariff units × ₹' + num(s.settlementRate, 2) + ' / kWh · FY ' + esc(s.tariffYear) + '</small></div>' +
            '<p class="disclaimer">Indicative settlement estimate; actual settlement depends on the applicable solar/net-metering agreement.</p>' +
            '</section>';
    }

    if (s.type === "import") {
        return '<section class="card settlement import">' +
            '<div class="settlement-top"><div>' +
            '<p class="eyebrow">APSPDCL net energy position · ' +
            esc(periodContext) + '</p>' +
            '<h2>Net Import</h2>' +
            '</div><b>NET IMPORT</b></div>' +
            '<strong class="settlement-number">' +
            num(s.net, 2) + ' kWh</strong>' +
            '<div class="settlement-math">Grid Export ' +
            num(r.exp, 2) + ' − Grid Import ' +
            num(r.imp, 2) + ' = ' + num(s.net, 2) +
            ' kWh</div>' +
            '<div class="settlement-value"><span>Estimated APSPDCL charge</span>' +
            '<strong>' + esc(money(s.bill.total)) + '</strong>' +
            '<small>' + num(s.calculationUnits, 0) + ' tariff units · LT-I Domestic telescopic estimate · FY ' + esc(s.bill.tariffYear) + '</small></div>' +
            '<div class="tariff-breakdown"><span>Energy charge</span>' +
            '<strong>' + esc(money(s.bill.energyCharge)) + '</strong>' +
            '<span>Fixed charge</span><strong>' +
            esc(money(s.bill.fixedCharge)) + '</strong>' +
            '<span>Customer charge</span><strong>' +
            esc(money(s.bill.customerCharge)) + '</strong></div>' +
            '<p class="disclaimer">Indicative estimate only; excludes consumer-specific adjustments, arrears, subsidies, taxes and other bill charges.</p>' +
            '</section>';
    }

    return '<section class="card settlement balanced">' +
        '<p class="eyebrow">APSPDCL net energy position · ' +
        esc(periodContext) + '</p>' +
        '<h2>Balanced</h2>' +
        '<strong class="settlement-number">0.00 kWh</strong>' +
        '<p class="disclaimer">Grid import and export are equal for this period.</p>' +
        '</section>';
}

function insights(r) {
    var self = Math.max(0, r.solar - r.exp);
    var selfPct = r.solar ? self / r.solar * 100 : 0;
    var solarPct = r.home ? r.solar / r.home * 100 : 0;
    var gridPct = r.home ? r.imp / r.home * 100 : 0;
    var exportPct = r.solar ? r.exp / r.solar * 100 : 0;

    return '<div class="insight-grid">' +
        '<article class="card insight insight-self"><span>Solar self-consumption</span>' +
        '<strong>' + num(selfPct, 2) + '%</strong><small>' +
        num(self, 2) + ' kWh used at home</small></article>' +
        '<article class="card insight insight-coverage"><span>Solar Generation Coverage</span>' +
        '<strong>' + num(solarPct, 2) + '%</strong><small>of home consumption</small></article>' +
        '<article class="card insight insight-dependency"><span>Grid dependency</span>' +
        '<strong>' + num(gridPct, 2) + '%</strong><small>of home consumption</small></article>' +
        '<article class="card insight insight-export"><span>Solar export ratio</span>' +
        '<strong>' + num(exportPct, 2) + '%</strong><small>of solar generation exported</small></article>' +
        '</div>';
}

function netPositionSummary(rs) {
    var positive = 0;
    var negative = 0;
    var positiveTariff = 0;
    var negativeRevenue = 0;

    rs.forEach(function (r) {
        var net = Number(r.exp || 0) - Number(r.imp || 0);
        var s = settlement(r);

        if (net > 0) {
            positive += net;
            positiveTariff += Number(s.settlementValue || 0);
        } else if (net < 0) {
            negative += net;
            negativeRevenue += Number(
                s.bill && s.bill.total
                    ? s.bill.total
                    : 0
            );
        }
    });

    return '<section class="card net-position-summary">' +
        '<div class="section-heading"><div>' +
        '<h2>Net Position Summary</h2>' +
        '<p>Positive and negative monthly net positions are shown separately for the selected range.</p>' +
        '</div></div>' +
        '<div class="net-position-values">' +
        '<div class="net-position-value positive">' +
        '<span>Positive Net</span>' +
        '<strong>+' + num(positive, 2) + ' kWh <em>/ ' + esc(money(positiveTariff)) + '</em></strong>' +
        '<small>Sum of positive monthly net positions · Revenue ' +
        esc(money(positiveTariff)) + '</small>' +
        '</div>' +
        '<div class="net-position-value negative">' +
        '<span>Negative Net</span>' +
        '<strong>' + num(negative, 2) + ' kWh <em>/ ' + esc(money(negativeRevenue)) + '</em></strong>' +
        '<small>Sum of negative monthly net positions · Tariff ' +
        esc(money(negativeRevenue)) + '</small>' +
        '</div>' +
        '</div>' +
        '</section>';
}

function table(rs) {
    return '<section class="card analytics-table-card">' +
        '<div class="section-heading"><div><h2>Monthly summary</h2>' +
        '<p>Uses the established Reading calculations and the tariff effective for each period.</p></div></div>' +
        '<div class="table-scroll"><table class="analytics-table"><thead><tr>' +
        '<th>Period</th><th>Solar</th><th>Import</th><th>Export</th><th>Home</th><th>Net</th><th>Tariff / Revenue</th>' +
        '</tr></thead><tbody>' +
        rs.map(function (r) {
            var n = r.exp - r.imp;
            var s = settlement(r);
            var value;
            var labelText;
            var valueClass;

            if (s.type === "export") {
                value = s.settlementValue;
                labelText = "Revenue";
                valueClass = "positive";
            } else if (s.type === "import") {
                value = s.bill.total;
                labelText = "Tariff";
                valueClass = "negative";
            } else {
                value = 0;
                labelText = "—";
                valueClass = "balanced";
            }

            return '<tr><td><strong>' +
                esc(label(r.period, true)) +
                '</strong></td><td>' + num(r.solar, 2) +
                '</td><td>' + num(r.imp, 2) +
                '</td><td>' + num(r.exp, 2) +
                '</td><td>' + num(r.home, 2) +
                '</td><td class="' + (n >= 0 ? "positive" : "negative") + '">' +
                (n > 0 ? "+" : "") + num(n, 2) +
                '</td><td class="tariff-revenue ' + valueClass + '">' +
                '<strong>' + esc(money(value)) + '</strong><small>' + esc(labelText) + '</small></td></tr>';
        }).join("") +
        '</tbody></table></div></section>';
}

function empty() {
    return '<section class="page analytics-page"><div class="page-header"><div>' +
        '<p class="eyebrow">Energy & settlement analytics</p>' +
        '<h1 class="page-title">Analytics</h1>' +
        '<p class="page-description">Add readings to see trends and settlement estimates.</p>' +
        '</div></div><div class="card analytics-empty"><div>▣</div>' +
        '<h2>No readings yet</h2><p>Add your first reading to unlock analytics.</p>' +
        '<a class="button button-primary" href="#/reading">Add Reading</a></div></section>';
}

function sum(rs, k) {
    return rs.reduce(function (t, r) {
        return t + Number(r[k] || 0);
    }, 0);
}

export function render() {
    load();

    var all = rows();
    var rs = limited(all);

    if (!rs.length) {
        return empty();
    }

    var latest = all[0];
    var s = sum(rs, "solar");
    var i = sum(rs, "imp");
    var e = sum(rs, "exp");
    var h = sum(rs, "home");

    return '<section class="page analytics-page">' +
        '<div class="page-header"><div>' +
        '<p class="eyebrow">Energy & settlement analytics</p>' +
        '<h1 class="page-title">Analytics</h1>' +
        '<p class="page-description">Historical energy performance, solar utilization and APSPDCL settlement estimates.</p>' +
        '</div><div class="analytics-controls">' +
        '<label><span>Period range</span><select id="analytics-range">' +
        '<option value="6" ' + (range === "6" ? "selected" : "") + '>Last 6 months</option>' +
        '<option value="12" ' + (range === "12" ? "selected" : "") + '>Last 12 months</option>' +
        '<option value="all" ' + (range === "all" ? "selected" : "") + '>All periods</option>' +
        '</select></label>' +
        '<label><span>Export settlement rate</span><div class="rate settings-rate">' +
        '<span>₹</span><strong>' + num(getTariffConfig().exportSettlementRate, 2) + '</strong><span>/ kWh</span>' +
        '</div><a class="analytics-settings-link" href="#/settings">Configure</a></label>' +
        '</div></div>' +
        '<p class="period-note">Showing <strong>' +
        rs.length + (rs.length === 1 ? " period" : " periods") +
        '</strong> • Latest <strong>' + esc(label(latest.period, true)) +
        '</strong> <span class="latest-period-badge">MTD / Latest Reading</span></p>' +
        '<div class="metrics">' +
        metric("Solar Generation", num(s, 2) + " kWh", "Selected range", "solar") +
        metric("Grid Import", num(i, 2) + " kWh", "Selected range", "imp") +
        metric("Grid Export", num(e, 2) + " kWh", "Selected range", "exp") +
        metric("Home Consumption", num(h, 2) + " kWh", "Selected range", "home") +
        '</div>' +
        netPositionSummary(rs) +
        settlementCard(latest) +
        '<section class="card chart-card"><div class="section-heading"><div>' +
        '<h2>Solar Generation Trend</h2><p>Monthly solar generation.</p></div><span>kWh</span>' +
        '</div><div class="chart">' + lineChart(rs) + '</div></section>' +
        '<div class="analytics-chart-flow">' +
        '<section class="card chart-card grid-import-export-card"><div class="section-heading"><div>' +
        '<h2>Grid Import vs Export</h2><p>Energy drawn from and sent to the grid.</p></div></div>' +
        '<div class="legend"><span><i class="imp"></i>Import</span><span><i class="exp"></i>Export</span></div>' +
        '<div class="chart">' + bars(rs) + '</div></section>' +
        '<section class="card flow-card latest-energy-flow-card"><div class="section-heading"><div>' +
        '<h2>Latest Energy Flow</h2><p>' + esc(label(latest.period, true)) +
        ' · MTD / Latest Reading</p></div></div><div class="flow">' + flow(latest) +
        '</div></section></div>' +
        '<section class="analytics-insights"><div class="section-heading"><div>' +
        '<h2>Insights</h2><p>Useful ratios for the latest available period · ' +
        esc(label(latest.period, true)) + '.</p></div></div>' + insights(latest) +
        '</section>' +
        table(rs) +
        '<p class="footnote"><strong>Calculation rules:</strong> Grid Import/Export use month-end cumulative baselines; Solar Generation is a direct period value; Home Consumption = Solar Generation + Grid Import − Grid Export.<br>Tariff reference: <a href="https://apspdcl.in/electricity-tariff.php" target="_blank" rel="noopener noreferrer">APSPDCL Electricity Tariff</a>. APSPDCL figures shown here are estimates, not final bills.</p>' +
        '</section>';
}

function bind() {
    if (bound) {
        return;
    }

    var rangeEl = document.getElementById("analytics-range");

    if (!rangeEl) {
        return;
    }

    bound = true;

    function rerender() {
        var el = document.getElementById("app-content");

        if (el) {
            el.innerHTML = render();
            bound = false;
            bind();
        }
    }

    if (rangeEl) {
        rangeEl.addEventListener("change", function () {
            range = rangeEl.value;
            save();
            rerender();
        });
    }

}

export function init() {
    bound = false;
    bind();
}
