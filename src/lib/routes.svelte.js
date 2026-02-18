/**
 * Named routes registry and URL builder
 *
 * This module provides a route registry system that allows you to:
 * 1. Register named routes with path patterns
 * 2. Build URLs from route names and parameters
 * 3. Use named routes in the link action
 */

import { getParamReplacementPlaceholder, push as navPush, replace as navReplace } from './utils.svelte.js'
import { createRoute } from './wrap.js'

// Route registry - maps route names to path patterns
let routeRegistry = $state({})

/**
 * Register a named route
 *
 * @param {string} name - Route name (e.g., 'documentDetail')
 * @param {string} pattern - Path pattern (e.g., '/documents/:documentId')
 *
 * @example
 * registerRoute('documentDetail', '/documents/:documentId')
 * registerRoute('userProfile', '/users/:userId/profile')
 */
export function registerRoute(name, pattern) {
    routeRegistry[name] = pattern
}

/**
 * Register multiple routes at once
 *
 * @param {Object.<string, string>} routes - Object mapping route names to patterns
 *
 * @example
 * registerRoutes({
 *   home: '/',
 *   documentDetail: '/documents/:documentId',
 *   userProfile: '/users/:userId/profile'
 * })
 */
export function registerRoutes(routes) {
    routeRegistry = { ...routeRegistry, ...routes }
}

/**
 * Get all registered routes
 *
 * @returns {Object.<string, string>} Route registry
 */
export function getRoutes() {
    return routeRegistry
}

/**
 * Clear all registered routes
 */
export function clearRoutes() {
    routeRegistry = {}
}

/**
 * Build a URL from a route name and parameters
 *
 * @param {string} name - Route name
 * @param {Object.<string, any>} [params={}] - Route parameters
 * @param {Object.<string, any>} [query={}] - Query string parameters
 * @returns {string} Built URL
 *
 * @example
 * buildUrl('documentDetail', { documentId: 123 })
 * // Returns: '/documents/123'
 *
 * buildUrl('documentDetail', { documentId: 123 }, { tab: 'info' })
 * // Returns: '/documents/123?tab=info'
 */
export function buildUrl(name, params = {}, query = {}) {
    const pattern = routeRegistry[name]

    if (!pattern) {
        console.warn(`Route "${name}" not found in registry. Registered routes:`, Object.keys(routeRegistry))
        return name // Fallback to using the name as-is (might be a direct path)
    }

    // Replace :param tokens with actual values
    let url = pattern.replace(/:(\w+)/g, (match, paramName) => {
        const value = params[paramName]
        if (value === undefined || value === null) {
            const placeholder = getParamReplacementPlaceholder()
            console.warn(`Missing parameter "${paramName}" for route "${name}", using placeholder "${placeholder}"`)
            return placeholder
        }
        return encodeURIComponent(String(value))
    })

    // Add query string if provided
    if (query && Object.keys(query).length > 0) {
        const queryString = Object.entries(query)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&')

        if (queryString) {
            url += '?' + queryString
        }
    }

    return url
}

/**
 * Check if a route name is registered
 *
 * @param {string} name - Route name
 * @returns {boolean} True if route is registered
 */
export function hasRoute(name) {
    return name in routeRegistry
}

/**
 * Get the pattern for a registered route by name
 *
 * @param {string} name - Route name
 * @returns {string|undefined} Route pattern or undefined if not registered
 *
 * @example
 * getRouteByName('documentDetail')
 * // Returns: '/documents/:documentId'
 */
export function getRouteByName(name) {
    return routeRegistry[name]
}

/**
 * Define routes as a single source of truth, returning the routes object
 * for <Router>, navigation helpers with autocomplete, and path builders.
 *
 * @param {Object.<string, {path: string, component: any, [key: string]: any}>} definitions - Route definitions keyed by name
 * @returns {{routes: Object, nav: Object, paths: Object}} Routes object, navigation helpers, and path builders
 *
 * @example
 * ```javascript
 * const { routes, nav, paths } = defineRoutes({
 *   home: { path: '/', component: Home },
 *   user: { path: '/user/:id', component: () => import('./User.svelte') },
 *   about: { path: '/about', component: () => import('./About.svelte'), conditions: [checkAuth] }
 * })
 *
 * // Use routes with Router
 * <Router {routes} />
 *
 * // Navigate with autocomplete
 * nav.user.push({ id: 123 })
 * nav.home.replace()
 *
 * // Build URLs for links
 * <a href={paths.user({ id: 123 })} use:link>User 123</a>
 *
 * // For use:link action
 * <a use:link={nav.user.link({ id: 123 })}>User 123</a>
 * ```
 */
export function defineRoutes(definitions) {
    const routes = {}
    const routeMap = {}
    const nav = {}
    const paths = {}

    for (const [name, config] of Object.entries(definitions)) {
        const { path, component, ...options } = config

        // Build routes object for <Router>
        const hasOptions = Object.keys(options).length > 0
        const isAsync = typeof component === 'function' && component.length === 0

        if (!hasOptions && !isAsync) {
            // Simple sync component — use directly (no wrap overhead)
            routes[path] = component
        } else {
            // Has options or async component — use createRoute()
            routes[path] = createRoute({ component, ...options })
        }

        // Track for named route registration
        routeMap[name] = path

        // Build nav helper
        nav[name] = {
            push: (params, query, navigationContext) =>
                navPush(name, params, query, navigationContext),
            replace: (params, query, navigationContext) =>
                navReplace(name, params, query, navigationContext),
            link: (params, query) =>
                ({ route: name, params, query }),
            path
        }

        // Build path helper
        paths[name] = (params, query) => buildUrl(name, params, query)
    }

    // Register all named routes
    registerRoutes(routeMap)

    return { routes, nav, paths }
}
