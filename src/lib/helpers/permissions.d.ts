/**
 * Type definitions for permission checking utilities
 */

/**
 * Permission requirements structure
 */
export interface PermissionRequirements {
    /** User needs at least one of these permissions */
    any?: string[];
    /** User needs all of these permissions */
    all?: string[];
}

/**
 * Permission configuration
 */
export interface PermissionConfig {
    /**
     * Function to check if user has required permissions
     * @param user - Current user object
     * @param requirements - Permission requirements
     * @returns true if user has required permissions
     */
    checkPermissions: (user: any, requirements: PermissionRequirements) => boolean;

    /**
     * Function that returns the current user object.
     *
     * Optional in Svelte 5 — if omitted, the default getter reads from the
     * internal reactive user state populated by `setCurrentUser()`, which is
     * the recommended path for new code (gives `hasPermission()` automatic
     * reactivity in `{#if}` blocks without extra plumbing).
     *
     * Provide this only when you already maintain your own reactive user
     * store and prefer to read from it directly. Note that non-reactive reads
     * (e.g. `() => get(myStore)`) will not propagate updates to UI.
     */
    getCurrentUser?: () => any;

    /**
     * Optional handler called when user lacks required permissions
     * @param detail - Route detail object
     */
    onUnauthorized?: (detail: any) => void;

    /**
     * Optional handler called when a `revalidateCurrentRoute()` re-check
     * fails. When set, fires *instead of* the standard unauthorized handling
     * (component / navigate) for revalidation failures — letting you take
     * over with a softer flow (e.g. confirmation dialog before redirecting).
     *
     * The standard `onConditionsFailed` Router event still fires for
     * consistency with fresh navigation. If you do nothing inside this
     * handler, the user stays on the currently-mounted route — useful when
     * you want to prompt them before redirecting.
     *
     * Pass `null` to clear and fall back to standard unauthorized handling.
     *
     * @param detail - Object with route/location info plus `isPermissionFailure`
     *
     * @example
     * ```typescript
     * configurePermissions({
     *   onRevalidationFailure: async (detail) => {
     *     const confirmed = await showConfirmDialog(
     *       'Your permissions have changed. Return to home?'
     *     )
     *     if (confirmed) push('/')
     *     // If user dismisses the dialog, they stay on the current page.
     *   }
     * })
     * ```
     */
    onRevalidationFailure?: ((detail: {
        route: string
        location: string
        relativeLocation: string
        querystring: string
        params: Record<string, string>
        isPermissionFailure: boolean
    }) => void | Promise<void>) | null;
}

/**
 * Options for creating a protected route
 */
export interface ProtectedRouteOptions {
    /** Async component import function */
    component: () => Promise<any>;
    /** Permission requirements (role-based authorization) */
    permissions?: PermissionRequirements;
    /** Custom authorization callback (resource-based authorization) */
    authorizationCallback?: (detail: any) => boolean | Promise<boolean>;
    /** Loading component to show while loading */
    loadingComponent?: any;
    /** Additional props to pass to component */
    props?: Record<string, any>;
    /** Additional route context to attach to route */
    routeContext?: any;
    /** Additional wrap options */
    [key: string]: any;
}

/**
 * Configure the permission system
 * Call this once during app initialization
 *
 * @param config - Permission configuration
 *
 * @example
 * ```typescript
 * import { configurePermissions, setCurrentUser } from '@keenmate/svelte-spa-router/helpers/permissions'
 *
 * configurePermissions({
 *   checkPermissions: (user, requirements) => {
 *     if (!user || !requirements) return false
 *     if (requirements.any) return requirements.any.some(p => user.permissions.includes(p))
 *     if (requirements.all) return requirements.all.every(p => user.permissions.includes(p))
 *     return true
 *   },
 *   onUnauthorized: (detail) => {
 *     console.error('Access denied:', detail.location)
 *     push('/unauthorized')
 *   }
 * })
 *
 * // Push user state in from anywhere — UI re-evaluates hasPermission() reactively.
 * setCurrentUser({ id: 42, permissions: ['admin.read'] })
 * ```
 */
export function configurePermissions(config: PermissionConfig): void;

/**
 * Set the current user.
 *
 * Writes to the internal reactive user state. Every `hasPermission()` call
 * in a reactive context (template `{#if}`, `$derived`, `$effect`) re-evaluates
 * automatically when called — no extra subscription wiring needed on the
 * consumer side.
 *
 * Useful for: login/logout flows, websocket permission updates, token refresh.
 *
 * @param user - The current user object, or `null` for logged-out state
 *
 * @example
 * ```typescript
 * import { setCurrentUser } from '@keenmate/svelte-spa-router/helpers/permissions'
 *
 * // After login
 * setCurrentUser({ id: 42, permissions: ['admin.read'] })
 *
 * // On logout
 * setCurrentUser(null)
 * ```
 */
export function setCurrentUser(user: any): void;

/**
 * Get the current user.
 *
 * Returns whatever the configured `currentUserGetter` returns. With the
 * default getter (or after `setCurrentUser()`), reads from the internal
 * reactive user state.
 *
 * @returns The current user object, or `null`
 */
export function getCurrentUser(): any;

/**
 * Create a permission condition function for use with wrap()
 *
 * @param requirements - Permission requirements
 * @returns Condition function for wrap()
 *
 * @example
 * ```typescript
 * import { wrap } from '@keenmate/svelte-spa-router/wrap'
 * import { createPermissionCondition } from '@keenmate/svelte-spa-router/helpers/permissions'
 *
 * const routes = {
 *   '/admin': wrap({
 *     component: () => import('./Admin.svelte'),
 *     conditions: [
 *       createPermissionCondition({ any: ['admin.read', 'admin.write'] })
 *     ]
 *   })
 * }
 * ```
 */
export function createPermissionCondition(
    requirements: PermissionRequirements
): (detail: any) => boolean;

/**
 * Helper to create a protected route definition (without wrap)
 * Returns wrap options that you must pass to wrap()
 *
 * @param options - Protected route options
 * @returns Wrap options object (pass this to wrap())
 *
 * @example
 * ```typescript
 * import { wrap } from '@keenmate/svelte-spa-router/wrap'
 * import { createProtectedRouteDefinition } from '@keenmate/svelte-spa-router/helpers/permissions'
 *
 * const routes = {
 *   '/admin': wrap(createProtectedRouteDefinition({
 *     component: () => import('./Admin.svelte'),
 *     permissions: { any: ['admin.read'] },
 *     loadingComponent: Loading
 *   }))
 * }
 * ```
 */
export function createProtectedRouteDefinition(options: ProtectedRouteOptions): any;

/**
 * Helper to create a protected route (already wrapped)
 * This is the most convenient way - no wrap() needed!
 *
 * @param options - Protected route options
 * @returns Wrapped route component (ready to use directly)
 *
 * @example
 * ```typescript
 * import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'
 *
 * const routes = {
 *   // No wrap() needed! createProtectedRoute handles it for you
 *   '/admin': createProtectedRoute({
 *     component: () => import('./Admin.svelte'),
 *     permissions: { any: ['admin.read'] },
 *     loadingComponent: Loading
 *   }),
 *   '/settings': createProtectedRoute({
 *     component: () => import('./Settings.svelte'),
 *     permissions: { all: ['settings.read', 'settings.write'] }
 *   })
 * }
 * ```
 */
export function createProtectedRoute(options: ProtectedRouteOptions): any;

/**
 * Check if current user has specific permissions
 * Useful for showing/hiding UI elements
 *
 * @param requirements - Permission requirements
 * @returns true if user has required permissions
 *
 * @example
 * ```typescript
 * import { hasPermission } from '@keenmate/svelte-spa-router/helpers/permissions'
 *
 * if (hasPermission({ any: ['admin.read'] })) {
 *   console.log('User has admin access')
 * }
 * ```
 */
export function hasPermission(requirements: PermissionRequirements): boolean;
