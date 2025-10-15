/**
 * Type definitions for @keenmate/svelte-spa-router utilities
 */

/**
 * Link action options
 */
export interface LinkActionOptions {
    /** Custom href to use instead of the element's href attribute */
    href?: string;
    /** Named route to navigate to (requires route to be registered) */
    route?: string;
    /** Route parameters (used with route option) */
    params?: Record<string, any>;
    /** Query string parameters */
    query?: Record<string, any>;
    /** If true, link is disabled */
    disabled?: boolean;
    /** If true, replaces current history entry instead of pushing (history mode only) */
    replace?: boolean;
}

/**
 * Location object returned by getLocation
 */
export interface Location {
    /** Current location path (e.g., '/about') */
    location: string;
    /** Query string without the '?' (e.g., 'foo=bar') */
    querystring: string;
}

/**
 * Enable or disable hash-based routing
 * Must be called before mounting the app
 *
 * @param value - true for hash mode (#/path), false for history mode (/path)
 *
 * @example
 * ```typescript
 * import { setHashRoutingEnabled } from '@keenmate/svelte-spa-router/utils'
 * setHashRoutingEnabled(false) // Enable history mode
 * ```
 */
export function setHashRoutingEnabled(value: boolean): void;

/**
 * Set the base path for history mode routing
 * Must be called before mounting the app
 * Only used when hash routing is disabled
 *
 * @param value - Base path (e.g., '/app' or '/')
 *
 * @example
 * ```typescript
 * import { setBasePath } from '@keenmate/svelte-spa-router/utils'
 * setBasePath('/my-app')
 * ```
 */
export function setBasePath(value: string): void;

/**
 * Get current routing mode
 *
 * @returns true if hash mode is enabled, false if history mode
 */
export function getHashRoutingEnabled(): boolean;

/**
 * Get current base path
 *
 * @returns Current base path setting
 */
export function getBasePath(): string;

/**
 * Get the current location path
 *
 * @returns Current location (e.g., '/about')
 *
 * @example
 * ```typescript
 * import { location } from '@keenmate/svelte-spa-router/utils'
 * console.log(location()) // '/about'
 * ```
 */
export function location(): string;

/**
 * Get the current query string
 *
 * @returns Query string without '?' (e.g., 'foo=bar&baz=123')
 *
 * @example
 * ```typescript
 * import { querystring } from '@keenmate/svelte-spa-router/utils'
 * console.log(querystring()) // 'foo=bar'
 * ```
 */
export function querystring(): string;

/**
 * Get the full location object
 *
 * @returns Location object with path and querystring
 */
export function loc(): Location;

/**
 * Get current route parameters
 *
 * @returns Object containing route parameters or undefined
 *
 * @example
 * ```typescript
 * // For route '/user/:id'
 * import { params } from '@keenmate/svelte-spa-router/utils'
 * console.log(params()) // { id: '123' }
 * ```
 */
export function params(): Record<string, string> | undefined;

/**
 * Navigate to a new page programmatically
 *
 * @param location - Path to navigate to (must start with '/' or '#/')
 * @returns Promise that resolves after navigation completes
 *
 * @example
 * ```typescript
 * import { push } from '@keenmate/svelte-spa-router/utils'
 * await push('/about')
 * ```
 */
export function push(location: string): Promise<void>;

/**
 * Navigate back in history (browser back button)
 *
 * @returns Promise that resolves after navigation completes
 *
 * @example
 * ```typescript
 * import { pop } from '@keenmate/svelte-spa-router/utils'
 * await pop()
 * ```
 */
export function pop(): Promise<void>;

/**
 * Replace current page without modifying history stack
 *
 * @param location - Path to navigate to (must start with '/' or '#/')
 * @returns Promise that resolves after navigation completes
 *
 * @example
 * ```typescript
 * import { replace } from '@keenmate/svelte-spa-router/utils'
 * await replace('/login')
 * ```
 */
export function replace(location: string): Promise<void>;

/**
 * Svelte action that enables router navigation on anchor tags
 *
 * Supports multiple usage patterns:
 * - Old style: `<a href="/books" use:link>`
 * - Object with href: `<a use:link={{href: '/books'}}>`
 * - Named routes: `<a use:link={{route: 'bookDetail', params: {bookId: 123}}}>`
 * - Array shorthand: `<a use:link={['bookDetail', {bookId: 123}]}>`
 *
 * In history mode, respects:
 * - Modifier keys (Ctrl+Click opens in new tab)
 * - Target attribute (_blank, etc.)
 *
 * @param node - The anchor element (automatically set by Svelte)
 * @param opts - String (href), array [route, params, query?], or options object
 *
 * @example
 * ```svelte
 * <script>
 * import { link } from '@keenmate/svelte-spa-router/utils'
 * </script>
 *
 * <!-- Old style (still works) -->
 * <a href="/about" use:link>About</a>
 *
 * <!-- Direct href with object -->
 * <a use:link={{href: '/books'}}>Books</a>
 *
 * <!-- Named routes -->
 * <a use:link={{route: 'bookDetail', params: {bookId: 123}}}>View Book</a>
 *
 * <!-- Array shorthand -->
 * <a use:link={['bookDetail', {bookId: 123}]}>View Book</a>
 *
 * <!-- With query string -->
 * <a use:link={{route: 'books', query: {category: 'fiction'}}}>Fiction</a>
 * ```
 */
export function link(
    node: HTMLElement,
    opts?: string | [string, Record<string, any>?, Record<string, any>?] | LinkActionOptions
): {
    update(updated: string | [string, Record<string, any>?, Record<string, any>?] | LinkActionOptions): void;
};

/**
 * Restore scroll position from history state
 *
 * @param state - History state object containing scroll position
 */
export function restoreScroll(state?: {
    __svelte_spa_router_scrollX?: number;
    __svelte_spa_router_scrollY?: number;
}): void;

/**
 * Internal function to set route parameters
 * Used by the router component
 *
 * @param newParams - New route parameters
 * @internal
 */
export function setParams(newParams: Record<string, string> | undefined): void;
