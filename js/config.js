"use strict";

/**
 * Solar Energy Dashboard
 * Configuration
 */

export const CONFIG = Object.freeze({

    APP: {

        NAME: "Solar Energy Dashboard",

        VERSION: "0.1.0",

        AUTHOR: "Rohith S"

    },

    API: {

        GOOGLE_SCRIPT_READ_URL: "https://script.google.com/macros/s/AKfycbw9czZazEola8dXP_yl9LpWBpYKQVyMvnMTNaex3zUiQgAf7kRCe-fImLgMMcjaxkMtyg/exec",

        /*
         * Commit 10 - authenticated write endpoint.
         * Set this to the separate Apps Script web-app deployment
         * configured for signed-in/authorized writes.
         */
        GOOGLE_SCRIPT_WRITE_URL: "https://script.google.com/macros/s/AKfycbwusxDemJO_-aP5AsxdvGT5T_ZioUVVKA15ATd0JQMoNTVQcDs6kGkyKRg6GPXKu0laEw/exec",

        REQUEST_TIMEOUT: 30000

    },

    STORAGE: {

        PREFIX: "SED"

    },

    ENERGY: {

        EXPORT_RATE: 2.09,

        DECIMAL_PLACES: 2

    },

    UI: {

        THEME: "system"

    }

});