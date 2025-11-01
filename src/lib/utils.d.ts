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
    /** Navigation context data to pass to the route (doesn't appear in URL) */
    navigationContext?: any;
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
 * Set the placeholder value for missing route parameters
 * Used when building URLs from named routes with incomplete parameters
 *
 * @param value - Placeholder value (default: 'N-A')
 *
 * @example
 * ```typescript
 * import { setParamReplacementPlaceholder } from '@keenmate/svelte-spa-router/utils'
 * setParamReplacementPlaceholder('MISSING')
 * ```
 */
export function setParamReplacementPlaceholder(value: string): void;

/**
 * Get current parameter replacement placeholder
 *
 * @returns Placeholder value
 */
export function getParamReplacementPlaceholder(): string;

/**
 * Enable or disable debug logging for the router
 * When enabled, displays color-coded console logs for:
 * - Route matching and pipeline execution
 * - Navigation (push, pop, replace, goBack)
 * - Scroll restoration
 *
 * Logs are disabled by default for clean production consoles.
 *
 * @param value - true to enable debug logs, false to disable
 *
 * @example
 * ```typescript
 * import { setDebugLoggingEnabled } from '@keenmate/svelte-spa-router/utils'
 *
 * // Enable debug logs in development
 * if (import.meta.env.DEV) {
 *   setDebugLoggingEnabled(true)
 * }
 * ```
 */
export function setDebugLoggingEnabled(value: boolean): void;

/**
 * Check if debug logging is currently enabled
 *
 * @returns true if debug logging is enabled
 *
 * @example
 * ```typescript
 * import { getDebugLoggingEnabled } from '@keenmate/svelte-spa-router/utils'
 *
 * if (getDebugLoggingEnabled()) {
 *   console.log('Debug mode is active')
 * }
 * ```
 */
export function getDebugLoggingEnabled(): boolean;

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
 * @template T - Optional type for the route parameters (provides intellisense)
 * @returns Object containing route parameters or undefined
 *
 * @example
 * ```typescript
 * import { routeParams } from '@keenmate/svelte-spa-router/utils'
 *
 * // Without type parameter (basic usage)
 * // For route '/user/:id'
 * console.log(routeParams()) // { id: '123' }
 *
 * // With type parameter (full intellisense)
 * interface UserParams {
 *   userId: string
 *   tab?: string
 * }
 *
 * // For route '/user/:userId/:tab?'
 * const p = $derived(routeParams<UserParams>())
 * if (p) {
 *   const userId = p.userId  // ✅ TypeScript knows this exists
 *   const tab = p.tab        // ✅ TypeScript knows this is optional
 * }
 *
 * // Another example with book details
 * interface BookParams {
 *   bookId: string
 *   section?: string
 * }
 *
 * // For route '/book/:bookId/:section?'
 * const bookParams = $derived(routeParams<BookParams>())
 * if (bookParams) {
 *   fetchBook(bookParams.bookId)  // ✅ Type-safe
 * }
 * ```
 */
export function routeParams<T = Record<string, string>>(): T | undefined;

/**
 * Get route navigation context data
 * Navigation context is data passed during navigation that doesn't appear in the URL
 *
 * @template T - Optional type for the navigation context data (provides intellisense)
 * @returns Context object or null if no context was set
 *
 * @example
 * ```typescript
 * import { context, push } from '@keenmate/svelte-spa-router/utils'
 *
 * // Navigate with context
 * await push('/orders', { orderId: 123, customer: 'John' })
 *
 * // In the route component
 * interface OrderNavigationContext {
 *   orderId: number
 *   customer: string
 * }
 *
 * const ctx = $derived(navigationContext<OrderContext>())
 * if (ctx) {
 *   console.log(`Order ${ctx.orderId} for ${ctx.customer}`)
 * }
 * ```
 */
export function navigationContext<T = any>(): T | null;

/**
 * Scroll behavior options for navigation
 */
export interface ScrollOptions {
    /**
     * Controls scroll behavior on navigation
     * - undefined (default): scroll to top
     * - 'restore': restore scroll from history state
     * - 'none': don't scroll
     */
    scrollBehavior?: 'restore' | 'none';
}

/**
 * Navigate to a new page programmatically
 *
 * Supports multiple formats:
 * - String: `push('/about')`
 * - String with navigation context: `push('/orders', { orderId: 123 })`
 * - Multi-parameter: `push(route, routeParams, queryString, navigationContext)`
 * - Array (3 elements): `push(['userProfile', { userId: 123 }, { tab: 'settings' }])`
 * - Array (4 elements): `push(['userProfile', { userId: 123 }, { tab: 'x' }, { role: 'admin' }])`
 * - Object: `push({ route: 'userProfile', params: { userId: 123 }, query: { tab: 'settings' } })`
 * - Object with navigation context: `push({ href: '/orders', navigationContext: { orderId: 123 } })`
 *
 * Multi-parameter route resolution:
 * - Route starts with `/` → exact path (e.g., `/about`)
 * - Route doesn't start with `/` → named route lookup (e.g., `'userProfile'`)
 *
 * @param location - Path/route to navigate to, or array, or options object
 * @param param2 - Route params (multi-param mode) or navigation context (string mode)
 * @param param3 - Query string (multi-param mode only)
 * @param param4 - Navigation context (multi-param mode only)
 * @param param5 - Scroll options (multi-param mode only)
 * @returns Promise that resolves after navigation completes
 *
 * @example
 * ```typescript
 * import { push } from '@keenmate/svelte-spa-router/utils'
 *
 * // String format
 * await push('/about')
 *
 * // String with navigation context (WinForms-like)
 * await push('/orders', { orderId: 123, customer: 'John' })
 *
 * // Multi-parameter: exact path
 * await push('/users/123', null, { tab: 'settings' })
 *
 * // Multi-parameter: named route
 * await push('userProfile', { userId: 123 })
 * await push('userProfile', { userId: 123 }, { tab: 'settings' })
 * await push('userProfile', { userId: 123 }, { tab: 'x' }, { role: 'admin' })
 *
 * // With scroll control
 * await push('/previous-page', {}, {}, null, { scrollBehavior: 'restore' })
 * await push('/tab-2', {}, {}, null, { scrollBehavior: 'none' })
 *
 * // Array format (3 elements)
 * await push(['userProfile', { userId: 123 }, { tab: 'settings' }])
 *
 * // Array format (4 elements with context)
 * await push(['userProfile', { userId: 123 }, { tab: 'x' }, { role: 'admin' }])
 *
 * // Object format
 * await push({
 *   route: 'userProfile',
 *   params: { userId: 123 },
 *   query: { tab: 'settings' },
 *   navigationContext: { role: 'admin' }
 * })
 * ```
 */
export function push(
    location: string | [string, Record<string, any>?, Record<string, any>?, any?] | LinkActionOptions,
    param2?: any,
    param3?: Record<string, any>,
    param4?: any,
    param5?: ScrollOptions
): Promise<void>;

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
 * Navigate back to the referrer with scroll restoration
 *
 * This is a convenience function that:
 * 1. Checks if a referrer exists in navigationContext
 * 2. Navigates to the referrer location with scroll restoration
 * 3. Falls back to browser back if no referrer available
 *
 * Requires `setIncludeReferrer('always')` or `setIncludeReferrer('notfound')` to be set
 *
 * @returns Promise that resolves after navigation completes
 *
 * @example
 * ```typescript
 * import { goBack } from '@keenmate/svelte-spa-router/utils'
 *
 * // In a 404 or unauthorized page
 * function handleGoBack() {
 *   await goBack()  // Navigates to referrer with scroll restored
 * }
 * ```
 */
export function goBack(): Promise<void>;

/**
 * Replace current page without modifying history stack
 *
 * Supports multiple formats:
 * - String: `replace('/login')`
 * - String with navigation context: `replace('/orders', { orderId: 123 })`
 * - Multi-parameter: `replace(route, routeParams, queryString, navigationContext)`
 * - Array (3 elements): `replace(['userProfile', { userId: 123 }, { tab: 'settings' }])`
 * - Array (4 elements): `replace(['userProfile', { userId: 123 }, { tab: 'x' }, { role: 'admin' }])`
 * - Object: `replace({ route: 'userProfile', params: { userId: 123 }, query: { tab: 'settings' } })`
 * - Object with navigation context: `replace({ href: '/orders', navigationContext: { orderId: 123 } })`
 *
 * Multi-parameter route resolution:
 * - Route starts with `/` → exact path (e.g., `/about`)
 * - Route doesn't start with `/` → named route lookup (e.g., `'userProfile'`)
 *
 * @param location - Path/route to navigate to, or array, or options object
 * @param param2 - Route params (multi-param mode) or navigation context (string mode)
 * @param param3 - Query string (multi-param mode only)
 * @param param4 - Navigation context (multi-param mode only)
 * @param param5 - Scroll options (multi-param mode only)
 * @returns Promise that resolves after navigation completes
 *
 * @example
 * ```typescript
 * import { replace } from '@keenmate/svelte-spa-router/utils'
 *
 * // String format
 * await replace('/login')
 *
 * // String with navigation context
 * await replace('/orders', { orderId: 123, customer: 'John' })
 *
 * // Multi-parameter: exact path
 * await replace('/users/123', null, { tab: 'settings' })
 *
 * // Multi-parameter: named route
 * await replace('userProfile', { userId: 123 })
 * await replace('userProfile', { userId: 123 }, { tab: 'settings' })
 * await replace('userProfile', { userId: 123 }, { tab: 'x' }, { role: 'admin' })
 *
 * // With scroll control
 * await replace('/previous-page', {}, {}, null, { scrollBehavior: 'restore' })
 * await replace('/tab-2', {}, {}, null, { scrollBehavior: 'none' })
 *
 * // Array format (3 elements)
 * await replace(['userProfile', { userId: 123 }, { tab: 'settings' }])
 *
 * // Array format (4 elements with context)
 * await replace(['userProfile', { userId: 123 }, { tab: 'x' }, { role: 'admin' }])
 *
 * // Object format
 * await replace({
 *   route: 'userProfile',
 *   params: { userId: 123 },
 *   query: { tab: 'settings' },
 *   navigationContext: { role: 'admin' }
 * })
 * ```
 */
export function replace(
    location: string | [string, Record<string, any>?, Record<string, any>?, any?] | LinkActionOptions,
    param2?: any,
    param3?: Record<string, any>,
    param4?: any,
    param5?: ScrollOptions
): Promise<void>;

/**
 * Svelte action that enables router navigation on anchor tags
 *
 * Supports multiple usage patterns:
 * - Old style: `<a href="/books" use:link>`
 * - Object with href: `<a use:link={{href: '/books'}}>`
 * - Named routes: `<a use:link={{route: 'bookDetail', params: {bookId: 123}}}>`
 * - Array shorthand (3 elements): `<a use:link={['bookDetail', {bookId: 123}, {preview: 'true'}]}>`
 * - Array shorthand (4 elements): `<a use:link={['bookDetail', {bookId: 123}, {preview: 'true'}, {source: 'list'}]}>`
 *
 * In history mode, respects:
 * - Modifier keys (Ctrl+Click opens in new tab)
 * - Target attribute (_blank, etc.)
 *
 * @param node - The anchor element (automatically set by Svelte)
 * @param opts - String (href), array [route, params, query?, navigationContext?], or options object
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
 * <!-- Array shorthand (3 elements) -->
 * <a use:link={['bookDetail', {bookId: 123}, {preview: 'true'}]}>View Book</a>
 *
 * <!-- Array shorthand (4 elements with navigation context) -->
 * <a use:link={['bookDetail', {bookId: 123}, {preview: 'true'}, {source: 'list'}]}>View Book</a>
 *
 * <!-- With query string -->
 * <a use:link={{route: 'books', query: {category: 'fiction'}}}>Fiction</a>
 * ```
 */
export function link(
    node: HTMLElement,
    opts?: string | [string, Record<string, any>?, Record<string, any>?, any?] | LinkActionOptions
): {
    update(updated: string | [string, Record<string, any>?, Record<string, any>?, any?] | LinkActionOptions): void;
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

/**
 * Zone component data
 */
export interface ZoneComponentData {
    /** The loaded Svelte component */
    component: any;
    /** Route parameters */
    params: Record<string, string> | null;
    /** Static props for the component */
    props: Record<string, any>;
    /** route context attached to the route */
    routeContext: any;
}

/**
 * Get component data for a specific zone
 * Used by Router instances with zone prop
 *
 * @param zoneName - Name of the zone
 * @returns Zone component data or null if not set
 *
 * @example
 * ```typescript
 * import { getZoneComponent } from '@keenmate/svelte-spa-router/utils'
 *
 * const sidebarData = getZoneComponent('sidebar')
 * if (sidebarData) {
 *   console.log('Sidebar component:', sidebarData.component)
 * }
 * ```
 */
export function getZoneComponent(zoneName: string): ZoneComponentData | null;

/**
 * Internal function to set zone components
 * Used by the router component
 *
 * @param zoneComponents - Dictionary of zone names to component data
 * @internal
 */
export function setZoneComponents(zoneComponents: Record<string, ZoneComponentData>): void;
