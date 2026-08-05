"use strict";

import { CONFIG } from "./config.js";

/**
 * Main Application
 */

class SolarEnergyDashboard {

    constructor() {

        this.initialize();

    }

    initialize() {

        console.log(
            `${CONFIG.APP.NAME} v${CONFIG.APP.VERSION}`
        );

        this.initializeTheme();

        console.log("Application Initialized.");

    }

    initializeTheme() {

        const savedTheme =
            localStorage.getItem("SED_THEME");

        if (savedTheme) {

            document.documentElement.setAttribute(
                "data-theme",
                savedTheme
            );

            return;

        }

        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {

            document.documentElement.setAttribute(
                "data-theme",
                "dark"
            );

        }

    }

}

document.addEventListener(

    "DOMContentLoaded",

    () => {

        new SolarEnergyDashboard();

    }

);