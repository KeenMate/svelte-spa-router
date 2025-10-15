/**
 * Flexible filters system for querystring-based filtering
 */

/**
 * Filter mode types
 */
export type FilterMode = 'flat' | 'structured'

/**
 * Configuration options for filters
 */
export interface FiltersConfig {
    /**
     * Filter mode: 'flat' (separate params) or 'structured' (single param)
     * Default: 'flat'
     */
    mode?: FilterMode

    /**
     * Parameter name for structured filters
     * Default: '$filter'
     */
    paramName?: string

    /**
     * Custom parser function for structured filters
     * @param filterString - The filter string from the URL
     * @returns Parsed filter object
     */
    parse?: (filterString: string) => Record<string, any>

    /**
     * Custom stringifier function for structured filters
     * @param filters - Filter object to stringify
     * @returns Filter string for the URL
     */
    stringify?: (filters: Record<string, any>) => string
}

/**
 * Options for updating filters
 */
export interface UpdateFiltersOptions {
    /**
     * Use replace instead of push (default: false)
     */
    replace?: boolean

    /**
     * Merge with existing filters (default: true)
     */
    merge?: boolean
}

/**
 * Configure filter parsing for the entire app
 * Call this in your main.js before mounting the app
 *
 * @param options - Configuration options
 *
 * @example
 * ```typescript
 * // Flat mode (default)
 * configureFilters({ mode: 'flat' })
 *
 * // OData-style filters
 * configureFilters({
 *   mode: 'structured',
 *   paramName: '$filter',
 *   parse: (str) => parseODataFilter(str),
 *   stringify: (obj) => stringifyODataFilter(obj)
 * })
 * ```
 */
export function configureFilters(options: FiltersConfig): void

/**
 * Get current filters configuration
 * @returns Current configuration
 */
export function getFiltersConfig(): Required<FiltersConfig>

/**
 * Get the reactive parsed filters
 * Returns a filter object based on the configured mode
 *
 * @template T - Optional type for the filter parameters (provides intellisense)
 * @returns Parsed filters object
 *
 * @example
 * ```typescript
 * import { filters } from '@keenmate/svelte-spa-router/helpers/filters'
 *
 * // Without type parameter (basic usage)
 * const search = $derived(filters().search || '')
 * const categoryId = $derived(filters().categoryId)
 *
 * // With type parameter (full intellisense)
 * interface ProductFilters {
 *   search?: string
 *   category?: string
 *   status?: 'active' | 'discontinued'
 *   minPrice?: number
 *   maxPrice?: number
 * }
 *
 * const f = $derived(filters<ProductFilters>())
 * const search = $derived(f.search || '')              // TypeScript knows this is string | undefined
 * const category = $derived(f.category || 'all')       // TypeScript knows this is string | undefined
 * const status = $derived(f.status || 'active')        // TypeScript knows this is the union type
 * const minPrice = $derived(f.minPrice ? Number(f.minPrice) : null)  // Proper type checking
 * ```
 */
export function filters<T = Record<string, any>>(): T

/**
 * Update filters in the URL
 *
 * @template T - Optional type for the filter parameters (provides intellisense and type safety)
 * @param updates - Filter updates to apply
 * @param options - Update options
 *
 * @example
 * ```typescript
 * // Without type parameter (basic usage)
 * await updateFilters({ search: 'java', categoryId: 123 })
 *
 * // With type parameter (type-safe updates)
 * interface ProductFilters {
 *   search?: string
 *   category?: string
 *   status?: 'active' | 'discontinued'
 *   minPrice?: number
 *   maxPrice?: number
 * }
 *
 * // TypeScript will validate that updates match ProductFilters
 * await updateFilters<ProductFilters>({ search: 'java', status: 'active' })
 * // TypeScript will error if you use invalid values
 * // await updateFilters<ProductFilters>({ status: 'invalid' })  // ❌ Error
 *
 * // Set filter to empty (keeps the parameter with empty value)
 * await updateFilters<ProductFilters>({ search: null })
 * // Result: ?search=&categoryId=123
 *
 * // Remove a filter completely (removes the parameter)
 * await updateFilters<ProductFilters>({ category: undefined })
 * // Result: ?search=java
 *
 * // Replace history instead of push
 * await updateFilters<ProductFilters>({ status: 'active' }, { replace: true })
 * ```
 */
export function updateFilters<T = Record<string, any>>(
    updates: Partial<T>,
    options?: UpdateFiltersOptions
): Promise<void>
