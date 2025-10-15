/**
 * Reactive querystring state for the entire application
 *
 * This module provides a shared reactive querystring parser that you can use
 * across your entire app without having to call getParsedQuerystring() in every component.
 *
 * @example
 * ```svelte
 * <script>
 * import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
 *
 * // Use directly - it's reactive!
 * const search = $derived(query.search || '')
 * const page = $derived(query.page ? Number(query.page) : 1)
 * const tags = $derived(Array.isArray(query.tags) ? query.tags : [])
 * </script>
 * ```
 */

import { getParsedQuerystring } from './querystring-helpers.svelte.js'

/**
 * Configuration for querystring parsing
 * Set this before your app initializes (e.g., in main.js)
 */
let config = $state({
    arrayFormat: 'auto',  // 'auto', 'repeat', or 'comma'
    arrays: true
})

/**
 * Configure querystring parsing for the entire app
 * Call this in your main.js before mounting the app
 *
 * @param {Object} options - Configuration options
 * @param {string} options.arrayFormat - Array format: 'auto', 'repeat', or 'comma' (default: 'auto')
 * @param {boolean} options.arrays - Parse array parameters (default: true)
 *
 * @example
 * ```javascript
 * // In main.js
 * import { configureQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'
 *
 * // Use comma format for the whole app
 * configureQuerystring({ arrayFormat: 'comma' })
 * ```
 */
export function configureQuerystring(options) {
    config = { ...config, ...options }
}

/**
 * Get the reactive parsed querystring
 * This is a function that returns the current parsed querystring
 * Use it in $derived or $effect to make it reactive
 *
 * @returns {Object} Parsed querystring object
 *
 * @example
 * ```svelte
 * <script>
 * import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
 *
 * // Access values - wrap in $derived to make it reactive
 * const search = $derived(query().search || '')
 * const page = $derived(query().page ? Number(query().page) : 1)
 * </script>
 *
 * <input type="text" value={search} />
 * ```
 */
export function query() {
    return getParsedQuerystring(config)
}
