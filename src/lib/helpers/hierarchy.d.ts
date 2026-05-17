/**
 * Type definitions for hierarchical route structure utilities
 */

import type { BreadcrumbItem, RoutePrecondition, WrappedComponent } from '../wrap';

/**
 * Hierarchical route node definition
 * Extends standard route options with children and optional name
 */
export interface HierarchyNode {
    /** Component (sync) or async import function (incompatible with zones) */
    component?: any | (() => Promise<any>);
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
     * If true, mounts the route component but keeps it hidden under
     * `loadingComponent` until the component itself calls `hideLoading()`.
     * **You must call hideLoading()** — typically at the end of an `onMount`
     * data-fetch — or the page stays blank forever. Dev-mode `console.warn`
     * after 10s. See `wrap.d.ts` for details.
     */
    shouldDisplayLoadingOnRouteLoad?: boolean;
    /** Optional route name for programmatic navigation */
    name?: string;
    /** Nested child routes */
    children?: HierarchyTree;
}

/**
 * Hierarchical route tree structure
 * Keys are relative path segments, values are route nodes
 */
export interface HierarchyTree {
    [path: string]: HierarchyNode;
}

/**
 * Options for createHierarchy function
 */
export interface CreateHierarchyOptions {
    /** Enable hierarchical inheritance (default: true) */
    enableHierarchical?: boolean;
}

/**
 * Transforms a hierarchical route tree into a flat routes object.
 *
 * Child routes automatically inherit metadata from parents:
 * - Breadcrumbs are concatenated (parent + child)
 * - Permissions are checked sequentially (parent AND child)
 * - Conditions execute in order (parent → child)
 * - Authorization callbacks chain (parent → child)
 *
 * @param tree - Hierarchical route definition
 * @param options - Configuration options
 * @returns Flat routes object compatible with Router component
 *
 * @example
 * ```typescript
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
 * // Result: { '/documents': ..., '/documents/:id': ..., '/documents/:id/logs': ... }
 * ```
 */
export function createHierarchy(
    tree: HierarchyTree,
    options?: CreateHierarchyOptions
): Record<string, WrappedComponent>;
