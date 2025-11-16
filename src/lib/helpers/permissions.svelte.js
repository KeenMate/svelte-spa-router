/**
 * Permission checking utilities for route guards
 *
 * This module provides a flexible permission system that works with wrap() conditions.
 * You can customize the permission checking logic to match your authentication system.
 */

import { wrap } from '../wrap.js'
import { permissionsLogger } from '../logger.ts'

/**
 * Global permission checker function
 * Override this with your own implementation
 *
 * @type {(user: any, requirements: any) => boolean}
 */
let permissionChecker = () => {
    // Default: always allow
    console.warn('No permission checker configured. All routes allowed by default.')
    return true
}

/**
 * Global user getter function
 * Override this with your own implementation to return current user
 *
 * @type {() => any}
 */
let currentUserGetter = () => {
    console.warn('No user getter configured. Permission checks may fail.')
    return null
}

/**
 * Global unauthorized handler
 * Override this to customize what happens when permission is denied
 *
 * @type {(detail: any) => void}
 */
let unauthorizedHandler = (detail) => {
    console.warn('Access denied to route:', detail.location)
    // Default: redirect to unauthorized page
    if (typeof window !== 'undefined') {
        window.location.hash = '#/unauthorized'
    }
}

/**
 * Unauthorized behavior mode: 'component' or 'navigate'
 * - 'component': Show unauthorized component without changing URL
 * - 'navigate': Navigate to unauthorizedRoute
 */
let unauthorizedBehavior = 'component'

/**
 * Route to navigate to when unauthorized (if behavior is 'navigate')
 */
let unauthorizedRoute = '/unauthorized'

/**
 * Component to show when unauthorized
 */
let unauthorizedComponent = null

/**
 * Track if onUnauthorized callback was explicitly configured
 * Used to determine priority: explicit callback > configured behavior > default
 */
let hasExplicitUnauthorizedHandler = false

/**
 * Configure the permission system
 * Call this once during app initialization
 *
 * @param {Object} config - Configuration object
 * @param {Function} config.checkPermissions - Function to check if user has required permissions
 *   Signature: (user, requirements) => boolean
 * @param {Function} config.getCurrentUser - Function that returns current user object
 *   Signature: () => User
 * @param {Function} [config.onUnauthorized] - Optional handler for unauthorized access
 *   Signature: (routeDetail) => void
 *
 * @example
 * ```javascript
 * import { configurePermissions } from 'svelte-spa-router-5/helpers/permissions'
 * import { get } from 'svelte/store'
 * import { currentUser } from './stores/auth'
 *
 * configurePermissions({
 *   checkPermissions: (user, requirements) => {
 *     if (!requirements || !requirements.any) return true
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
export function configurePermissions(config) {
    if (config.checkPermissions) {
        permissionChecker = config.checkPermissions
    }
    if (config.getCurrentUser) {
        currentUserGetter = config.getCurrentUser
    }
    if (config.onUnauthorized) {
        unauthorizedHandler = config.onUnauthorized
        hasExplicitUnauthorizedHandler = true
    }
    if (config.unauthorizedBehavior !== undefined) {
        unauthorizedBehavior = config.unauthorizedBehavior
    }
    if (config.unauthorizedRoute !== undefined) {
        unauthorizedRoute = config.unauthorizedRoute
    }
    if (config.unauthorizedComponent !== undefined) {
        unauthorizedComponent = config.unauthorizedComponent
    }
}

/**
 * Create a permission condition function for use with wrap()
 *
 * @param {Object} requirements - Permission requirements
 * @param {string[]} [requirements.any] - User needs at least one of these permissions
 * @param {string[]} [requirements.all] - User needs all of these permissions
 * @returns {Function} Condition function for wrap()
 *
 * @example
 * ```javascript
 * import { wrap } from 'svelte-spa-router-5/wrap'
 * import { createPermissionCondition } from 'svelte-spa-router-5/helpers/permissions'
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
export function createPermissionCondition(requirements) {
    return (detail) => {
        const user = currentUserGetter()
        const hasPermission = permissionChecker(user, requirements)

        permissionsLogger.debug('Permission condition check:', {
            user,
            requirements,
            hasPermission,
            hasExplicitHandler: hasExplicitUnauthorizedHandler,
            detailRouteContext: detail.routeContext
        })

        if (!hasPermission) {
            // Store the attempted route in routeContext for potential redirect after login
            detail.routeContext = detail.routeContext || {}
            detail.routeContext.deniedRoute = detail.location

            // Only call handler if explicitly configured (backward compatibility)
            // Otherwise, let Router handle unauthorized state
            if (hasExplicitUnauthorizedHandler) {
                permissionsLogger.debug('Calling explicit unauthorized handler')
                unauthorizedHandler(detail)
            } else {
                permissionsLogger.debug('No explicit handler - letting Router handle unauthorized state')
            }
            return false
        }

        return true
    }
}

/**
 * Helper to create a protected route definition (without wrap)
 * This returns just the route configuration object for use with wrap()
 *
 * NOTE: In hierarchical mode, permissions and authorization callbacks are automatically
 * inherited from parent routes. Set inheritPermissions: false or inheritAuthorization: false
 * to opt out of inheritance for specific routes.
 *
 * @param {Object} options - Route options
 * @param {Function} options.component - Async component import function or synchronous component
 * @param {Object} [options.permissions] - Permission requirements (role-based)
 * @param {string[]} [options.permissions.any] - User needs at least one
 * @param {string[]} [options.permissions.all] - User needs all
 * @param {Function} [options.authorizationCallback] - Custom authorization check (resource-based)
 * @param {any} [options.loadingComponent] - Loading component to show
 * @param {Object} [options.props] - Additional props to pass to component
 * @param {any} [options.routeContext] - Additional route context to attach
 * @param {boolean} [options.inheritPermissions] - Inherit parent permissions (default: true in hierarchical mode)
 * @param {boolean} [options.inheritAuthorization] - Inherit parent authorization (default: true in hierarchical mode)
 * @param {boolean} [options.inheritConditions] - Inherit parent conditions (default: true in hierarchical mode)
 * @param {boolean} [options.inheritBreadcrumbs] - Inherit parent breadcrumbs (default: true in hierarchical mode)
 * @returns {Object} Route configuration object (needs to be passed to wrap())
 *
 * @example
 * ```javascript
 * import { wrap } from '@keenmate/svelte-spa-router/wrap'
 * import { createProtectedRouteDefinition } from '@keenmate/svelte-spa-router/helpers/permissions'
 *
 * // Role-based only
 * const routes = {
 *   '/admin': wrap(createProtectedRouteDefinition({
 *     component: () => import('./Admin.svelte'),
 *     permissions: { any: ['admin.read'] },
 *     loadingComponent: Loading
 *   }))
 * }
 *
 * // Resource-based only
 * const routes = {
 *   '/document/:id': wrap(createProtectedRouteDefinition({
 *     component: () => import('./DocumentEditor.svelte'),
 *     authorizationCallback: async (detail) => {
 *       const res = await fetch(`/api/documents/${detail.params.id}/check-access`)
 *       return res.ok
 *     }
 *   }))
 * }
 *
 * // Both role-based and resource-based
 * const routes = {
 *   '/document/:id/edit': wrap(createProtectedRouteDefinition({
 *     component: () => import('./DocumentEditor.svelte'),
 *     permissions: { any: ['editor', 'admin'] },
 *     authorizationCallback: checkDocumentAccess
 *   }))
 * }
 *
 * // With hierarchical mode, child inherits parent permissions automatically:
 * const routes = {
 *   '/documents': createProtectedRoute({
 *     component: Documents,
 *     permissions: { any: ['read'] }
 *   }),
 *   '/documents/:id': createProtectedRoute({
 *     component: DocumentDetail,
 *     permissions: { any: ['documents.view'] }
 *     // Automatically inherits 'read' permission from parent
 *     // User must have BOTH 'read' AND 'documents.view'
 *   })
 * }
 * ```
 */
export function createProtectedRouteDefinition(options) {
    const {
        component,
        permissions,
        authorizationCallback,
        loadingComponent,
        props,
        routeContext,
        inheritPermissions,
        inheritAuthorization,
        inheritConditions,
        inheritBreadcrumbs,
        ...restOptions
    } = options

    const wrapOptions = {
        asyncComponent: component,  // Always treat as asyncComponent for wrap()
        ...restOptions
    }

    if (loadingComponent) {
        wrapOptions.loadingComponent = loadingComponent
    }

    if (props) {
        wrapOptions.props = props
    }

    // Merge route context
    wrapOptions.routeContext = {
        ...(routeContext || {}),
        permissions: permissions || {}
    }

    // Pass through inheritance flags
    if (inheritPermissions !== undefined) {
        wrapOptions.inheritPermissions = inheritPermissions
    }
    if (inheritAuthorization !== undefined) {
        wrapOptions.inheritAuthorization = inheritAuthorization
    }
    if (inheritConditions !== undefined) {
        wrapOptions.inheritConditions = inheritConditions
    }
    if (inheritBreadcrumbs !== undefined) {
        wrapOptions.inheritBreadcrumbs = inheritBreadcrumbs
    }

    // Add conditions in order: permissions first, then authorization callback
    wrapOptions.conditions = wrapOptions.conditions || []

    // Add permission condition if permissions specified (role-based)
    // Note: In hierarchical mode, parent permission conditions will execute first automatically
    if (permissions) {
        wrapOptions.conditions.push(createPermissionCondition(permissions))
    }

    // Add authorization callback if specified (resource-based)
    // Note: In hierarchical mode, parent authorization callbacks will execute first automatically
    if (authorizationCallback) {
        wrapOptions.conditions.push(authorizationCallback)
    }

    return wrapOptions
}

/**
 * Helper to create a protected route (already wrapped)
 * This is the most convenient way to create protected routes - no wrap() needed!
 *
 * @param {Object} options - Route options
 * @param {Function} options.component - Async component import function or synchronous component
 * @param {Object} [options.permissions] - Permission requirements (role-based)
 * @param {string[]} [options.permissions.any] - User needs at least one
 * @param {string[]} [options.permissions.all] - User needs all
 * @param {Function} [options.authorizationCallback] - Custom authorization check (resource-based)
 * @param {any} [options.loadingComponent] - Loading component to show
 * @param {Object} [options.props] - Additional props to pass to component
 * @param {any} [options.routeContext] - Additional route context to attach
 * @returns {any} Wrapped route component (ready to use directly in routes object)
 *
 * @example
 * ```javascript
 * import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'
 * import { push } from '@keenmate/svelte-spa-router/utils'
 *
 * // Role-based only
 * const routes = {
 *   '/admin': createProtectedRoute({
 *     component: () => import('./Admin.svelte'),
 *     permissions: { any: ['admin.read'] },
 *     loadingComponent: Loading
 *   })
 * }
 *
 * // Resource-based only
 * async function checkDocumentAccess(detail) {
 *   const res = await fetch(`/api/documents/${detail.params.id}/check-access`)
 *   if (!res.ok) {
 *     await push('/unauthorized', { resource: 'document', id: detail.params.id })
 *     return false
 *   }
 *   return true
 * }
 *
 * const routes = {
 *   '/document/:id': createProtectedRoute({
 *     component: () => import('./DocumentEditor.svelte'),
 *     authorizationCallback: checkDocumentAccess
 *   })
 * }
 *
 * // Both role-based AND resource-based
 * const routes = {
 *   '/document/:id/edit': createProtectedRoute({
 *     component: () => import('./DocumentEditor.svelte'),
 *     permissions: { any: ['editor', 'admin'] },         // Checked first (fast)
 *     authorizationCallback: checkDocumentAccess         // Checked second (API call)
 *   })
 * }
 * ```
 */
export function createProtectedRoute(options) {
    const definition = createProtectedRouteDefinition(options)
    return wrap(definition)
}

/**
 * Check if current user has specific permissions
 * Useful for showing/hiding UI elements
 *
 * @param {Object} requirements - Permission requirements
 * @returns {boolean} True if user has required permissions
 *
 * @example
 * ```svelte
 * <script>
 * import { hasPermission } from 'svelte-spa-router-5/helpers/permissions'
 * </script>
 *
 * {#if hasPermission({ any: ['admin.read'] })}
 *   <button>Admin Panel</button>
 * {/if}
 * ```
 */
export function hasPermission(requirements) {
    const user = currentUserGetter()
    return permissionChecker(user, requirements)
}

/**
 * Get configured unauthorized behavior mode
 * @returns {'component'|'navigate'} The configured behavior
 */
export function getUnauthorizedBehavior() {
    return unauthorizedBehavior
}

/**
 * Get configured unauthorized route path
 * @returns {string} The unauthorized route path
 */
export function getUnauthorizedRoute() {
    return unauthorizedRoute
}

/**
 * Get configured unauthorized component
 * @returns {any} The unauthorized component
 */
export function getUnauthorizedComponent() {
    return unauthorizedComponent
}

/**
 * Get configured unauthorized handler
 * @returns {Function} The unauthorized handler callback
 */
export function getUnauthorizedHandler() {
    return unauthorizedHandler
}

/**
 * Check if onUnauthorized callback was explicitly configured
 * @returns {boolean} True if onUnauthorized was provided in configurePermissions
 */
export function hasExplicitHandler() {
    return hasExplicitUnauthorizedHandler
}
