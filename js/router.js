/*
 * Solar Energy Dashboard
 * Lightweight hash router
 * Version 0.1.0
 */

const routes = new Map();

let outlet = null;
let currentRoute = null;

function normalizeRoute(hash) {
    const value = (hash || "#/dashboard").replace(/^#\/?/, "");
    return value.split("?")[0].replace(/\/+$/, "") || "dashboard";
}

export function registerRoute(path, render, options = {}) {
    routes.set(path.replace(/^\/+|\/+$/g, ""), {
        render,
        title: options.title || "Solar Energy Dashboard"
    });
}

export function navigate(path) {
    const normalized = path.replace(/^#\/?/, "");
    window.location.hash = `#/${normalized}`;
}

export function getCurrentRoute() {
    return currentRoute;
}

async function renderRoute() {
    const routeName = normalizeRoute(window.location.hash);
    const route = routes.get(routeName) || routes.get("dashboard");

    if (!route || !outlet) {
        return;
    }

    currentRoute = routeName;

    document.title = route.title;

    try {
        const result = await route.render();

        outlet.innerHTML =
            typeof result === "string"
                ? result
                : String(result ?? "");

        document.dispatchEvent(
            new CustomEvent("route-rendered", {
                detail: { route: routeName }
            })
        );
    } catch (error) {
        console.error("Route rendering failed:", error);

        outlet.innerHTML = `
            <div class="page-container">
                <section class="card">
                    <div class="empty-state">
                        <div>
                            <span class="material-symbols-outlined">error</span>
                            <h3>Unable to load this page</h3>
                            <p>Please try again. If the problem continues, check the browser console.</p>
                        </div>
                    </div>
                </section>
            </div>
        `;
    }
}

export function initRouter(target) {
    outlet = target;

    window.addEventListener("hashchange", renderRoute);

    if (!window.location.hash) {
        window.location.hash = "#/dashboard";
        return;
    }

    renderRoute();
}
