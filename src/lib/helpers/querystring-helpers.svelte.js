/**
 * Querystring helper utilities for querystring-driven UIs
 *
 * These helpers make it easy to create UIs where the URL querystring
 * is the source of truth for filters, pagination, search, etc.
 */

import { querystring, push, replace } from '../utils.svelte.js'

/**
 * Parse querystring into an object
 * Uses URLSearchParams by default (built-in, no dependencies)
 *
 * @param {string} qs - Querystring to parse
 * @param {Object} options - Parsing options
 * @param {boolean} options.arrays - Parse array parameters (default: true)
 * @returns {Object} Parsed querystring object
 */
export function parseQuerystring(qs, options = {}) {
    const { arrays = true } = options

    if (!qs) {
        return {}
    }

    const params = new URLSearchParams(qs)
    const result = {}

    // Group parameters by name to handle arrays
    for (const [key, value] of params.entries()) {
        if (arrays && params.getAll(key).length > 1) {
            // Multiple values with same key = array
            result[key] = params.getAll(key)
        } else {
            result[key] = value
        }
    }

    return result
}

/**
 * Stringify an object into a querystring
 *
 * @param {Object} obj - Object to stringify
 * @param {Object} options - Stringify options
 * @param {boolean} options.dropNull - Drop null/undefined values (default: true)
 * @param {boolean} options.dropEmpty - Drop empty strings (default: false)
 * @returns {string} Querystring (without leading '?')
 */
export function stringifyQuerystring(obj, options = {}) {
    const { dropNull = true, dropEmpty = false } = options

    if (!obj || Object.keys(obj).length === 0) {
        return ''
    }

    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(obj)) {
        // Skip null/undefined if requested
        if (dropNull && (value === null || value === undefined)) {
            continue
        }

        // Skip empty strings if requested
        if (dropEmpty && value === '') {
            continue
        }

        // Handle arrays
        if (Array.isArray(value)) {
            value.forEach(v => {
                if (dropNull && (v === null || v === undefined)) return
                if (dropEmpty && v === '') return
                params.append(key, String(v))
            })
        } else {
            params.append(key, String(value))
        }
    }

    return params.toString()
}

/**
 * Get parsed querystring (non-reactive)
 * Use this in a $derived or $effect to make it reactive
 *
 * @param {Object} options - Parsing options
 * @returns {Object} Parsed querystring object
 *
 * @example
 * // In a component:
 * const query = $derived(getParsedQuerystring())
 * // query updates automatically when URL changes
 * console.log(query.search, query.page)
 */
export function getParsedQuerystring(options) {
    return parseQuerystring(querystring(), options)
}

/**
 * Update querystring with partial changes
 * Merges new values with existing querystring
 *
 * @param {Object} updates - Object with updates to apply
 * @param {Object} options - Update options
 * @param {boolean} options.replace - Use replace instead of push (default: false)
 * @param {boolean} options.dropNull - Drop null/undefined values (default: true)
 * @param {boolean} options.dropEmpty - Drop empty strings (default: false)
 * @returns {Promise<void>}
 *
 * @example
 * // Update search parameter while keeping other params
 * await updateQuerystring({ search: 'foo' })
 *
 * // Remove a parameter by setting to null
 * await updateQuerystring({ page: null })
 *
 * // Replace history instead of push
 * await updateQuerystring({ filter: 'active' }, { replace: true })
 */
export async function updateQuerystring(updates, options = {}) {
    const { replace: shouldReplace = false, dropNull = true, dropEmpty = false } = options

    // Parse current querystring
    const current = parseQuerystring(querystring())

    // Merge with updates
    const merged = { ...current, ...updates }

    // Remove null values if requested (allows removing params by setting to null)
    if (dropNull) {
        Object.keys(merged).forEach(key => {
            if (merged[key] === null || merged[key] === undefined) {
                delete merged[key]
            }
        })
    }

    // Stringify new querystring
    const newQs = stringifyQuerystring(merged, { dropNull, dropEmpty })

    // Get current location without querystring
    const currentLocation = window.location.pathname

    // Build new URL
    const newUrl = newQs ? `${currentLocation}?${newQs}` : currentLocation

    // Navigate
    const navigate = shouldReplace ? replace : push
    await navigate(newUrl)
}

/**
 * Advanced: Custom parser support for libraries like 'qs'
 *
 * @param {Function} customParser - Custom parse function (querystring) => object
 * @param {Function} customStringifier - Custom stringify function (object) => string
 * @returns {Object} Helper functions using custom parser/stringifier
 *
 * @example
 * import { parse, stringify } from 'qs'
 *
 * const qsHelpers = createQuerystringHelpers(
 *   (qs) => parse(qs, { arrayFormat: 'brackets' }),
 *   (obj) => stringify(obj, { arrayFormat: 'brackets', skipNulls: true })
 * )
 *
 * // Use custom helpers
 * const query = $derived(qsHelpers.getParsedQuerystring())
 * await qsHelpers.updateQuerystring({ search: 'foo' })
 */
export function createQuerystringHelpers(customParser, customStringifier) {
    return {
        parseQuerystring: customParser,
        stringifyQuerystring: customStringifier,
        getParsedQuerystring: (options) => customParser(querystring(), options),
        updateQuerystring: async (updates, options = {}) => {
            const { replace: shouldReplace = false } = options
            const current = customParser(querystring())
            const merged = { ...current, ...updates }
            const newQs = customStringifier(merged, options)
            const currentLocation = window.location.pathname
            const newUrl = newQs ? `${currentLocation}?${newQs}` : currentLocation
            const navigate = shouldReplace ? replace : push
            await navigate(newUrl)
        }
    }
}
