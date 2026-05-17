/**
 * Type definitions for wrap utilities
 */

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
    /** Label to display */
    label: string;
    /** Optional path for the breadcrumb link */
    path?: string;
}

/**
 * Route precondition function
 */
export type RoutePrecondition = (detail: any) => boolean | Promise<boolean>;

/**
 * Wrapped component object
 */
export interface WrappedComponent {
    /** Component loader function (not used in zone mode) */
    component?: () => Promise<any>;
    /** Zone components (used in zone mode) */
    zones?: Record<string, () => Promise<any>>;
    /** Route preconditions */
    conditions?: RoutePrecondition[];
    /** Static props for the component */
    props?: Record<string, any>;
    /** route context attached to the route */
    routeContext?: any;
    /** Internal router flag */
    _sveltesparouter: true;
    /** Internal zone mode flag */
    _isZoneMode?: boolean;
}

/**
 * Options for the wrap function
 */
export interface WrapOptions {
    /** Synchronous component (incompatible with asyncComponent and zones) */
    component?: any;
    /** Async component import function (incompatible with component and zones) */
    asyncComponent?: () => Promise<any>;
    /** Zone components: dictionary of zone names to components (incompatible with component and asyncComponent) */
    zones?: Record<string, any | (() => Promise<any>)>;
    /** Loading placeholder component */
    loadingComponent?: any;
    /** Props for loading component */
    loadingParams?: Record<string, any>;
    /** Custom route context */
    routeContext?: any;
    /** Static props for the component */
    props?: Record<string, any>;
    /** Route guards/preconditions */
    conditions?: RoutePrecondition | RoutePrecondition[];
    /** Page title */
    title?: string;
    /** Breadcrumb trail */
    breadcrumbs?: BreadcrumbItem[];
    /**
     * If true, mounts the route component immediately but keeps it visually
     * hidden under the `loadingComponent` until the component itself calls
     * `hideLoading()` from `@keenmate/svelte-spa-router/helpers/route-metadata`.
     *
     * **You MUST call `hideLoading()` from the route component**, typically at
     * the end of an `onMount` data-fetch. If you forget, the loading component
     * stays visible forever and the real component never appears — the route
     * is effectively bricked until the user navigates away. In development a
     * `console.warn` is emitted after 10s as a diagnostic; production has no
     * automatic recovery.
     *
     * Pair with `loadingComponent` — has no effect on its own.
     */
    shouldDisplayLoadingOnRouteLoad?: boolean;
}

/**
 * Options for creating a route
 */
export interface RouteOptions {
    /** Component (sync) or async import function */
    component: any | (() => Promise<any>);
    /** Loading placeholder component */
    loadingComponent?: any;
    /** Props for loading component */
    loadingParams?: Record<string, any>;
    /** Custom route context */
    routeContext?: any;
    /** Static props for the component */
    props?: Record<string, any>;
    /** Route guards/preconditions */
    conditions?: RoutePrecondition | RoutePrecondition[];
    /** Page title */
    title?: string;
    /** Breadcrumb trail */
    breadcrumbs?: BreadcrumbItem[];
    /**
     * If true, mounts the route component immediately but keeps it visually
     * hidden under the `loadingComponent` until the component itself calls
     * `hideLoading()` from `@keenmate/svelte-spa-router/helpers/route-metadata`.
     *
     * **You MUST call `hideLoading()` from the route component**, typically at
     * the end of an `onMount` data-fetch. If you forget, the loading component
     * stays visible forever and the real component never appears — the route
     * is effectively bricked until the user navigates away. In development a
     * `console.warn` is emitted after 10s as a diagnostic; production has no
     * automatic recovery.
     *
     * Pair with `loadingComponent` — has no effect on its own.
     */
    shouldDisplayLoadingOnRouteLoad?: boolean;
}

/**
 * Wraps a component to enable async loading, conditions, and metadata
 *
 * @param args - Wrap configuration options
 * @returns Wrapped component object
 *
 * @example
 * ```typescript
 * import { wrap } from '@keenmate/svelte-spa-router/wrap'
 *
 * const routes = {
 *   '/admin': wrap({
 *     asyncComponent: () => import('./Admin.svelte'),
 *     conditions: [(detail) => checkAuth()],
 *     loadingComponent: Loading,
 *     title: 'Admin Panel'
 *   })
 * }
 * ```
 */
export function wrap(args: WrapOptions): WrappedComponent;

/**
 * Creates a route definition (without wrap)
 * Returns a configuration object that must be passed to wrap()
 *
 * @param options - Route configuration options
 * @returns Route definition (pass to wrap())
 *
 * @example
 * ```typescript
 * import { wrap, createRouteDefinition } from '@keenmate/svelte-spa-router/wrap'
 *
 * const routes = {
 *   '/admin': wrap(createRouteDefinition({
 *     component: () => import('./Admin.svelte'),
 *     title: 'Admin Panel',
 *     loadingComponent: Loading
 *   }))
 * }
 * ```
 */
export function createRouteDefinition(options: RouteOptions): WrapOptions;

/**
 * Creates a route (already wrapped)
 * This is the most convenient way to create routes - no wrap() needed!
 *
 * @param options - Route configuration options
 * @returns Wrapped route component (ready to use)
 *
 * @example
 * ```typescript
 * import { createRoute } from '@keenmate/svelte-spa-router/wrap'
 *
 * const routes = {
 *   // No wrap() needed!
 *   '/': createRoute({
 *     component: () => import('./Home.svelte'),
 *     title: 'Home'
 *   }),
 *   '/admin': createRoute({
 *     component: () => import('./Admin.svelte'),
 *     title: 'Admin Panel',
 *     breadcrumbs: [
 *       { label: 'Home', path: '/' },
 *       { label: 'Admin' }
 *     ],
 *     loadingComponent: Loading,
 *     conditions: [checkAuth]
 *   })
 * }
 * ```
 */
export function createRoute(options: RouteOptions): WrappedComponent;

export default wrap;
