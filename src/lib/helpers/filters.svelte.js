import { filtersLogger } from '../logger.ts'
/**
 * Flexible filters system for querystring-based filtering
 *
 * Supports two common filtering patterns:
 * 1. Flat parameters: ?search=java&categoryId=123&status=active
 * 2. Structured filters: ?$filter=displayName eq 'john' AND status eq 'active'
 *
 * @example
 * ```javascript
 * // In main.js - configure the filter parser
 * import { configureFilters } from '@keenmate/svelte-spa-router/helpers/filters'
 *
 * // Flat parameters (default)
 * configureFilters({ mode: 'flat' })
 *
 * // OData-style filters
 * configureFilters({
 *   mode: 'structured',
 *   paramName: '$filter',
 *   parse: (filterString) => parseODataFilter(filterString),
 *   stringify: (filters) => stringifyODataFilter(filters)
 * })
 * ```
 */

import { querystring } from '../utils.svelte.js'

/**
 * Filter configuration
 */
let config = $state({
    mode: 'flat',  // 'flat' or 'structured'
    paramName: '$filter',  // Parameter name for structured filters
    parse: null,  // Custom parser function: (string) => object
    stringify: null  // Custom stringifier function: (object) => string
})

/**
 * Configure filter parsing for the entire app
 *
 * @param {Object} options - Configuration options
 * @param {string} options.mode - Filter mode: 'flat' or 'structured' (default: 'flat')
 * @param {string} options.paramName - Parameter name for structured filters (default: '$filter')
 * @param {Function} options.parse - Custom parser: (filterString) => filterObject
 * @param {Function} options.stringify - Custom stringifier: (filterObject) => filterString
 *
 * @example
 * ```javascript
 * // Flat mode (default) - each filter is a separate query parameter
 * configureFilters({ mode: 'flat' })
 * // URL: ?search=java&categoryId=123
 * // filters() returns: { search: 'java', categoryId: '123' }
 *
 * // Structured mode - filters in a single parameter with custom syntax
 * configureFilters({
 *   mode: 'structured',
 *   paramName: '$filter',
 *   parse: (str) => {
 *     // Parse "displayName eq 'john' AND status eq 'active'"
 *     const parts = str.split(' AND ')
 *     const result = {}
 *     parts.forEach(part => {
 *       const [field, , value] = part.split(' ')
 *       result[field] = value.replace(/'/g, '')
 *     })
 *     return result
 *   },
 *   stringify: (obj) => {
 *     // Convert { displayName: 'john', status: 'active' }
 *     // to "displayName eq 'john' AND status eq 'active'"
 *     return Object.entries(obj)
 *       .filter(([, v]) => v !== null && v !== undefined)
 *       .map(([k, v]) => `${k} eq '${v}'`)
 *       .join(' AND ')
 *   }
 * })
 * // URL: ?$filter=displayName eq 'john' AND status eq 'active'
 * // filters() returns: { displayName: 'john', status: 'active' }
 * ```
 */
export function configureFilters(options) {
    config = { ...config, ...options }
}

/**
 * Get current filters configuration
 * @returns {Object} Current configuration
 */
export function getFiltersConfig() {
    return { ...config }
}

/**
 * Get the reactive parsed filters
 * Returns a filter object based on the configured mode
 *
 * @returns {Object} Parsed filters object
 *
 * @example
 * ```svelte
 * <script>
 * import { filters } from '@keenmate/svelte-spa-router/helpers/filters'
 *
 * // Access filter values - wrap in $derived to make it reactive
 * const search = $derived(filters().search || '')
 * const categoryId = $derived(filters().categoryId)
 * const status = $derived(filters().status || 'all')
 * </script>
 *
 * <input type="text" value={search} />
 * <p>Category: {categoryId}</p>
 * ```
 */
export function filters() {
    const qs = querystring()

    if (!qs) {
        return {}
    }

    if (config.mode === 'structured') {
        // Structured mode: parse from a single parameter
        const params = new URLSearchParams(qs)
        const filterString = params.get(config.paramName)

        if (!filterString) {
            return {}
        }

        if (config.parse) {
            try {
                return config.parse(filterString)
            } catch (e) {
                filtersLogger.error('Error parsing filters:', e)
                return {}
            }
        }

        // Default structured parser (simple key=value AND key=value)
        return parseStructuredFilters(filterString)
    } else {
        // Flat mode: each filter is a separate query parameter
        const params = new URLSearchParams(qs)
        const result = {}

        for (const [key, value] of params.entries()) {
            result[key] = value
        }

        return result
    }
}

/**
 * Update filters in the URL
 *
 * @param {Object} updates - Filter updates to apply
 * @param {Object} options - Update options
 * @param {boolean} options.replace - Use replace instead of push (default: false)
 * @param {boolean} options.merge - Merge with existing filters (default: true)
 * @returns {Promise<void>}
 *
 * @example
 * ```javascript
 * // Update specific filters
 * await updateFilters({ search: 'java', categoryId: 123 })
 *
 * // Set filter to empty (keeps the parameter with empty value)
 * await updateFilters({ search: null })
 * // Result: ?search=&categoryId=123
 *
 * // Remove a filter completely (removes the parameter)
 * await updateFilters({ categoryId: undefined })
 * // Result: ?search=java
 *
 * // Replace all filters (don't merge)
 * await updateFilters({ search: 'new' }, { merge: false })
 *
 * // Replace history instead of push
 * await updateFilters({ status: 'active' }, { replace: true })
 * ```
 */
export async function updateFilters(updates, options = {}) {
    const { replace: shouldReplace = false, merge = true } = options

    // Import push/replace dynamically to avoid circular dependencies
    const { push, replace: replaceFn } = await import('../utils.svelte.js')

    // Get current filters
    const current = merge ? filters() : {}

    // Merge updates
    const merged = { ...current, ...updates }

    // Remove only undefined values (null is kept as empty string)
    Object.keys(merged).forEach(key => {
        if (merged[key] === undefined) {
            delete merged[key]
        }
    })

    // Build new URL
    let newUrl
    const currentLocation = window.location.pathname

    if (config.mode === 'structured') {
        // Structured mode: build filter string
        let filterString = ''

        if (Object.keys(merged).length > 0) {
            if (config.stringify) {
                filterString = config.stringify(merged)
            } else {
                filterString = stringifyStructuredFilters(merged)
            }
        }

        // Get other query parameters (non-filter params)
        const params = new URLSearchParams(window.location.search)
        params.delete(config.paramName)

        if (filterString) {
            params.set(config.paramName, filterString)
        }

        const queryString = params.toString()
        newUrl = queryString ? `${currentLocation}?${queryString}` : currentLocation
    } else {
        // Flat mode: each filter is a query parameter
        const params = new URLSearchParams()

        for (const [key, value] of Object.entries(merged)) {
            params.set(key, String(value))
        }

        const queryString = params.toString()
        newUrl = queryString ? `${currentLocation}?${queryString}` : currentLocation
    }

    // Navigate
    const navigate = shouldReplace ? replaceFn : push
    await navigate(newUrl)
}

/**
 * Default structured filter parser
 * Parses simple "field eq 'value' AND field2 eq 'value2'" syntax
 *
 * @param {string} filterString - Filter string to parse
 * @returns {Object} Parsed filters
 * @private
 */
function parseStructuredFilters(filterString) {
    if (!filterString) return {}

    const result = {}

    // Split on AND/and (case insensitive)
    const parts = filterString.split(/\s+AND\s+|\s+and\s+/)

    parts.forEach(part => {
        part = part.trim()

        // Match patterns like: field eq 'value' or field eq value
        const match = part.match(/^(\w+)\s+(eq|ne|gt|lt|ge|le|contains)\s+(?:'([^']*)'|(\S+))$/i)

        if (match) {
            const field = match[1]
            const value = match[3] || match[4] // Quoted or unquoted value

            result[field] = value
        }
    })

    return result
}

/**
 * Default structured filter stringifier
 * Converts object to "field eq 'value' AND field2 eq 'value2'" syntax
 *
 * @param {Object} filters - Filters object to stringify
 * @returns {string} Filter string
 * @private
 */
function stringifyStructuredFilters(filters) {
    return Object.entries(filters)
        .filter(([, value]) => value !== undefined)  // undefined removes it, null/'' keeps it
        .map(([key, value]) => `${key} eq '${value === null ? '' : value}'`)
        .join(' AND ')
}
