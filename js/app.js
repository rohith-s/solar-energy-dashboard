import { render as renderDashboard } from "../modules/dashboard/dashboard.js";

const ROUTES = {
  dashboard: renderDashboard,
  reading: () => renderPlaceholder("Reading", "⊕", "The reading entry form is the next implementation step."),
  history: () => renderPlaceholder("History", "◷", "Reading history will be implemented after the data model is finalized."),
  analytics: () => renderPlaceholder("Analytics", "▣", "Charts and monthly analytics will be implemented after readings are available."),
  settings: () => renderPlaceholder("Settings", "⚙", "Application and tariff configuration will be implemented in the Settings module.")
};

const appContent = document.getElementById("app-content");
const sidebar = document.getElementById("app-sidebar");
const menuToggle = document.getElementById("mobile-menu-toggle");
const menuClose = document.getElementById("mobile-menu-close");
const menuBackdrop = document.getElementById("mobile-menu-backdrop");
const toastRegion = document.getElementById("toast-region");
const headerMonth = document.getElementById("header-month");

function currentRoute() {
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0];
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
    </section>`;
}

function updateActiveNavigation(route) {
  document.querySelectorAll(".nav-item").forEach(item => {
    const active = item.dataset.route === route;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

function updateHeaderMonth() {
  const now = new Date();
  headerMonth.textContent = new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric"
  }).format(now);
}

function closeMobileMenu() {
  sidebar.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  menuBackdrop.hidden = true;
  document.body.classList.remove("menu-open");
}

function openMobileMenu() {
  sidebar.classList.add("is-open");
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close navigation");
  menuBackdrop.hidden = false;
  document.body.classList.add("menu-open");
}

function render() {
  const route = currentRoute();
  const renderer = ROUTES[route];

  try {
    const html = renderer();
    appContent.innerHTML = html;
    updateActiveNavigation(route);
    updateHeaderMonth();
    appContent.focus({ preventScroll: true });
  } catch (error) {
    console.error("Failed to render route:", error);
    appContent.innerHTML = renderPlaceholder("Application error", "⚠", "Unable to load this screen. Check the browser console for details.");
    showToast("Unable to load the requested screen.");
  }

  closeMobileMenu();
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3000);
}

menuToggle?.addEventListener("click", () => {
  sidebar.classList.contains("is-open") ? closeMobileMenu() : openMobileMenu();
});
menuClose?.addEventListener("click", closeMobileMenu);
menuBackdrop?.addEventListener("click", closeMobileMenu);

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", closeMobileMenu);
});

window.addEventListener("hashchange", render);
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) closeMobileMenu();
});

if (!window.location.hash) {
  window.location.hash = "#/dashboard";
} else {
  render();
}

console.info("Solar Energy Dashboard v0.1.0 — Commit 2A");
