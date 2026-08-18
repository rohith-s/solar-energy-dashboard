/**
 * Reading module - Commit 3
 *
 * Handles:
 * - cumulative Grid Import input
 * - cumulative Solar Export input
 * - cumulative Inverter Generation input
 * - month-end flag
 * - live calculation preview
 *
 * Storage is deliberately kept behind a small adapter so Google Sheets
 * can replace the local implementation in a later commit.
 */

(function (global) {
  "use strict";

  const STORAGE_KEY = "solar-energy-dashboard.readings.v1";
  const START_KEY = "solar-energy-dashboard.month-starts.v1";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function formatMonth(monthKey) {
    const [year, month] = monthKey.split("-");
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric"
    }).format(new Date(Number(year), Number(month) - 1, 1));
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getReadings() {
    return readJson(STORAGE_KEY, []);
  }

  function getMonthStarts() {
    return readJson(START_KEY, {});
  }

  function saveReading(record) {
    const readings = getReadings();
    readings.push(record);
    writeJson(STORAGE_KEY, readings);

    if (record.isMonthEnd) {
      const starts = getMonthStarts();
      starts[record.month] = {
        gridImport: record.currentGridImport,
        solarExport: record.currentSolarExport,
        inverterGeneration: record.currentInverterGeneration,
        savedAt: record.savedAt
      };
      writeJson(START_KEY, starts);
    }

    return record;
  }

  function getSuggestedStart(monthKey) {
    const starts = getMonthStarts();
    if (starts[monthKey]) {
      return starts[monthKey];
    }

    // Fallback: most recent month-end before the selected month.
    const candidates = Object.entries(starts)
      .filter(([key]) => key < monthKey)
      .sort(([a], [b]) => b.localeCompare(a));

    return candidates.length ? candidates[0][1] : null;
  }

  function createInput(name, label, value = "", required = true) {
    return `
      <div class="form-field">
        <label for="reading-${name}">${label}</label>
        <input
          id="reading-${name}"
          name="${name}"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          value="${escapeHtml(value)}"
          ${required ? "required" : ""}
          autocomplete="off"
        />
      </div>
    `;
  }

  function renderResults(result, tariff) {
    const directionClass =
      result.gridStatus === "export" ? "is-positive" :
      result.gridStatus === "import" ? "is-negative" : "is-neutral";

    return `
      <div class="reading-results">
        <div class="result-card">
          <span>Grid Import</span>
          <strong>${result.gridImport.toFixed(2)} kWh</strong>
        </div>
        <div class="result-card">
          <span>Solar Export</span>
          <strong>${result.solarExport.toFixed(2)} kWh</strong>
        </div>
        <div class="result-card ${directionClass}">
          <span>Net Grid Position</span>
          <strong>${result.netExport.toFixed(2)} kWh</strong>
          <small>${escapeHtml(SolarCalculations.formatStatus(result.netExport))}</small>
        </div>
        <div class="result-card">
          <span>Solar Used at Home</span>
          <strong>${result.solarUsedAtHome.toFixed(2)} kWh</strong>
        </div>
        <div class="result-card">
          <span>Total Home Consumption</span>
          <strong>${result.homeConsumption.toFixed(2)} kWh</strong>
        </div>
        <div class="result-card">
          <span>Estimated Grid Energy Bill</span>
          <strong>₹${tariff.totalBill.toFixed(2)}</strong>
          <small>Energy ₹${tariff.energyCharge.toFixed(2)} + customer charge ₹${tariff.customerCharge.toFixed(2)}</small>
        </div>
      </div>
    `;
  }

  function render(container) {
    const monthKey = getCurrentMonthKey();
    const suggested = getSuggestedStart(monthKey);

    container.innerHTML = `
      <section class="page-header">
        <div>
          <p class="eyebrow">Reading entry</p>
          <h1>Add energy reading</h1>
          <p>Enter the cumulative meter values exactly as displayed on your meters.</p>
        </div>
      </section>

      <section class="card reading-card">
        <form id="reading-form" novalidate>
          <div class="form-section">
            <div class="section-heading">
              <h2>Month & starting readings</h2>
              <span class="badge">Current month: ${escapeHtml(formatMonth(monthKey))}</span>
            </div>

            <div class="form-grid form-grid-2">
              ${createInput("startGridImport", "Starting Grid Import (kWh)", suggested?.gridImport ?? "")}
              ${createInput("startSolarExport", "Starting Solar Export (kWh)", suggested?.solarExport ?? "")}
            </div>

            <p class="form-help">
              These are cumulative net-meter readings at the beginning of the period.
              The app will calculate usage from the difference.
            </p>
          </div>

          <div class="form-section">
            <div class="section-heading">
              <h2>Current meter readings</h2>
              <span class="badge badge-muted">Cumulative values</span>
            </div>

            <div class="form-grid form-grid-3">
              ${createInput("currentGridImport", "Current Grid Import (kWh)")}
              ${createInput("currentSolarExport", "Current Solar Export (kWh)")}
              ${createInput("currentInverterGeneration", "Inverter Generation (kWh)")}
            </div>

            <p class="form-help">
              The inverter value represents total solar generation for the selected period
              as reported by the inverter, not a daily X/Y data series.
            </p>
          </div>

          <div class="form-section">
            <label class="checkbox-row">
              <input id="reading-month-end" name="isMonthEnd" type="checkbox">
              <span>
                <strong>Save as month-end reading</strong>
                <small>Keep these cumulative values available as the next calculation's reference.</small>
              </span>
            </label>
          </div>

          <div id="reading-error" class="alert alert-error hidden" role="alert"></div>
          <div id="reading-preview"></div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="calculate-reading">Calculate</button>
            <button type="submit" class="btn btn-primary">Save Reading</button>
          </div>
        </form>
      </section>
    `;

    const form = container.querySelector("#reading-form");
    const preview = container.querySelector("#reading-preview");
    const errorBox = container.querySelector("#reading-error");

    function collectInput() {
      const data = new FormData(form);
      return {
        startGridImport: data.get("startGridImport"),
        startSolarExport: data.get("startSolarExport"),
        currentGridImport: data.get("currentGridImport"),
        currentSolarExport: data.get("currentSolarExport"),
        currentInverterGeneration: data.get("currentInverterGeneration")
      };
    }

    function calculateAndShow() {
      errorBox.classList.add("hidden");
      errorBox.textContent = "";

      try {
        const result = SolarCalculations.calculateReading(collectInput());
        const tariff = SolarCalculations.calculateProgressiveBill(result.gridImport);
        preview.innerHTML = renderResults(result, tariff);
        return { result, tariff };
      } catch (error) {
        preview.innerHTML = "";
        errorBox.textContent = error.message;
        errorBox.classList.remove("hidden");
        return null;
      }
    }

    container.querySelector("#calculate-reading")
      .addEventListener("click", calculateAndShow);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const calculated = calculateAndShow();
      if (!calculated) return;

      const record = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        month: monthKey,
        readingDate: new Date().toISOString(),
        savedAt: new Date().toISOString(),
        startGridImport: Number(form.elements.startGridImport.value),
        startSolarExport: Number(form.elements.startSolarExport.value),
        currentGridImport: Number(form.elements.currentGridImport.value),
        currentSolarExport: Number(form.elements.currentSolarExport.value),
        currentInverterGeneration: Number(form.elements.currentInverterGeneration.value),
        isMonthEnd: Boolean(form.elements.isMonthEnd.checked),
        ...calculated.result,
        estimatedBill: calculated.tariff
      };

      saveReading(record);

      errorBox.classList.add("hidden");
      preview.insertAdjacentHTML(
        "afterbegin",
        `<div class="alert alert-success" role="status">
          Reading saved successfully for ${escapeHtml(formatMonth(monthKey))}.
        </div>`
      );

      form.reset();
      if (suggested) {
        form.elements.startGridImport.value = suggested.gridImport;
        form.elements.startSolarExport.value = suggested.solarExport;
      }
    });
  }

  global.ReadingModule = Object.freeze({
    render,
    getReadings,
    getMonthStarts,
    getSuggestedStart,
    saveReading
  });
})(window);
