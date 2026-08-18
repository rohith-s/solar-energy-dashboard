/**
 * Solar Energy Dashboard
 * Calculation Engine
 *
 * Commit 3
 *
 * APSPDCL LT-1 progressive slab calculation.
 */

const TARIFF_SLABS = Object.freeze([
  {
    minUnits: 1,
    maxUnits: 30,
    rate: 1.90,
    customerCharge: 25
  },
  {
    minUnits: 31,
    maxUnits: 75,
    rate: 3.00,
    customerCharge: 30
  },
  {
    minUnits: 76,
    maxUnits: 125,
    rate: 4.50,
    customerCharge: 45
  },
  {
    minUnits: 126,
    maxUnits: 225,
    rate: 6.00,
    customerCharge: 50
  },
  {
    minUnits: 226,
    maxUnits: 400,
    rate: 8.75,
    customerCharge: 55
  },
  {
    minUnits: 401,
    maxUnits: Infinity,
    rate: 9.75,
    customerCharge: 55
  }
]);

/**
 * Calculate the difference between current and previous meter reading.
 */
export function calculateUnits(currentReading, previousReading = 0) {
  const current = Number(currentReading);
  const previous = Number(previousReading);

  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    throw new Error("Meter readings must be valid numbers.");
  }

  if (current < previous) {
    throw new Error(
      "Current reading cannot be lower than the previous month-end reading."
    );
  }

  return current - previous;
}

/**
 * Calculate progressive APSPDCL LT-1 energy charges.
 *
 * Important:
 * The tariff is progressive.
 *
 * Example:
 * 100 units =
 * 30 × ₹1.90
 * + 45 × ₹3.00
 * + 25 × ₹4.50
 *
 * Customer charge is added only once,
 * using the last applicable slab.
 */
export function calculateGridBill(units) {
  const totalUnits = Number(units);

  if (!Number.isFinite(totalUnits) || totalUnits < 0) {
    throw new Error("Grid units must be a valid non-negative number.");
  }

  if (totalUnits === 0) {
    return {
      units: 0,
      energyCharge: 0,
      customerCharge: 0,
      totalCharge: 0,
      slabBreakdown: []
    };
  }

  let remainingUnits = totalUnits;
  let energyCharge = 0;
  let customerCharge = 0;
  const slabBreakdown = [];

  for (const slab of TARIFF_SLABS) {
    if (remainingUnits <= 0) {
      break;
    }

    const slabCapacity =
      slab.maxUnits === Infinity
        ? Infinity
        : slab.maxUnits - slab.minUnits + 1;

    const slabUnits = Math.min(remainingUnits, slabCapacity);

    if (slabUnits <= 0) {
      continue;
    }

    const charge = slabUnits * slab.rate;

    energyCharge += charge;

    slabBreakdown.push({
      minUnits: slab.minUnits,
      maxUnits: slab.maxUnits,
      units: slabUnits,
      rate: slab.rate,
      charge
    });

    remainingUnits -= slabUnits;

    // Customer charge comes from the final applicable slab.
    customerCharge = slab.customerCharge;
  }

  return {
    units: totalUnits,
    energyCharge: roundCurrency(energyCharge),
    customerCharge: roundCurrency(customerCharge),
    totalCharge: roundCurrency(energyCharge + customerCharge),
    slabBreakdown
  };
}

/**
 * Calculate monthly energy values from meter readings.
 */
export function calculateMonthlyEnergy({
  gridCurrent,
  gridPrevious = 0,
  solarCurrent,
  solarPrevious = 0,
  inverterCurrent,
  inverterPrevious = 0
}) {
  const gridImport = calculateUnits(
    gridCurrent,
    gridPrevious
  );

  const gridExport = calculateUnits(
    solarCurrent,
    solarPrevious
  );

  const solarGeneration = calculateUnits(
    inverterCurrent,
    inverterPrevious
  );

  /*
   * Home consumption:
   *
   * Solar generation
   * + Grid import
   * - Grid export
   *
   * This represents the energy consumed by the home.
   */
  const homeConsumption = Math.max(
    0,
    solarGeneration + gridImport - gridExport
  );

  const gridBill = calculateGridBill(gridImport);

  return {
    gridImport: roundEnergy(gridImport),
    gridExport: roundEnergy(gridExport),
    solarGeneration: roundEnergy(solarGeneration),
    homeConsumption: roundEnergy(homeConsumption),
    gridBill
  };
}

/**
 * Calculate complete reading result.
 */
export function calculateReadingResult(reading, previousReading = {}) {
  const result = calculateMonthlyEnergy({
    gridCurrent: reading.gridImport,
    gridPrevious: previousReading.gridImport ?? 0,

    solarCurrent: reading.gridExport,
    solarPrevious: previousReading.gridExport ?? 0,

    inverterCurrent: reading.solarGeneration,
    inverterPrevious: previousReading.solarGeneration ?? 0
  });

  return {
    ...result,

    readingDate: reading.readingDate,
    isMonthEnd: Boolean(reading.isMonthEnd),

    meterReadings: {
      gridImport: Number(reading.gridImport),
      gridExport: Number(reading.gridExport),
      solarGeneration: Number(reading.solarGeneration)
    }
  };
}

function roundEnergy(value) {
  return Number(Number(value).toFixed(2));
}

function roundCurrency(value) {
  return Number(Number(value).toFixed(2));
}

export function getTariffSlabs() {
  return TARIFF_SLABS.map(slab => ({ ...slab }));
}