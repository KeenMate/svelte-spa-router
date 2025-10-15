/**
 * Querystring helper utilities for querystring-driven UIs
 */

/**
 * Options for parsing querystring
 */
export interface ParseOptions {
    /**
     * Parse array parameters (default: true)
     */
    arrays?: boolean
}

/**
 * Options for stringifying objects
 */
export interface StringifyOptions {
    /**
     * Drop null/undefined values (default: true)
     */
    dropNull?: boolean
    /**
     * Drop empty strings (default: false)
     */
    dropEmpty?: boolean
}

/**
 * Options for updating querystring
 */
export interface UpdateOptions extends StringifyOptions {
    /**
     * Use replace instead of push (default: false)
     */
    replace?: boolean
}

/**
 * Parse querystring into an object
 */
export function parseQuerystring(qs: string, options?: ParseOptions): Record<string, string | string[]>

/**
 * Stringify an object into a querystring
 */
export function stringifyQuerystring(obj: Record<string, any>, options?: StringifyOptions): string

/**
 * Get parsed querystring (non-reactive)
 * Use this in a $derived or $effect to make it reactive
 */
export function getParsedQuerystring(options?: ParseOptions): Record<string, string | string[]>

/**
 * Update querystring with partial changes
 * Merges new values with existing querystring
 */
export function updateQuerystring(updates: Record<string, any>, options?: UpdateOptions): Promise<void>

/**
 * Helper functions with custom parser/stringifier
 */
export interface QuerystringHelpers {
    parseQuerystring: (qs: string, options?: any) => Record<string, any>
    stringifyQuerystring: (obj: Record<string, any>, options?: any) => string
    getParsedQuerystring: (options?: any) => Record<string, any>
    updateQuerystring: (updates: Record<string, any>, options?: any) => Promise<void>
}

/**
 * Advanced: Custom parser support for libraries like 'qs'
 */
export function createQuerystringHelpers(
    customParser: (qs: string, options?: any) => Record<string, any>,
    customStringifier: (obj: Record<string, any>, options?: any) => string
): QuerystringHelpers
