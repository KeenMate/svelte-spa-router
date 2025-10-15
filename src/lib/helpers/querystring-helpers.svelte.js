/**
 * Querystring helper utilities for querystring-driven UIs
 *
 * These helpers make it easy to create UIs where the URL querystring
 * is the source of truth for filters, pagination, search, etc.
 */

import { querystring, location, push, replace } from '../utils.svelte.js'

/**
 * Parse querystring into an object
 * Uses URLSearchParams by default (built-in, no dependencies)
 *
 * @param {string} qs - Querystring to parse
 * @param {Object} options - Parsing options
 * @param {boolean} options.arrays - Parse array parameters (default: true)
 * @param {string} options.arrayFormat - Array format: 'repeat' (tags=x&tags=y) or 'comma' (tags=x,y,z) (default: 'repeat')
 * @returns {Object} Parsed querystring object
 *
 * @example
 * // Repeat format (default)
 * parseQuerystring('tags=foo&tags=bar') // { tags: ['foo', 'bar'] }
 *
 * // Comma format
 * parseQuerystring('tags=foo,bar,baz', { arrayFormat: 'comma' }) // { tags: ['foo', 'bar', 'baz'] }
 */
export function parseQuerystring(qs, options = {}) {
    const { arrays = true, arrayFormat = 'repeat' } = options

    if (!qs) {
        return {}
    }

    const params = new URLSearchParams(qs)
    const result = {}

    // Group parameters by name to handle arrays
    for (const [key, value] of params.entries()) {
        if (!arrays) {
            // Arrays disabled, take last value
            result[key] = value
        } else if (arrayFormat === 'comma') {
            // Comma-separated format: split on comma
            if (value.includes(',')) {
                result[key] = value.split(',').map(v => v.trim())
            } else {
                result[key] = value
            }
        } else {
            // Repeat format (default): multiple params with same key
            if (params.getAll(key).length > 1) {
                result[key] = params.getAll(key)
            } else {
                result[key] = value
            }
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
 * @param {string} options.arrayFormat - Array format: 'repeat' (tags=x&tags=y) or 'comma' (tags=x,y,z) (default: 'repeat')
 * @returns {string} Querystring (without leading '?')
 *
 * @example
 * // Repeat format (default)
 * stringifyQuerystring({ tags: ['foo', 'bar'] }) // 'tags=foo&tags=bar'
 *
 * // Comma format
 * stringifyQuerystring({ tags: ['foo', 'bar'] }, { arrayFormat: 'comma' }) // 'tags=foo,bar'
 */
export function stringifyQuerystring(obj, options = {}) {
    const { dropNull = true, dropEmpty = false, arrayFormat = 'repeat' } = options

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
            if (arrayFormat === 'comma') {
                // Comma-separated format: join with comma
                const filtered = value.filter(v => {
                    if (dropNull && (v === null || v === undefined)) return false
                    if (dropEmpty && v === '') return false
                    return true
                })
                if (filtered.length > 0) {
                    params.append(key, filtered.map(v => String(v)).join(','))
                }
            } else {
                // Repeat format (default): multiple params with same key
                value.forEach(v => {
                    if (dropNull && (v === null || v === undefined)) return
                    if (dropEmpty && v === '') return
                    params.append(key, String(v))
                })
            }
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
 * @param {boolean} options.arrays - Parse array parameters (default: true)
 * @param {string} options.arrayFormat - Array format: 'repeat' or 'comma' (default: 'repeat')
 * @returns {Object} Parsed querystring object
 *
 * @example
 * // In a component:
 * const query = $derived(getParsedQuerystring())
 * // query updates automatically when URL changes
 * console.log(query.search, query.page)
 *
 * @example
 * // With comma-separated arrays:
 * const query = $derived(getParsedQuerystring({ arrayFormat: 'comma' }))
 * // URL: ?tags=foo,bar,baz
 * console.log(query.tags) // ['foo', 'bar', 'baz']
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
 * @param {string} options.arrayFormat - Array format: 'repeat' or 'comma' (default: 'repeat')
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
 *
 * @example
 * // Using comma-separated array format
 * await updateQuerystring({ tags: ['foo', 'bar', 'baz'] }, { arrayFormat: 'comma' })
 * // Results in: ?tags=foo,bar,baz
 */
export async function updateQuerystring(updates, options = {}) {
    const { replace: shouldReplace = false, dropNull = true, dropEmpty = false, arrayFormat = 'repeat' } = options

    // Parse current querystring from window.location (not router state)
    // This ensures we get the actual current URL, not a potentially stale router state
    const currentQs = window.location.search ? window.location.search.substring(1) : ''
    const current = parseQuerystring(currentQs, { arrayFormat })

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
    const newQs = stringifyQuerystring(merged, { dropNull, dropEmpty, arrayFormat })

    // Get current location from window (for reliability in tests and real usage)
    // In history mode, use pathname directly
    // In hash mode, extract from hash
    let currentLocation
    if (window.location.hash && window.location.hash.startsWith('#/')) {
        // Hash mode - extract path from hash
        const hashPath = window.location.hash.substring(1)
        const qsPos = hashPath.indexOf('?')
        currentLocation = qsPos > -1 ? hashPath.substring(0, qsPos) : hashPath
    } else {
        // History mode - use pathname
        currentLocation = window.location.pathname
    }

    // Build new URL
    const newUrl = newQs ? `${currentLocation}?${newQs}` : currentLocation

    // Navigate
    const navigate = shouldReplace ? replace : push
    await navigate(newUrl)
}

/**
 * Advanced: Custom parser support for libraries like 'qs'
 *
 * When using custom parsers, you have full control over array formatting.
 * The built-in helpers support 'repeat' and 'comma' formats via the arrayFormat option.
 *
 * @param {Function} customParser - Custom parse function (querystring, options?) => object
 * @param {Function} customStringifier - Custom stringify function (object, options?) => string
 * @returns {Object} Helper functions using custom parser/stringifier
 *
 * @example
 * import { parse, stringify } from 'qs'
 *
 * // Using qs library with brackets array format
 * const qsHelpers = createQuerystringHelpers(
 *   (qs, opts) => parse(qs, { arrayFormat: 'brackets', ...opts }),
 *   (obj, opts) => stringify(obj, { arrayFormat: 'brackets', skipNulls: true, ...opts })
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
            // Parse current querystring from window.location
            const currentQs = window.location.search ? window.location.search.substring(1) : ''
            const current = customParser(currentQs)
            const merged = { ...current, ...updates }
            const newQs = customStringifier(merged, options)

            // Get current location from window
            let currentLocation
            if (window.location.hash && window.location.hash.startsWith('#/')) {
                // Hash mode
                const hashPath = window.location.hash.substring(1)
                const qsPos = hashPath.indexOf('?')
                currentLocation = qsPos > -1 ? hashPath.substring(0, qsPos) : hashPath
            } else {
                // History mode
                currentLocation = window.location.pathname
            }

            const newUrl = newQs ? `${currentLocation}?${newQs}` : currentLocation
            const navigate = shouldReplace ? replace : push
            await navigate(newUrl)
        }
    }
}
