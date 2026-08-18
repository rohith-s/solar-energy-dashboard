/**
 * Solar Energy Dashboard
 * Commit 3 - Reading calculation engine
 *
 * Pure calculation functions. No DOM, storage, or network dependencies.
 */

(function (global) {
  "use strict";

  const DEFAULT_TARIFF_SLABS = [
    { upTo: 30, rate: 1.90, customerCharge: 25 },
    { upTo: 75, rate: 3.00, customerCharge: 30 },
    { upTo: 125, rate: 4.50, customerCharge: 45 },
    { upTo: 225, rate: 6.00, customerCharge: 50 },
    { upTo: 400, rate: 8.75, customerCharge: 55 },
    { upTo: Infinity, rate: 9.75, customerCharge: 55 }
  ];

  function round2(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function number(value, fieldName) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${fieldName} must be a valid number.`);
    }
    return parsed;
  }

  /**
   * Calculate usage from cumulative meter readings.
   *
   * Grid import = current import - starting import
   * Solar export = current export - starting export
   * Net export = solar export - grid import
   *
   * Positive net export = supplied to grid.
   * Negative net export = additional energy taken from grid.
   *
   * Solar inverter generation is the total solar energy produced.
   * Estimated home consumption = solar generation + grid import - solar export.
   */
  function calculateReading(input) {
    const startGrid = number(input.startGridImport, "Starting grid import");
    const currentGrid = number(input.currentGridImport, "Current grid import");
    const startExport = number(input.startSolarExport, "Starting solar export");
    const currentExport = number(input.currentSolarExport, "Current solar export");
    const inverterGeneration = number(
      input.currentInverterGeneration,
      "Current inverter generation"
    );

    if (startGrid < 0 || startExport < 0 || inverterGeneration < 0) {
      throw new Error("Meter readings cannot be negative.");
    }

    if (currentGrid < startGrid) {
      throw new Error("Current grid import cannot be lower than the starting reading.");
    }

    if (currentExport < startExport) {
      throw new Error("Current solar export cannot be lower than the starting reading.");
    }

    const gridImport = round2(currentGrid - startGrid);
    const solarExport = round2(currentExport - startExport);
    const netExport = round2(solarExport - gridImport);
    const solarUsedAtHome = round2(inverterGeneration - solarExport);
    const homeConsumption = round2(inverterGeneration + gridImport - solarExport);

    if (solarUsedAtHome < -0.01) {
      throw new Error(
        "Inverter generation cannot be lower than the solar export for this period."
      );
    }

    return {
      gridImport,
      solarExport,
      netExport,
      solarUsedAtHome: Math.max(0, solarUsedAtHome),
      homeConsumption: Math.max(0, homeConsumption),
      gridStatus: netExport > 0
        ? "export"
        : netExport < 0
          ? "import"
          : "balanced"
    };
  }

  /**
   * Progressive LT-1 tariff calculation.
   *
   * Example:
   * 100 units = 30×1.90 + 45×3.00 + 25×4.50
   *             + customer charge for the 76-125 slab.
   */
  function calculateProgressiveBill(units, slabs = DEFAULT_TARIFF_SLABS) {
    const totalUnits = Math.max(0, round2(number(units, "Grid import units")));

    if (!Array.isArray(slabs) || slabs.length === 0) {
      throw new Error("At least one tariff slab is required.");
    }

    let previousLimit = 0;
    let energyCharge = 0;
    let applicableCustomerCharge = 0;
    let remaining = totalUnits;
    const breakdown = [];

    for (const slab of slabs) {
      const upper = slab.upTo === Infinity ? Infinity : number(slab.upTo, "Slab limit");
      const rate = number(slab.rate, "Slab rate");
      const customerCharge = number(slab.customerCharge ?? 0, "Customer charge");

      if (upper <= previousLimit && upper !== Infinity) {
        throw new Error("Tariff slab limits must be increasing.");
      }

      const slabUnits = upper === Infinity
        ? remaining
        : Math.min(remaining, Math.max(0, upper - previousLimit));

      if (slabUnits > 0) {
        const charge = round2(slabUnits * rate);
        energyCharge = round2(energyCharge + charge);
        breakdown.push({
          from: previousLimit + 1,
          to: upper === Infinity ? null : upper,
          units: round2(slabUnits),
          rate,
          charge
        });
      }

      if (remaining <= slabUnits) {
        applicableCustomerCharge = customerCharge;
        remaining = 0;
        break;
      }

      remaining = round2(remaining - slabUnits);
      previousLimit = upper;
      applicableCustomerCharge = customerCharge;
    }

    const totalBill = round2(energyCharge + applicableCustomerCharge);

    return {
      units: totalUnits,
      energyCharge,
      customerCharge: applicableCustomerCharge,
      totalBill,
      breakdown
    };
  }

  function formatStatus(netExport) {
    if (netExport > 0) {
      return `You supplied ${netExport.toFixed(2)} kWh to the grid.`;
    }
    if (netExport < 0) {
      return `You consumed ${Math.abs(netExport).toFixed(2)} kWh more from the grid.`;
    }
    return "Solar export and grid import are balanced.";
  }

  global.SolarCalculations = Object.freeze({
    DEFAULT_TARIFF_SLABS,
    calculateReading,
    calculateProgressiveBill,
    formatStatus,
    round2
  });
})(window);
