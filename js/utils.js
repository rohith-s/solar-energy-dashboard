/*
 * Solar Energy Dashboard
 * Shared utility functions
 * Version 0.1.0
 */

export function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function formatNumber(value, decimals = 2) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "0.00";
    }

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

export function formatKwh(value, decimals = 2) {
    return `${formatNumber(value, decimals)} kWh`;
}

export function formatCurrency(value, decimals = 2) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "₹0.00";
    }

    return number.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

export function formatDate(dateValue = new Date()) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

export function formatMonthYear(dateValue = new Date()) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "numeric"
    }).format(date);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function isNonNegativeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0;
}
