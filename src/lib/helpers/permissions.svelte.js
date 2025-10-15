/**
 * Permission checking utilities for route guards
 *
 * This module provides a flexible permission system that works with wrap() conditions.
 * You can customize the permission checking logic to match your authentication system.
 */

/**
 * Global permission checker function
 * Override this with your own implementation
 *
 * @type {(user: any, requirements: any) => boolean}
 */
let permissionChecker = (user, requirements) => {
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

        if (!hasPermission) {
            // Store the attempted route in userData for potential redirect after login
            detail.userData = detail.userData || {}
            detail.userData.deniedRoute = detail.location

            unauthorizedHandler(detail)
            return false
        }

        return true
    }
}

/**
 * Helper to create routes with permissions using wrap()
 * This is a convenience function that combines component loading with permission checks
 *
 * @param {Object} options - Route options
 * @param {Function} options.component - Async component import function
 * @param {Object} [options.permissions] - Permission requirements
 * @param {string[]} [options.permissions.any] - User needs at least one
 * @param {string[]} [options.permissions.all] - User needs all
 * @param {any} [options.loadingComponent] - Loading component to show
 * @param {Object} [options.props] - Additional props to pass to component
 * @param {any} [options.userData] - Additional user data to attach
 * @returns {Object} Wrapped route configuration
 *
 * @example
 * ```javascript
 * import { createProtectedRoute } from 'svelte-spa-router-5/helpers/permissions'
 *
 * const routes = {
 *   '/admin': createProtectedRoute({
 *     component: () => import('./Admin.svelte'),
 *     permissions: { any: ['admin.read'] },
 *     loadingComponent: Loading
 *   })
 * }
 * ```
 */
export function createProtectedRoute(options) {
    const {
        component,
        permissions,
        loadingComponent,
        props,
        userData,
        ...restOptions
    } = options

    const wrapOptions = {
        asyncComponent: component,
        ...restOptions
    }

    if (loadingComponent) {
        wrapOptions.loadingComponent = loadingComponent
    }

    if (props) {
        wrapOptions.props = props
    }

    // Merge user data
    wrapOptions.userData = {
        ...(userData || {}),
        permissions: permissions || {}
    }

    // Add permission condition if permissions specified
    if (permissions) {
        wrapOptions.conditions = wrapOptions.conditions || []
        wrapOptions.conditions.push(createPermissionCondition(permissions))
    }

    // Note: We can't import wrap here to avoid circular dependency
    // User must import wrap themselves
    return wrapOptions
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
