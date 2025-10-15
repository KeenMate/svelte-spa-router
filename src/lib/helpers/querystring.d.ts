/**
 * Reactive querystring state for the entire application
 */

import type { ArrayFormat } from './querystring-helpers.js'

/**
 * Configuration options for querystring parsing
 */
export interface QuerystringConfig {
    /**
     * Array format: 'auto' (auto-detect), 'repeat', or 'comma'
     * Default: 'auto'
     */
    arrayFormat?: ArrayFormat
    /**
     * Parse array parameters
     * Default: true
     */
    arrays?: boolean
}

/**
 * Configure querystring parsing for the entire app
 * Call this in your main.js before mounting the app
 */
export function configureQuerystring(options: QuerystringConfig): void

/**
 * Get the reactive parsed querystring
 * This is a function that returns the current parsed querystring
 * Use it in $derived or $effect to make it reactive
 *
 * @template T - Optional type for the query parameters (provides intellisense)
 * @returns Parsed querystring object
 *
 * @example
 * ```typescript
 * import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
 *
 * // Without type parameter (basic usage)
 * const search = $derived(query().search || '')
 * const page = $derived(query().page ? Number(query().page) : 1)
 *
 * // With type parameter (full intellisense)
 * interface DocumentDetailQuery {
 *   documentId: string
 *   tab?: string
 *   search?: string
 *   tags?: string[]
 * }
 *
 * const q = $derived(query<DocumentDetailQuery>())
 * const documentId = $derived(q.documentId)  // TypeScript knows this exists
 * const tab = $derived(q.tab || 'overview')  // TypeScript knows this is optional
 * const tags = $derived(q.tags || [])        // TypeScript knows this is string[]
 * ```
 */
export function query<T = Record<string, string | string[]>>(): T
