import { hierarchyLogger } from '../logger.ts'
/**
 * @module helpers/hierarchy
 *
 * Provides utilities for defining routes in a hierarchical tree structure
 * as an alternative to flat route definitions.
 *
 * Features:
 * - Nested route definitions with `children` property
 * - Relative child paths (automatically concatenated to parent)
 * - Automatic inheritance (breadcrumbs, permissions, conditions, authorization)
 * - Optional route names for programmatic navigation
 *
 * @example
 * import { createHierarchy } from '@keenmate/svelte-spa-router/helpers/hierarchy'
 *
 * const routes = createHierarchy({
 *     '/documents': {
 *         component: DocumentsLayout,
 *         breadcrumbs: [{ label: 'Documents' }],
 *         children: {
 *             ':id': {
 *                 name: 'documentDetail',
 *                 component: DocumentDetail,
 *                 breadcrumbs: [{ label: 'Detail' }],
 *                 children: {
 *                     'logs': {
 *                         component: DocumentLogs,
 *                         breadcrumbs: [{ label: 'Logs' }]
 *                     }
 *                 }
 *             }
 *         }
 *     }
 * })
 */

import { wrap } from '../wrap.js'
import { registerRoute } from '../routes.svelte.js'

/**
 * Transforms a hierarchical route tree into a flat routes object.
 *
 * Child routes automatically inherit metadata from parents:
 * - Breadcrumbs are concatenated (parent + child)
 * - Permissions are checked sequentially (parent AND child)
 * - Conditions execute in order (parent → child)
 * - Authorization callbacks chain (parent → child)
 *
 * @param {Object} tree - Hierarchical route definition
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.enableHierarchical=true] - Enable hierarchical inheritance
 * @returns {Object} Flat routes object compatible with Router component
 *
 * @example
 * const routes = createHierarchy({
 *     '/users': {
 *         component: UsersList,
 *         children: {
 *             ':id': {
 *                 name: 'userDetail',
 *                 component: UserDetail
 *             }
 *         }
 *     }
 * })
 * // Result: { '/users': UsersList, '/users/:id': UserDetail }
 * // Routes are automatically wrapped with inheritance enabled
 */
export function createHierarchy(tree, options = {}) {
    const { enableHierarchical = true } = options
    const flatRoutes = {}
    const visited = new Set() // Prevent infinite loops

    /**
     * Recursively transforms tree nodes into flat route definitions
     *
     * @param {Object} node - Current tree node
     * @param {string} parentPath - Accumulated parent path
     * @param {string} nodePath - Current node's path segment
     */
    function transformNode(node, parentPath, nodePath) {
        // Construct absolute path
        const absolutePath = joinPaths(parentPath, nodePath)

        // Circular reference protection
        if (visited.has(absolutePath)) {
            console.warn(`[createHierarchy] Circular reference detected: ${absolutePath}`)
            return
        }
        visited.add(absolutePath)

        // Extract route definition and children
        const { children, name, breadcrumbs, title, routeContext, ...routeDefinition } = node

        // Merge breadcrumbs and title into routeContext (same pattern as createRoute)
        const mergedRouteContext = {
            ...(routeContext || {})
        }

        if (title) {
            mergedRouteContext.title = title
        }

        if (breadcrumbs) {
            mergedRouteContext.breadcrumbs = breadcrumbs
        }

        // Wrap the route with inheritance enabled
        const wrappedRoute = wrap({
            ...routeDefinition,
            routeContext: Object.keys(mergedRouteContext).length > 0 ? mergedRouteContext : undefined,
            // Force inheritance flags to true in tree mode
            inheritBreadcrumbs: enableHierarchical,
            inheritPermissions: enableHierarchical,
            inheritConditions: enableHierarchical,
            inheritAuthorization: enableHierarchical
        })

        // Register named route if name provided
        if (name) {
            registerRoute(name, absolutePath)
        }

        // Add to flat routes
        flatRoutes[absolutePath] = wrappedRoute

        // Recursively process children
        if (children && typeof children === 'object') {
            for (const [childPath, childNode] of Object.entries(children)) {
                transformNode(childNode, absolutePath, childPath)
            }
        }
    }

    // Transform each root path
    for (const [path, node] of Object.entries(tree)) {
        transformNode(node, '', path)
    }

    return flatRoutes
}

/**
 * Joins path segments, handling leading/trailing slashes correctly
 *
 * @param {string} parent - Parent path
 * @param {string} child - Child path segment (relative)
 * @returns {string} Joined absolute path
 *
 * @example
 * joinPaths('/users', ':id') // '/users/:id'
 * joinPaths('/users', '/settings') // '/users/settings' (leading slash stripped)
 * joinPaths('', '/users') // '/users'
 */
function joinPaths(parent, child) {
    // Handle root case
    if (!parent || parent === '') {
        return child.startsWith('/') ? child : '/' + child
    }

    // Normalize parent (ensure leading slash, remove trailing slash)
    const normalizedParent = parent.startsWith('/') ? parent : '/' + parent
    const cleanParent = normalizedParent.endsWith('/')
        ? normalizedParent.slice(0, -1)
        : normalizedParent

    // Normalize child (remove leading slash if present)
    const cleanChild = child.startsWith('/') ? child.slice(1) : child

    // Special case: catch-all route
    if (cleanChild === '*') {
        return cleanParent + '/*'
    }

    // Join with single slash
    return cleanParent + '/' + cleanChild
}
