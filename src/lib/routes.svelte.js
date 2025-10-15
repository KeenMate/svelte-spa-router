/**
 * Named routes registry and URL builder
 *
 * This module provides a route registry system that allows you to:
 * 1. Register named routes with path patterns
 * 2. Build URLs from route names and parameters
 * 3. Use named routes in the link action
 */

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
            console.warn(`Missing parameter "${paramName}" for route "${name}"`)
            return match // Keep the :param if value is missing
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
