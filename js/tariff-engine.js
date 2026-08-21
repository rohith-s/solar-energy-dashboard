export function calculateBill(usage, rate) { return usage * rate; }

export function calculateDomesticTelescopicBill(usage) {
    var remaining = Math.max(0, Number(usage) || 0);
    var charge = 0;
    var units;
    units = Math.min(remaining, 30); charge += units * 1.90; remaining -= units;
    if (remaining > 0) { units = Math.min(remaining, 45); charge += units * 3.00; remaining -= units; }
    if (remaining > 0) { units = Math.min(remaining, 50); charge += units * 4.50; remaining -= units; }
    if (remaining > 0) { units = Math.min(remaining, 100); charge += units * 6.00; remaining -= units; }
    if (remaining > 0) { units = Math.min(remaining, 175); charge += units * 8.75; remaining -= units; }
    if (remaining > 0) { charge += remaining * 9.75; }
    return { energyCharge: charge, fixedCharge: 10, estimatedCharge: charge + 10 };
}
