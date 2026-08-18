/*
 * Solar Energy Dashboard
 * Local storage abstraction
 * Version 0.1.0
 *
 * Google Sheets will become the shared source of truth later.
 * Local storage is currently used for preferences and local cache only.
 */

import { CONFIG } from "./config.js";

const prefix = CONFIG.STORAGE.PREFIX;

function makeKey(key) {
    return `${prefix}:${key}`;
}

export function setItem(key, value) {
    try {
        localStorage.setItem(makeKey(key), JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Storage write failed:", error);
        return false;
    }
}

export function getItem(key, defaultValue = null) {
    try {
        const raw = localStorage.getItem(makeKey(key));

        if (raw === null) {
            return defaultValue;
        }

        return JSON.parse(raw);
    } catch (error) {
        console.error("Storage read failed:", error);
        return defaultValue;
    }
}

export function removeItem(key) {
    try {
        localStorage.removeItem(makeKey(key));
        return true;
    } catch (error) {
        console.error("Storage remove failed:", error);
        return false;
    }
}

export function clearAppStorage() {
    const keysToRemove = [];

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);

        if (key && key.startsWith(`${prefix}:`)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
}
