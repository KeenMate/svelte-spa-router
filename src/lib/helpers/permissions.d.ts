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
     * Function that returns current user object
     * @returns Current user
     */
    getCurrentUser: () => any;

    /**
     * Optional handler called when user lacks required permissions
     * @param detail - Route detail object
     */
    onUnauthorized?: (detail: any) => void;
}

/**
 * Options for creating a protected route
 */
export interface ProtectedRouteOptions {
    /** Async component import function */
    component: () => Promise<any>;
    /** Permission requirements */
    permissions?: PermissionRequirements;
    /** Loading component to show while loading */
    loadingComponent?: any;
    /** Additional props to pass to component */
    props?: Record<string, any>;
    /** Additional user data to attach to route */
    userData?: any;
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
 * import { configurePermissions } from '@keenmate/svelte-spa-router/helpers/permissions'
 * import { get } from 'svelte/store'
 * import { currentUser } from './stores/auth'
 *
 * configurePermissions({
 *   checkPermissions: (user, requirements) => {
 *     if (!requirements?.any) return true
 *     return requirements.any.some(perm => user.permissions.includes(perm))
 *   },
 *   getCurrentUser: () => get(currentUser),
 *   onUnauthorized: (detail) => {
 *     console.error('Access denied:', detail.location)
 *     push('/unauthorized')
 *   }
 * })
 * ```
 */
export function configurePermissions(config: PermissionConfig): void;

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
