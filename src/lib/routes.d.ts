/**
 * Named routes registry and URL builder
 */

/**
 * Register a named route
 *
 * @param name - Route name (e.g., 'documentDetail')
 * @param pattern - Path pattern (e.g., '/documents/:documentId')
 *
 * @example
 * ```typescript
 * registerRoute('documentDetail', '/documents/:documentId')
 * registerRoute('userProfile', '/users/:userId/profile')
 * ```
 */
export function registerRoute(name: string, pattern: string): void;

/**
 * Register multiple routes at once
 *
 * @param routes - Object mapping route names to patterns
 *
 * @example
 * ```typescript
 * registerRoutes({
 *   home: '/',
 *   documentDetail: '/documents/:documentId',
 *   userProfile: '/users/:userId/profile'
 * })
 * ```
 */
export function registerRoutes(routes: Record<string, string>): void;

/**
 * Get all registered routes
 *
 * @returns Route registry
 */
export function getRoutes(): Record<string, string>;

/**
 * Clear all registered routes
 */
export function clearRoutes(): void;

/**
 * Build a URL from a route name and parameters
 *
 * @param name - Route name
 * @param params - Route parameters
 * @param query - Query string parameters
 * @returns Built URL
 *
 * @example
 * ```typescript
 * buildUrl('documentDetail', { documentId: 123 })
 * // Returns: '/documents/123'
 *
 * buildUrl('documentDetail', { documentId: 123 }, { tab: 'info' })
 * // Returns: '/documents/123?tab=info'
 * ```
 */
export function buildUrl(
    name: string,
    params?: Record<string, any>,
    query?: Record<string, any>
): string;

/**
 * Check if a route name is registered
 *
 * @param name - Route name
 * @returns True if route is registered
 */
export function hasRoute(name: string): boolean;

/**
 * Get the pattern for a registered route by name
 *
 * @param name - Route name
 * @returns Route pattern or undefined if not registered
 */
export function getRouteByName(name: string): string | undefined;

// --- defineRoutes types ---

/** Extract :param names from a route path pattern */
type ExtractParams<T extends string> =
    T extends `${string}:${infer Param}/${infer Rest}`
        ? { [K in Param]: string | number } & ExtractParams<`/${Rest}`>
        : T extends `${string}:${infer Param}`
            ? { [K in Param]: string | number }
            : Record<string, never>;

/** Route definition for defineRoutes() */
interface RouteDefinition {
    path: string;
    component: any;
    loadingComponent?: any;
    loadingParams?: Record<string, any>;
    conditions?: Function | Function[];
    props?: Record<string, any>;
    routeContext?: Record<string, any>;
    title?: string;
    breadcrumbs?: Array<{ label: string; path?: string; id?: string }>;
    shouldDisplayLoadingOnRouteLoad?: boolean;
    permissions?: { any?: string[]; all?: string[] };
    authorizationCallback?: Function;
    inheritBreadcrumbs?: boolean;
    inheritPermissions?: boolean;
    inheritConditions?: boolean;
    inheritAuthorization?: boolean;
}

/** Navigation helper for a single route */
interface RouteNav<Path extends string> {
    push(
        params?: ExtractParams<Path>,
        query?: Record<string, any>,
        navigationContext?: any
    ): Promise<void>;
    replace(
        params?: ExtractParams<Path>,
        query?: Record<string, any>,
        navigationContext?: any
    ): Promise<void>;
    link(
        params?: ExtractParams<Path>,
        query?: Record<string, any>
    ): { route: string; params?: any; query?: any };
    readonly path: Path;
}

/** Return type of defineRoutes() */
interface DefineRoutesResult<T extends Record<string, RouteDefinition>> {
    routes: Record<string, any>;
    nav: {
        [K in keyof T]: RouteNav<T[K]['path']>;
    };
    paths: {
        [K in keyof T]: (
            params?: ExtractParams<T[K]['path']>,
            query?: Record<string, any>
        ) => string;
    };
}

/**
 * Define routes as a single source of truth, returning the routes object
 * for <Router>, navigation helpers with autocomplete, and path builders.
 *
 * @param definitions - Route definitions keyed by name
 * @returns Routes object, navigation helpers, and path builders
 *
 * @example
 * ```typescript
 * const { routes, nav, paths } = defineRoutes({
 *   home: { path: '/', component: Home },
 *   user: { path: '/user/:id', component: () => import('./User.svelte') },
 *   about: { path: '/about', component: () => import('./About.svelte') }
 * })
 *
 * // Navigate with autocomplete on route names and params
 * nav.user.push({ id: 123 })
 * nav.home.replace()
 *
 * // Build URLs for links
 * paths.user({ id: 123 })  // '/user/123'
 *
 * // For use:link action
 * nav.user.link({ id: 123 })  // { route: 'user', params: { id: 123 } }
 * ```
 */
export function defineRoutes<const T extends Record<string, RouteDefinition>>(
    definitions: T
): DefineRoutesResult<T>;
