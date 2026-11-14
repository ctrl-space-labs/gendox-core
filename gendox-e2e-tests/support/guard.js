const config = require('../tests.config');
const target = require('../config/target');

/**
 * The write guard. A deployed environment holds other people's data, and the suite may
 * change only what it created. Every request that changes something (anything but GET,
 * HEAD and OPTIONS) must name, in its path or query, an organization or project this
 * worker created. Otherwise it is refused before it leaves, and the test fails with the
 * request named.
 *
 * It applies to the `api` request context of support/workspace.js and to the API
 * requests of the browser in tests that use the `page` fixture from there. It is on for
 * dev and prod, and locally with E2E_WRITE_GUARD=1.
 */
const owned = new Set();
const own = (...ids) => ids.filter(Boolean).forEach(id => owned.add(String(id).toLowerCase()));

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const READS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Changes that name no organization or project, and touch only the caller's own data.
const ALLOWED = [
    ['POST', /^\/organizations\/?$/],   // a new organization, owned once created
    ['DELETE', /^\/profile\/caches$/],  // the caller's own cached profile
];
const apiOrigin = new URL(config.use.baseURL).origin;
const contextPath = config.gendox.contextPath;

// Returns why the request is refused, or null.
const refusal = (method, url) => {
    method = method.toUpperCase();
    if (!target.writeGuard || READS.has(method)) return null;
    const parsed = new URL(url, config.use.baseURL);
    if (parsed.origin !== apiOrigin || !parsed.pathname.startsWith(contextPath)) return null;
    const route = parsed.pathname.slice(contextPath.length);
    if (ALLOWED.some(([allowed, pattern]) => allowed === method && pattern.test(route))) return null;
    const ids = `${parsed.pathname}${parsed.search}`.match(UUID) || [];
    if (ids.some(id => owned.has(id.toLowerCase()))) return null;
    return `Write guard: ${method} ${route}${parsed.search} names no organization or project this run created. ` +
        `On ${target.target} the suite changes only what it created (support/guard.js).`;
};

const check = (method, url) => {
    const reason = refusal(method, url);
    if (reason) throw new Error(reason);
};

// An APIRequestContext whose changing requests pass the guard first.
const guardRequests = (api) => {
    if (!target.writeGuard) return api;
    return new Proxy(api, {
        get(context, property) {
            const value = context[property];
            if (['post', 'put', 'patch', 'delete'].includes(property)) {
                return (url, options) => {
                    check(property, url);
                    return value.call(context, url, options);
                };
            }
            if (property === 'fetch') {
                return (request, options = {}) => {
                    const url = typeof request === 'string' ? request : request.url();
                    check(options.method || (typeof request === 'string' ? 'GET' : request.method()), url);
                    return value.call(context, request, options);
                };
            }
            return typeof value === 'function' ? value.bind(context) : value;
        },
    });
};

// Refuses the browser's changing API requests the same way. Returns the refusals, for
// the test to fail with after it ran; the refused request itself fails in the page.
const guardPage = async (page) => {
    const refused = [];
    if (!target.writeGuard) return refused;
    await page.route(url => url.origin === apiOrigin && url.pathname.startsWith(contextPath), async (route) => {
        const reason = refusal(route.request().method(), route.request().url());
        if (!reason) return route.fallback();
        refused.push(reason);
        return route.abort('blockedbyclient');
    });
    return refused;
};

module.exports = { own, check, guardRequests, guardPage };
