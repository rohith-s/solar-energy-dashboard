import {
  init as initDashboard,
  render as renderDashboard
} from "../modules/dashboard/dashboard.js";

import {
  init as initReading,
  render as renderReading
} from "../modules/reading/reading.js";

import {
  bindEvents as bindHistoryEvents,
  render as renderHistory
} from "../modules/history/history.js";

import { init as initAnalytics, render as renderAnalytics } from "../modules/analytics/analytics.js";
import { init as initSettings, render as renderSettings } from "../modules/settings/settings.js";

const ROUTES = {
  dashboard: renderDashboard,

  reading: renderReading,

  history: renderHistory,

  analytics: renderAnalytics,

  settings: renderSettings
};


const appContent = document.getElementById("app-content");
const sidebar = document.getElementById("app-sidebar");
const menuToggle = document.getElementById("mobile-menu-toggle");
const menuClose = document.getElementById("mobile-menu-close");
const menuBackdrop = document.getElementById("mobile-menu-backdrop");
const toastRegion = document.getElementById("toast-region");
const headerMonth = document.getElementById("header-month");


function currentRoute() {
  const hash = window.location.hash
    .replace(/^#\/?/, "")
    .split("?")[0];

  return ROUTES[hash] ? hash : "dashboard";
}


function renderPlaceholder(title, icon, description) {
  return `
    <section class="page" aria-labelledby="page-title">
      <div class="card placeholder-card">
        <div>
          <div class="placeholder-icon" aria-hidden="true">${icon}</div>
          <h2 id="page-title">${title} module</h2>
          <p>${description}</p>
        </div>
      </div>
    </section>
  `;
}


function updateActiveNavigation(route) {
  document.querySelectorAll(".nav-item").forEach(item => {
    const active = item.dataset.route === route;

    item.classList.toggle("active", active);

    if (active) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}


function updateHeaderMonth() {
  const now = new Date();

  headerMonth.textContent = new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric"
  }).format(now);
}


function updateSyncStatus(status, message) {
  const indicator = document.querySelector(".status-indicator");
  const dot = document.querySelector(".status-dot");

  if (!indicator || !dot) {
    return;
  }

  indicator.classList.remove("status-local", "status-syncing", "status-synced", "status-error");
  dot.classList.remove("status-local", "status-syncing", "status-synced", "status-error");

  indicator.classList.add("status-" + status);
  dot.classList.add("status-" + status);
  indicator.lastChild.textContent = " " + (message || "Local");
}


function closeMobileMenu() {
  if (!sidebar || !menuToggle || !menuBackdrop) {
    return;
  }

  sidebar.classList.remove("is-open");

  menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Open navigation"
  );

  menuBackdrop.hidden = true;

  document.body.classList.remove("menu-open");
}


function openMobileMenu() {
  if (!sidebar || !menuToggle || !menuBackdrop) {
    return;
  }

  sidebar.classList.add("is-open");

  menuToggle.setAttribute(
    "aria-expanded",
    "true"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Close navigation"
  );

  menuBackdrop.hidden = false;

  document.body.classList.add("menu-open");
}


function render() {
  const route = currentRoute();

  try {
    const renderer =
      ROUTES[route] || ROUTES.dashboard;

    appContent.innerHTML = renderer();

    if (route === "dashboard") {
      initDashboard();
    }
    if (route === "reading") {
      initReading();
    }
    if (route === "history") {
      bindHistoryEvents(function () {
        window.location.hash = "#/reading";
      });
    }
    if (route === "analytics") { initAnalytics(); }
    if (route === "settings") { initSettings(); }

    updateActiveNavigation(route);
    updateHeaderMonth();

    appContent.focus({
      preventScroll: true
    });

  } catch (error) {
    console.error(
      "Failed to render route:",
      error
    );

    appContent.innerHTML = renderPlaceholder(
      "Application error",
      "⚠",
      "Unable to load this screen. Check the browser console for details."
    );

    showToast(
      "Unable to load the requested screen."
    );
  }

  closeMobileMenu();
}


function showToast(message) {
  if (!toastRegion) {
    return;
  }

  const toast = document.createElement("div");

  toast.className = "toast";
  toast.textContent = message;

  toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}


menuToggle?.addEventListener(
  "click",
  () => {
    sidebar.classList.contains("is-open")
      ? closeMobileMenu()
      : openMobileMenu();
  }
);


menuClose?.addEventListener(
  "click",
  closeMobileMenu
);


menuBackdrop?.addEventListener(
  "click",
  closeMobileMenu
);


document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener(
    "click",
    closeMobileMenu
  );
});


window.addEventListener(
  "solar:sync-status",
  function (event) {
    var detail = event.detail || {};

    updateSyncStatus(
      detail.ok ? "synced" : "error",
      detail.ok ? "Synced" : "Sync failed"
    );

    if (detail.ok) {
      showToast(
        (detail.message || "Google Sheets sync completed.") +
        " Dashboard refreshed."
      );
    }
  }
);

window.addEventListener(
  "solar:sync-start",
  () => updateSyncStatus("syncing", "Syncing…")
);

window.addEventListener(
  "solar:tariff-settings-changed",
  () => {
    if (
      currentRoute() === "analytics" ||
      currentRoute() === "settings"
    ) {
      render();
    }
  }
);

window.addEventListener(
  "hashchange",
  render
);


window.addEventListener(
  "resize",
  () => {
    if (window.innerWidth >= 768) {
      closeMobileMenu();
    }
  }
);


updateSyncStatus("local", "Local");

if (!window.location.hash) {
  window.location.hash = "#/dashboard";
} else {
  render();
}


console.info(
  "Solar Energy Dashboard v0.1.0 — Commit 3"
);