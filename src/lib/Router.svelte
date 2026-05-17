<script>
/**
 * Router2.svelte - Simplified router with clean pipeline architecture
 *
 * Philosophy:
 * - Router uses WATERFALL/PIPELINE approach for navigation
 * - Effect READS reactive inputs only (location, querystring)
 * - Pipeline processes everything using plain JavaScript objects
 * - Single commitToReactiveState() writes ALL reactive state at the end
 * - Minimal untrack() usage (only at commit boundary)
 * - Clear separation: read → transform → commit
 * - One effect per concern (routing, scroll restoration)
 *
 * Pipeline Flow:
 *   location change → createPipelineContext()
 *                  → pipelineMatchRoute()
 *                  → pipelineCheckGuards()
 *                  → pipelineCheckConditions()
 *                  → pipelineLoadComponent() / pipelineLoadZoneComponents()
 *                  → pipelineComposeBreadcrumbs()
 *                  → pipelineComputeMetadata()
 *                  → pipelineCalculateReferrer()
 *                  → commitToReactiveState()
 *                  → dispatch events
 */

import { parse } from './parse-route.js'
import { tick, untrack } from 'svelte'
import { location, querystring, routeParams, setParams, getHierarchicalRoutesEnabled, navigationContext, getRawNavigationContext, setNavigationContext, getIncludeReferrer, restoreScroll, getZoneComponent, setZoneComponents, registerRevalidationListener } from './utils.svelte.js'
import { runBeforeLeaveGuards } from './helpers/navigation-guard.svelte.js'
import { updateRouteMetadata, getUpdatedBreadcrumb, startRouteLoading, waitForRouteReady } from './helpers/route-metadata.svelte.js'
import { getUnauthorizedBehavior, getUnauthorizedRoute, getUnauthorizedComponent, getUnauthorizedHandler, hasExplicitHandler, getRevalidationFailureHandler } from './helpers/permissions.svelte.js'
import { routerLogger, scrollLogger, guardsLogger, conditionsLogger, hierarchyLogger, zonesLogger } from './logger.ts'

// Component props
let {
    /**
     * Dictionary of all routes, in the format `'/path': component`.
     */
    routes = {},
    /**
     * Optional prefix for the routes in this router.
     */
    prefix = '',
    /**
     * Optional zone name for multi-zone routing. When set, this router instance only renders the component for this zone.
     */
    zone = '',
    /**
     * If set to true, the router will restore scroll positions on back navigation
     * and scroll to top on forward navigation.
     */
    restoreScrollState = false,
    /**
     * Event handlers
     */
    onRouteLoading,
    onRouteLoaded,
    onConditionsFailed,
    onNotFound
} = $props()

/**
 * Simple route item for matching
 */
class RouteItem {
    constructor(path, component) {
        if (!component || (typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true))) {
            throw Error('Invalid component object')
        }

        if (!path || (typeof path == 'string' && (path.length < 1 || (path.charAt(0) != '/' && path.charAt(0) != '*')))) {
            throw Error('Invalid value for "path" argument - strings must start with / or *')
        }

        const { pattern, keys } = parse(path)

        this.path = path
        this._pattern = pattern
        this._keys = keys

        // Handle wrapped components
        if (typeof component == 'object' && component._sveltesparouter === true) {
            // Check if this is a zone-based route
            if (component._isZoneMode) {
                this.zones = component.zones
                this.component = null
                this.isZoneMode = true
            } else {
                this.component = component.component
                this.isZoneMode = false
            }
            this.conditions = component.conditions || []
            this.props = component.props || {}
            this.routeContext = component.routeContext
            this.shouldDisplayLoadingOnRouteLoad = component.shouldDisplayLoadingOnRouteLoad || false
            // Store inheritance flags
            this.inheritBreadcrumbs = component.inheritBreadcrumbs !== undefined ? component.inheritBreadcrumbs : true
            this.inheritPermissions = component.inheritPermissions !== undefined ? component.inheritPermissions : true
            this.inheritConditions = component.inheritConditions !== undefined ? component.inheritConditions : true
            this.inheritAuthorization = component.inheritAuthorization !== undefined ? component.inheritAuthorization : true
        } else {
            // Normalize to async function
            this.component = () => Promise.resolve(component)
            this.zones = null
            this.isZoneMode = false
            this.conditions = []
            this.props = {}
            this.routeContext = undefined
            this.shouldDisplayLoadingOnRouteLoad = false
            this.inheritBreadcrumbs = true
            this.inheritPermissions = true
            this.inheritConditions = true
            this.inheritAuthorization = true
        }
    }

    /**
     * Check if path matches this route
     * Returns params object or null
     */
    match(path) {
        // Handle prefix
        if (prefix) {
            if (typeof prefix == 'string') {
                if (path.startsWith(prefix)) {
                    path = path.substr(prefix.length) || '/'
                } else {
                    return null
                }
            }
        }

        const matches = this._pattern.exec(path)
        if (matches === null) {
            return null
        }

        if (this._keys === false) {
            return matches
        }

        // Extract params
        const out = {}
        let i = 0
        while (i < this._keys.length) {
            try {
                out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null
            } catch (e) {
                out[this._keys[i]] = null
            }
            i++
        }
        return out
    }

    /**
     * Check all conditions for this route
     */
    async checkConditions(detail) {
        for (let i = 0; i < this.conditions.length; i++) {
            if (!(await this.conditions[i](detail))) {
                return false
            }
        }
        return true
    }
}

// Parse routes into RouteItem objects.
// $derived.by() captures `routes` in a closure so the list rebuilds if the
// prop is ever swapped, and silences Svelte's state_referenced_locally warning.
const routesList = $derived.by(() => {
    const list = []
    if (routes instanceof Map) {
        routes.forEach((route, path) => {
            list.push(new RouteItem(path, route))
        })
    } else {
        Object.keys(routes).forEach((path) => {
            list.push(new RouteItem(path, routes[path]))
        })
    }
    routerLogger.debug('Initialized with', list.length, 'routes')
    return list
})

/**
 * Find parent route for hierarchical inheritance
 * Matches by path pattern - finds longest matching parent path
 */
function findParentRoute(childPath) {
    if (!getHierarchicalRoutesEnabled()) {
        return null
    }

    // Don't look for parent of catch-all route
    if (childPath === '*') {
        return null
    }

    // Find potential parent paths by removing segments
    const segments = childPath.split('/').filter(s => s.length > 0)

    // Try progressively shorter paths (longest match first)
    for (let i = segments.length - 1; i > 0; i--) {
        const parentPath = '/' + segments.slice(0, i).join('/')

        // Find route with this path
        const parentRoute = routesList.find(r => r.path === parentPath)
        if (parentRoute) {
            return parentRoute
        }
    }

    return null
}

/**
 * Build complete hierarchy chain from root to current route
 */
function getRouteHierarchy(route) {
    if (!getHierarchicalRoutesEnabled()) {
        return [route]
    }

    const hierarchy = []
    let current = route
    let visited = new Set()

    // Build hierarchy bottom-up
    while (current) {
        // Check for circular reference
        if (visited.has(current.path)) {
            hierarchyLogger.warn('Circular route hierarchy detected for path:', current.path)
            break
        }
        visited.add(current.path)

        hierarchy.unshift(current) // Add to front
        current = findParentRoute(current.path)
    }

    return hierarchy
}

/**
 * Compose breadcrumbs from route hierarchy
 */
function composeBreadcrumbs(route) {
    if (!getHierarchicalRoutesEnabled() || !route.inheritBreadcrumbs) {
        // Return only this route's breadcrumbs
        return route.routeContext?.breadcrumbs || []
    }

    const hierarchy = getRouteHierarchy(route)
    const breadcrumbs = []

    for (const r of hierarchy) {
        // Skip if this route opts out of inheriting breadcrumbs
        if (r === route && !route.inheritBreadcrumbs) {
            // Only use this route's breadcrumbs
            return r.routeContext?.breadcrumbs || []
        }

        // Add breadcrumbs from this level
        if (r.routeContext?.breadcrumbs) {
            breadcrumbs.push(...r.routeContext.breadcrumbs)
        }
    }

    // Apply any cached manual updates to breadcrumbs with IDs
    return breadcrumbs.map(crumb => {
        if (crumb.id) {
            const cachedUpdate = getUpdatedBreadcrumb(crumb.id)
            if (cachedUpdate) {
                return { ...crumb, ...cachedUpdate }
            }
        }
        return crumb
    })
}

// Component state
let component = $state(null)
let componentParams = $state(null)
let componentProps = $state({})
let currentRouteItem = $state(null)

// Loading state
let loadingComponent = $state(null)
let loadingParams = $state(null)
let isWaitingForData = $state(false)

// Track loading state to handle race conditions
let loadingId = 0

// Track current route state (used for both beforeLeave guards and referrer tracking)
let currentRoute = $state(null)
let currentQuerystring = $state('')
let currentParams = $state({})
let currentRouteName = $state(null)
let isCurrentRouteCatchAll = $state(false) // Track if we're on a catch-all route

// Track previous route state for referrer calculation
// This is updated AFTER navigation completes to avoid stale values during popstate
let previousRoute = $state(null)
let previousQuerystring = $state('')
let previousParams = $state({})
let previousRouteName = $state(null)
let isPreviousRouteCatchAll = $state(false)

// Previous scroll state for restoration
let previousScrollState = $state(null)

// For zone-based routing: get component from zone state if zone prop is set
let zoneComponentData = $derived(zone ? getZoneComponent(zone) : null)

// Dispatch helper
function dispatchEvent(name, detail) {
    if (name === 'routeLoading' && onRouteLoading) {
        onRouteLoading({ detail })
    } else if (name === 'routeLoaded' && onRouteLoaded) {
        onRouteLoaded({ detail })
    } else if (name === 'conditionsFailed' && onConditionsFailed) {
        onConditionsFailed({ detail })
    } else if (name === 'notFound' && onNotFound) {
        onNotFound({ detail })
    }
}

async function dispatchNextTick(name, detail) {
    await tick()
    dispatchEvent(name, detail)
}

/**
 * Pure function: Find matching route for location
 * No side effects, just returns the match
 */
function findMatchingRoute(loc) {
    for (let i = 0; i < routesList.length; i++) {
        const match = routesList[i].match(loc)
        if (match !== null) {
            return {
                routeItem: routesList[i],
                params: match,
                location: loc
            }
        }
    }
    return null
}

/**
 * @typedef {Object} PipelineContext
 * Pipeline context - carries all state through the pipeline
 * This is a plain JavaScript object (not reactive)
 *
 * @property {string} location - Target location
 * @property {string} querystring - Target querystring
 * @property {any} incomingContext - Navigation context from push/replace
 * @property {string|null} incomingRouteName - Route name if navigating via named route
 * @property {number} loadingId - Unique ID for this navigation (race condition detection)
 * @property {number} timestamp - When this navigation started
 * @property {object|null} match - Route match result {routeItem, params, location}
 * @property {boolean} canLeave - Result of beforeLeave guards
 * @property {boolean} conditionsPassed - Result of route conditions check
 * @property {any|null} component - Loaded component
 * @property {any|null} loadingComponent - Loading component if present
 * @property {any|null} loadingParams - Props for loading component
 * @property {object|null} zoneComponents - Zone components for zone-based routes
 * @property {array} composedBreadcrumbs - Hierarchically composed breadcrumbs
 * @property {object} metadata - Route metadata
 * @property {any|null} updatedNavigationContext - Updated navigation context with referrer
 * @property {string|null} resultType - 'notFound'|'conditionsFailed'|'zone'|'component'|'cancelled'
 * @property {boolean} isCatchAll - True if this is a catch-all (*) route
 * @property {boolean} shouldWaitForData - True if route needs to wait for hideLoading() signal
 * @property {boolean} shouldDisplayLoadingOnRouteLoad - True if route has custom loading component
 * @property {object} previousRoute - Snapshot of current route for referrer calculation
 * @property {object} componentProps - Props to pass to component
 */

/**
 * Create initial pipeline context from reactive inputs
 * Pure function - reads reactive state but doesn't modify it
 */
function createPipelineContext(loc, qs, incomingContext, currentRouteSnapshot) {
    return {
        // Input state (immutable once created)
        location: loc,
        // Prefix-stripped view of `location`. For a root Router (no prefix) or
        // for paths outside the prefix, equal to `location`. Surfaced on every
        // event payload so nested-router consumers don't have to strip themselves.
        relativeLocation: (typeof prefix === 'string' && prefix && loc.startsWith(prefix))
            ? (loc.substr(prefix.length) || '/')
            : loc,
        querystring: qs,
        incomingContext: incomingContext,
        incomingRouteName: incomingContext?._routeName || null,

        // Pipeline metadata
        loadingId: ++loadingId,  // Increment counter
        timestamp: Date.now(),

        // Route matching result
        match: null,

        // Guard results
        canLeave: true,
        conditionsPassed: false,

        // Loaded resources
        component: null,
        loadingComponent: null,
        loadingParams: null,
        zoneComponents: null,

        // Computed metadata
        composedBreadcrumbs: [],
        metadata: {},
        updatedNavigationContext: null,

        // Result type (determines commit behavior)
        resultType: null,

        // Flags
        isCatchAll: false,
        shouldWaitForData: false,
        shouldDisplayLoadingOnRouteLoad: false,

        // Component props
        componentProps: {},

        // Snapshot of current state (for referrer calculation)
        previousRoute: currentRouteSnapshot
    }
}

/**
 * Commit pipeline results to reactive state
 * This is the ONLY place where reactive state is written (besides effect initialization)
 * Uses untrack() to prevent triggering the routing effect
 */
function commitToReactiveState(ctx) {
    routerLogger.debug('Committing pipeline result:', ctx.resultType)

    // Use untrack to prevent triggering the effect
    untrack(() => {
        switch (ctx.resultType) {
            case 'notFound':
                // Clear component state
                component = null
                componentParams = null
                componentProps = {}
                currentRouteItem = null
                loadingComponent = null
                loadingParams = null

                // Update external state
                setParams(undefined)
                if (ctx.updatedNavigationContext) {
                    setNavigationContext(ctx.updatedNavigationContext)
                }

                // Don't update currentRoute tracking for 404 (keep referrer chain clean)
                // But mark that we're in a "no route" state
                isCurrentRouteCatchAll = false
                break

            case 'conditionsFailed':
                // Clear component state
                component = null
                componentParams = null
                componentProps = {}
                currentRouteItem = null
                loadingComponent = null
                loadingParams = null

                // Update external state
                setParams(undefined)
                // Don't update navigationContext - preserve existing referrer
                // Only successful navigations should update referrer

                // Update currentRoute to the failed route so redirects work correctly
                // Without this, clicking a protected route twice from unauthorized page causes blank page
                currentRoute = ctx.location
                currentQuerystring = ctx.querystring
                isCurrentRouteCatchAll = false
                break

            case 'unauthorized':
                // Show unauthorized component without changing current route (for component mode)
                // or with navigation to unauthorized route (for navigate mode)
                component = ctx.unauthorizedComponent
                componentParams = ctx.unauthorizedParams || {}
                componentProps = ctx.unauthorizedProps || {}
                currentRouteItem = null
                loadingComponent = null
                loadingParams = null

                // Update params
                setParams(undefined)

                // DON'T update navigationContext - preserve referrer
                // Only successful navigations should update referrer

                // Update currentRoute based on mode
                if (ctx.unauthorizedMode === 'navigate') {
                    // Navigate mode: update to unauthorized route
                    currentRoute = ctx.unauthorizedRoute
                    currentQuerystring = ''
                } else {
                    // Component mode: track attempted route to prevent redirect loops
                    currentRoute = ctx.attemptedLocation
                    currentQuerystring = ctx.attemptedQuerystring
                }

                isCurrentRouteCatchAll = false
                break

            case 'zone':
                // Update zone components in shared state
                setZoneComponents(ctx.zoneComponents)

                // Set params
                setParams(ctx.match.params)

                // Update metadata
                updateRouteMetadata(ctx.metadata, ctx.location, ctx.querystring, ctx.match.params)

                // Clear single component state (zone routing doesn't render locally)
                component = null
                componentParams = null
                componentProps = {}
                currentRouteItem = null
                loadingComponent = null
                loadingParams = null

                // Update navigation context with referrer
                if (ctx.updatedNavigationContext) {
                    setNavigationContext(ctx.updatedNavigationContext)
                }

                // Update current route tracking (unless catch-all)
                if (!ctx.isCatchAll) {
                    currentRoute = ctx.location
                    currentQuerystring = ctx.querystring
                    currentParams = ctx.match.params || {}
                    currentRouteName = ctx.incomingRouteName
                    isCurrentRouteCatchAll = false
                } else {
                    // We're on a catch-all route
                    isCurrentRouteCatchAll = true
                }
                break

            case 'component':
                // Update component state
                component = ctx.component
                componentParams = ctx.match.params
                componentProps = ctx.componentProps
                currentRouteItem = ctx.match.routeItem

                // Update loading state
                loadingComponent = ctx.loadingComponent
                loadingParams = ctx.loadingParams
                isWaitingForData = ctx.shouldWaitForData

                // Clear zone components (single component mode)
                setZoneComponents({})

                // Set params
                setParams(ctx.match.params)

                // Update metadata
                updateRouteMetadata(ctx.metadata, ctx.location, ctx.querystring, ctx.match.params)

                // Update navigation context with referrer
                if (ctx.updatedNavigationContext) {
                    setNavigationContext(ctx.updatedNavigationContext)

                    // CRITICAL: Save the calculated navigationContext (with referrer) back to history.state
                    // This ensures when user presses back button, the referrer is restored correctly
                    if (typeof window !== 'undefined' && window.history.state) {
                        try {
                            // Serialize the context to handle Proxy objects in params
                            let serializableContext = ctx.updatedNavigationContext
                            try {
                                // Try structured clone first
                                structuredClone(ctx.updatedNavigationContext)
                            } catch {
                                // If it fails (e.g., Proxy objects), use JSON serialization
                                const jsonString = JSON.stringify(ctx.updatedNavigationContext)
                                serializableContext = JSON.parse(jsonString)
                            }

                            window.history.replaceState({
                                ...window.history.state,
                                __svelte_spa_router_navigation_context: serializableContext
                            }, '')
                        } catch (e) {
                            console.warn('Failed to save navigationContext to history.state:', e)
                        }
                    }
                }

                // Update current route tracking (unless catch-all)
                if (!ctx.isCatchAll) {
                    currentRoute = ctx.location
                    currentQuerystring = ctx.querystring
                    currentParams = ctx.match.params || {}
                    currentRouteName = ctx.incomingRouteName
                    isCurrentRouteCatchAll = false
                } else {
                    // We're on a catch-all route
                    isCurrentRouteCatchAll = true
                }
                break

            case 'cancelled':
                // Race condition detected - do nothing
                routerLogger.debug('Commit cancelled (race condition)')
                break

            default:
                routerLogger.warn('Unknown result type:', ctx.resultType)
                break
        }
    })
}

// ============================================================================
// PURE PIPELINE FUNCTIONS
// ============================================================================

/**
 * Pipeline Step 1: Match route
 * Pure function - no side effects
 */
function pipelineMatchRoute(ctx) {
    // Check if this is navigation to the configured unauthorized route
    const unauthorizedRoute = getUnauthorizedRoute()
    const unauthorizedComponent = getUnauthorizedComponent()

    if (ctx.location === unauthorizedRoute && unauthorizedComponent) {
        // Create a synthetic match for the unauthorized route
        const syntheticMatch = {
            routeItem: {
                path: unauthorizedRoute,
                component: () => unauthorizedComponent,
                checkConditions: () => true,  // Always passes
                props: {},
                isZoneMode: false,
                routeContext: {}
            },
            params: {}
        }
        return { ...ctx, match: syntheticMatch, isUnauthorizedRoute: true }
    }

    const match = findMatchingRoute(ctx.location)
    return { ...ctx, match }
}

/**
 * Pipeline Step 2: Compose breadcrumbs
 * Pure function - wrapper around existing composeBreadcrumbs
 */
function pipelineComposeBreadcrumbs(ctx) {
    if (!ctx.match) {
        return ctx
    }

    const composedBreadcrumbs = composeBreadcrumbs(ctx.match.routeItem)
    return { ...ctx, composedBreadcrumbs }
}

/**
 * Pipeline Step 3: Compute route metadata
 * Pure function - builds metadata object
 */
function pipelineComputeMetadata(ctx) {
    if (!ctx.match) {
        return ctx
    }

    const routeItem = ctx.match.routeItem
    const metadata = {
        ...(routeItem.routeContext || {}),
        breadcrumbs: ctx.composedBreadcrumbs.length > 0
            ? ctx.composedBreadcrumbs
            : (routeItem.routeContext?.breadcrumbs || [])
    }

    return { ...ctx, metadata }
}

/**
 * Pipeline Step 4: Calculate referrer context
 * Pure function - determines referrer based on route type and config
 */
function pipelineCalculateReferrer(ctx) {
    if (!ctx.match) {
        // No match - might inject referrer in 404 handler
        const includeReferrer = getIncludeReferrer()
        const hasReferrer = ctx.previousRoute.location !== null
        const hasExistingReferrer = !!ctx.incomingContext?.referrer

        // Only create new referrer if one doesn't already exist (from back/forward navigation)
        if (!hasExistingReferrer && (includeReferrer === 'notfound' || includeReferrer === 'always') && hasReferrer) {
            return {
                ...ctx,
                updatedNavigationContext: {
                    ...ctx.incomingContext,
                    attemptedRoute: ctx.location,
                    attemptedQuerystring: ctx.querystring,
                    referrer: {
                        location: ctx.previousRoute.location,
                        querystring: ctx.previousRoute.querystring,
                        params: ctx.previousRoute.params,
                        routeName: ctx.previousRoute.routeName,
                        scrollX: ctx.previousRoute.scrollX,
                        scrollY: ctx.previousRoute.scrollY
                    }
                }
            }
        }
        return ctx
    }

    const includeReferrer = getIncludeReferrer()
    const isCatchAll = ctx.match.routeItem.path === '*'
    const hasReferrer = ctx.previousRoute.location !== null
    const hasExistingReferrer = !!ctx.incomingContext?.referrer

    let updatedContext = ctx.incomingContext

    // Only create new referrer if one doesn't already exist (from back/forward navigation)
    if (!hasExistingReferrer) {
        if (isCatchAll && (includeReferrer === 'notfound' || includeReferrer === 'always') && hasReferrer) {
            // Catch-all route: inject referrer with attemptedRoute
            hierarchyLogger.debug('Catch-all route - Injecting referrer:', ctx.previousRoute.location)
            updatedContext = {
                ...updatedContext,
                attemptedRoute: ctx.location,
                attemptedQuerystring: ctx.querystring,
                referrer: {
                    location: ctx.previousRoute.location,
                    querystring: ctx.previousRoute.querystring,
                    params: ctx.previousRoute.params,
                    routeName: ctx.previousRoute.routeName,
                    scrollX: ctx.previousRoute.scrollX,
                    scrollY: ctx.previousRoute.scrollY
                }
            }
        } else if (!isCatchAll && includeReferrer === 'always' && hasReferrer) {
            // Regular route: inject referrer if 'always' mode
            updatedContext = {
                ...updatedContext,
                referrer: {
                    location: ctx.previousRoute.location,
                    querystring: ctx.previousRoute.querystring,
                    params: ctx.previousRoute.params,
                    routeName: ctx.previousRoute.routeName,
                    scrollX: ctx.previousRoute.scrollX,
                    scrollY: ctx.previousRoute.scrollY
                }
            }
        }
    }

    return {
        ...ctx,
        updatedNavigationContext: updatedContext,
        isCatchAll
    }
}

/**
 * Pipeline Step 5: Determine result type
 * Pure function - categorizes the navigation result
 */
function pipelineDetermineResultType(ctx) {
    // Already set by zone/component loaders
    if (ctx.resultType) {
        return ctx
    }

    // Not found
    if (!ctx.match) {
        return { ...ctx, resultType: 'notFound' }
    }

    // Permission failure - check if we should use unauthorized state
    if (!ctx.conditionsPassed && ctx.isPermissionFailure) {
        const unauthorizedHandler = getUnauthorizedHandler()
        const unauthorizedComponent = getUnauthorizedComponent()
        const unauthorizedBehavior = getUnauthorizedBehavior()
        const unauthorizedRoute = getUnauthorizedRoute()

        conditionsLogger.debug('Detected permission failure - checking unauthorized handling', {
            hasExplicitHandler: hasExplicitHandler(),
            unauthorizedComponent: !!unauthorizedComponent,
            unauthorizedBehavior,
            unauthorizedRoute
        })

        // Priority 1: If onUnauthorized callback was explicitly configured, use old behavior (conditionsFailed)
        // The callback will be called and handle the redirect
        if (hasExplicitHandler()) {
            conditionsLogger.debug('Using explicit onUnauthorized handler')
            return { ...ctx, resultType: 'conditionsFailed' }
        }

        // Priority 2: Use configured unauthorized behavior
        if (unauthorizedComponent) {
            conditionsLogger.debug('Using unauthorized component', { mode: unauthorizedBehavior })
            const user = ctx.match.routeItem.routeContext?.userData
            const failedPermissions = ctx.match.routeItem.routeContext?.permissions

            return {
                ...ctx,
                resultType: 'unauthorized',
                unauthorizedMode: unauthorizedBehavior,
                unauthorizedRoute,
                unauthorizedComponent,
                unauthorizedParams: {},
                unauthorizedProps: {
                    attemptedRoute: ctx.match.routeItem.path,
                    attemptedLocation: ctx.location,
                    attemptedQuerystring: ctx.querystring,
                    attemptedParams: ctx.match.params,
                    failedPermissions,
                    user,
                    referrer: ctx.previousRoute
                },
                attemptedLocation: ctx.location,
                attemptedQuerystring: ctx.querystring
            }
        }
    }

    // Other conditions failed (not permission-related)
    if (!ctx.conditionsPassed) {
        return { ...ctx, resultType: 'conditionsFailed' }
    }

    return ctx
}

// ============================================================================
// END PURE PIPELINE FUNCTIONS
// ============================================================================

// ============================================================================
// ASYNC PIPELINE FUNCTIONS
// ============================================================================

/**
 * Pipeline Step: Check beforeLeave guards
 * Async function - may have side effect of reverting browser history
 */
async function pipelineCheckGuards(ctx) {
    if (!ctx.previousRoute.location || ctx.previousRoute.location === ctx.location) {
        return { ...ctx, canLeave: true }
    }

    const canLeave = await runBeforeLeaveGuards({
        from: ctx.previousRoute.location,
        to: ctx.location,
        params: ctx.previousRoute.params,
        querystring: ctx.previousRoute.querystring
    })

    return { ...ctx, canLeave }
}

/**
 * Pipeline Step: Check route conditions
 * Async function - executes route condition checks
 */
async function pipelineCheckConditions(ctx) {
    if (!ctx.match) {
        return ctx // No match, skip
    }

    const detail = {
        route: ctx.match.routeItem.path,
        location: ctx.location,
        querystring: ctx.querystring,
        params: ctx.match.params,
        userData: ctx.match.routeItem.routeContext?.userData
    }

    const conditionsPassed = await ctx.match.routeItem.checkConditions(detail)

    // Check if this was a permission failure
    // (permissions are stored in routeContext by createProtectedRoute)
    const hasPermissions = ctx.match.routeItem.routeContext?.permissions
    const isPermissionFailure = !conditionsPassed && hasPermissions

    conditionsLogger.debug('Permission check:', {
        conditionsPassed,
        hasPermissions,
        isPermissionFailure,
        routeContext: ctx.match.routeItem.routeContext
    })

    return { ...ctx, conditionsPassed, isPermissionFailure }
}

/**
 * Pipeline Step: Load single component
 * Async function - loads the route's component
 */
async function pipelineLoadComponent(ctx) {
    if (!ctx.match || !ctx.conditionsPassed) {
        return ctx
    }

    const routeItem = ctx.match.routeItem
    const componentLoader = routeItem.component

    // Extract loading component info
    const loadingComponent = componentLoader.loading || null
    const loadingParams = componentLoader.loadingParams || null

    // Load component
    const loadedComponent = await componentLoader()
    const component = (loadedComponent && loadedComponent.default) || loadedComponent

    routerLogger.debug('Route loaded successfully:', routeItem.path)

    // Check race condition
    if (ctx.loadingId !== loadingId) {
        routerLogger.debug('Component load cancelled (newer navigation)')
        return { ...ctx, resultType: 'cancelled' }
    }

    return {
        ...ctx,
        component,
        loadingComponent,
        loadingParams,
        componentProps: routeItem.props || {},
        shouldDisplayLoadingOnRouteLoad: routeItem.shouldDisplayLoadingOnRouteLoad || false,
        resultType: 'component'
    }
}

/**
 * Pipeline Step: Load zone components in parallel
 * Async function - loads all zone components
 */
async function pipelineLoadZoneComponents(ctx) {
    if (!ctx.match || !ctx.conditionsPassed) {
        return ctx
    }

    const routeItem = ctx.match.routeItem
    if (!routeItem.isZoneMode) {
        return ctx
    }

    const zoneComponents = {}
    const zones = routeItem.zones

    // Load all zone components in parallel
    await Promise.all(
        Object.entries(zones).map(async ([zoneName, zoneLoader]) => {
            const loaded = await zoneLoader()
            zoneComponents[zoneName] = {
                component: (loaded && loaded.default) || loaded,
                params: ctx.match.params,
                props: routeItem.props || {},
                routeContext: routeItem.routeContext || {}
            }
        })
    )

    zonesLogger.debug('Zone components loaded:', Object.keys(zoneComponents))

    // Check race condition
    if (ctx.loadingId !== loadingId) {
        zonesLogger.debug('Zone load cancelled (newer navigation)')
        return { ...ctx, resultType: 'cancelled' }
    }

    return {
        ...ctx,
        zoneComponents,
        resultType: 'zone'
    }
}

// ============================================================================
// END ASYNC PIPELINE FUNCTIONS
// ============================================================================

// ============================================================================
// MAIN PIPELINE ORCHESTRATION
// ============================================================================

/**
 * Main routing pipeline
 * Processes navigation through pure/async functions, then commits at the end
 * This is the waterfall/pipeline approach
 */
async function runRoutingPipeline(loc, qs, incomingContext, currentRouteSnapshot, options = {}) {
    const revalidationOnly = options.revalidationOnly === true
    routerLogger.debug(revalidationOnly ? 'Revalidating route at:' : 'Running pipeline for:', loc)

    // Phase 1: Create pipeline context (plain JS object, not reactive)
    let ctx = createPipelineContext(loc, qs, incomingContext, currentRouteSnapshot)

    // Phase 2: Match route (pure)
    ctx = pipelineMatchRoute(ctx)

    // Early exit: No match (404)
    if (!ctx.match) {
        if (revalidationOnly) {
            // Current location stopped matching any route — unusual, but skip
            // the destructive notFound commit since we're not navigating.
            routerLogger.debug('Revalidation: no route matched, skipping')
            return
        }
        routerLogger.debug('No route matched')
        ctx = pipelineCalculateReferrer(ctx)
        ctx = pipelineDetermineResultType(ctx)
        commitToReactiveState(ctx)
        await dispatchNextTick('notFound', {
            location: ctx.location,
            relativeLocation: ctx.relativeLocation,
            querystring: ctx.querystring
        })
        return
    }

    // Catch-all match is semantically also a 404. Fire onNotFound so consumers
    // can log/track unmatched routes even when a '*' route is configured to
    // render a 404 component. The catch-all still renders (pipeline continues).
    // Skip during revalidation — the 404 was already reported on initial nav.
    if (ctx.match.routeItem.path === '*' && !revalidationOnly) {
        routerLogger.debug('Catch-all route matched - firing notFound')
        await dispatchNextTick('notFound', {
            location: ctx.location,
            relativeLocation: ctx.relativeLocation,
            querystring: ctx.querystring
        })
    }

    // Phase 3: Check navigation guards (async, may have side effects)
    // Skip beforeLeave guards during revalidation — the user isn't navigating
    // away, just having their current route's authorization re-checked.
    if (revalidationOnly) {
        ctx.canLeave = true
    } else {
        ctx = await pipelineCheckGuards(ctx)
    }

    if (!ctx.canLeave) {
        guardsLogger.debug('Navigation cancelled by beforeLeave guard')
        // Revert browser history
        if (typeof window !== 'undefined' && window.history) {
            const fullPath = ctx.previousRoute.location + (ctx.previousRoute.querystring ? '?' + ctx.previousRoute.querystring : '')
            // Check if we're in hash mode or history mode
            if (ctx.location.startsWith('#')) {
                window.location.hash = fullPath
            } else {
                window.history.pushState({}, '', fullPath)
            }
        }
        return // Early exit
    }

    // Dispatch loading event (skip during revalidation — nothing is loading)
    if (!revalidationOnly) {
        await dispatchNextTick('routeLoading', {
            route: ctx.match.routeItem.path,
            location: ctx.location,
            relativeLocation: ctx.relativeLocation,
            querystring: ctx.querystring,
            params: ctx.match.params
        })
    }

    // Phase 4: Check route conditions (async)
    ctx = await pipelineCheckConditions(ctx)

    // Race condition check
    if (ctx.loadingId !== loadingId) {
        conditionsLogger.debug('Pipeline cancelled (newer navigation)')
        return
    }

    if (!ctx.conditionsPassed) {
        conditionsLogger.debug('Route conditions failed')
        ctx = pipelineDetermineResultType(ctx)

        // Revalidation failure: if the consumer configured a custom handler,
        // let it run instead of the standard unauthorized handling. The
        // conditionsFailed event still fires for consistency with navigation.
        if (revalidationOnly) {
            await dispatchNextTick('conditionsFailed', {
                route: ctx.match.routeItem.path,
                location: ctx.location,
                relativeLocation: ctx.relativeLocation,
                querystring: ctx.querystring,
                params: ctx.match.params
            })

            const handler = getRevalidationFailureHandler()
            if (handler) {
                try {
                    await handler({
                        route: ctx.match.routeItem.path,
                        location: ctx.location,
                        relativeLocation: ctx.relativeLocation,
                        querystring: ctx.querystring,
                        params: ctx.match.params,
                        // isPermissionFailure is internally truthy-typed (the permissions
                        // object) — coerce to a proper boolean for the public callback.
                        isPermissionFailure: !!ctx.isPermissionFailure
                    })
                } catch (err) {
                    routerLogger.error('onRevalidationFailure threw, falling back to standard unauthorized handling:', err)
                    // Fall through to standard unauthorized handling below
                    return runStandardUnauthorizedHandling()
                }
                return
            }

            return runStandardUnauthorizedHandling()

            async function runStandardUnauthorizedHandling() {
                if (ctx.resultType === 'unauthorized' && ctx.unauthorizedMode === 'navigate') {
                    const { push } = await import('./utils.svelte.js')
                    push(ctx.unauthorizedRoute)
                    return
                }
                if (ctx.resultType === 'conditionsFailed' || ctx.resultType === 'unauthorized') {
                    commitToReactiveState(ctx)
                }
            }
        }

        // Handle unauthorized state specially for navigate mode
        if (ctx.resultType === 'unauthorized' && ctx.unauthorizedMode === 'navigate') {
            // For navigate mode, trigger actual navigation to unauthorized route
            const { push } = await import('./utils.svelte.js')
            push(ctx.unauthorizedRoute)
            return  // Let the navigation to unauthorized route proceed normally
        }

        // For component mode or other failures, commit immediately
        commitToReactiveState(ctx)

        if (ctx.resultType === 'unauthorized') {
            await dispatchNextTick('conditionsFailed', {
                route: ctx.match.routeItem.path,
                location: ctx.location,
                relativeLocation: ctx.relativeLocation,
                querystring: ctx.querystring,
                params: ctx.match.params
            })
        } else {
            await dispatchNextTick('conditionsFailed', {
                route: ctx.match.routeItem.path,
                location: ctx.location,
                relativeLocation: ctx.relativeLocation,
                querystring: ctx.querystring,
                params: ctx.match.params
            })
        }
        return
    }

    // Revalidation passed — current route still authorized, nothing to do.
    // Skip the commit/load phases so the mounted component keeps its state
    // (no flicker, no scroll reset, no in-flight form data lost).
    if (revalidationOnly) {
        conditionsLogger.debug('Revalidation: conditions still pass, leaving mounted route untouched')
        return
    }

    // Phase 5: Branch - zone vs single component
    if (ctx.match.routeItem.isZoneMode) {
        // Zone route path
        ctx = await pipelineLoadZoneComponents(ctx)

        // Race condition check
        if (ctx.resultType === 'cancelled') {
            return
        }

        // Compute metadata and referrer
        ctx = pipelineComposeBreadcrumbs(ctx)
        ctx = pipelineComputeMetadata(ctx)
        ctx = pipelineCalculateReferrer(ctx)

        // Commit all state changes at once
        commitToReactiveState(ctx)

        // Dispatch success event
        await dispatchNextTick('routeLoaded', {
            route: ctx.match.routeItem.path,
            location: ctx.location,
            relativeLocation: ctx.relativeLocation,
            querystring: ctx.querystring,
            params: ctx.match.params,
            zones: Object.keys(ctx.zoneComponents)
        })
    } else {
        // Single component route path
        ctx = await pipelineLoadComponent(ctx)

        // Race condition check
        if (ctx.resultType === 'cancelled') {
            return
        }

        // Compute metadata and referrer
        ctx = pipelineComposeBreadcrumbs(ctx)
        ctx = pipelineComputeMetadata(ctx)
        ctx = pipelineCalculateReferrer(ctx)

        // Special case: shouldDisplayLoadingOnRouteLoad
        if (ctx.shouldDisplayLoadingOnRouteLoad && ctx.loadingComponent) {
            ctx.shouldWaitForData = true

            // Commit first (so component can mount)
            commitToReactiveState(ctx)

            // Start loading indicator
            startRouteLoading(true)

            // Wait for hideLoading() signal
            await waitForRouteReady()

            // Race condition check: if a newer navigation started while we were
            // waiting, startRouteLoading() resolved our pending promise so this
            // stale pipeline run can bail cleanly instead of leaking and racing
            // with the new one's state writes.
            if (ctx.loadingId !== loadingId) {
                routerLogger.debug('Pipeline cancelled after waitForRouteReady (newer navigation)')
                return
            }

            // Update loading state
            untrack(() => {
                isWaitingForData = false
            })
        } else {
            // Normal path: commit all at once
            commitToReactiveState(ctx)
        }

        // Dispatch success event
        await dispatchNextTick('routeLoaded', {
            route: ctx.match.routeItem.path,
            location: ctx.location,
            relativeLocation: ctx.relativeLocation,
            querystring: ctx.querystring,
            params: ctx.match.params,
            component: ctx.component,
            name: ctx.component?.name,
            routeContext: ctx.match.routeItem.routeContext
        })
    }
}

// ============================================================================
// END MAIN PIPELINE ORCHESTRATION
// ============================================================================

/**
 * Pre-effect to capture location BEFORE navigation
 * This ensures previousRoute always has the correct "where we came from" value
 */
$effect.pre(() => {
    const loc = location()
    const qs = querystring()

    // Update previous route state with current values BEFORE they change
    // This captures "where we're leaving from" for referrer tracking
    previousRoute = currentRoute
    previousQuerystring = currentQuerystring
    previousParams = currentParams
    previousRouteName = currentRouteName
    isPreviousRouteCatchAll = isCurrentRouteCatchAll
})

/**
 * Main routing effect - NOW USES PIPELINE!
 * Simplified: just read inputs and trigger pipeline
 */
$effect(() => {
    const loc = location()
    const qs = querystring()

    // Early return if location hasn't actually changed AND we're not on a catch-all route
    // If we're on a catch-all route (404), we need to allow navigation even if currentRoute matches
    // This allows navigating back from 404 to the last valid route
    // Use untrack() to prevent writes to isCurrentRouteCatchAll from triggering this effect
    if (currentRoute === loc && currentQuerystring === qs && !untrack(() => isCurrentRouteCatchAll)) {
        return
    }

    routerLogger.debug('Location changed:', loc, qs)

    // Read raw navigationContext (including internal _routeName) for pipeline use.
    // Untracked to prevent re-runs on context changes.
    const incomingContext = untrack(() => getRawNavigationContext() || {})

    // Capture previous route snapshot for referrer calculation
    // Uses previousRoute state which is updated AFTER navigation completes
    // This ensures we get the correct "where we came from" even during popstate events
    const currentRouteSnapshot = {
        location: previousRoute,
        querystring: previousQuerystring,
        params: previousParams,
        routeName: previousRouteName,
        isCatchAll: isPreviousRouteCatchAll,
        scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0
    }

    // Run pipeline asynchronously
    runRoutingPipeline(loc, qs, incomingContext, currentRouteSnapshot)
})

// Effect to register/unregister this Router instance with the revalidation
// dispatcher. When a consumer calls revalidateCurrentRoute(), this listener
// fires and we re-run the pipeline against the current location with the
// `revalidationOnly` flag so the route component is preserved on success.
$effect(() => {
    const unregister = registerRevalidationListener(() => {
        const loc = untrack(() => location())
        const qs = untrack(() => querystring())
        const incomingContext = untrack(() => getRawNavigationContext() || {})
        const currentRouteSnapshot = {
            location: previousRoute,
            querystring: previousQuerystring,
            params: previousParams,
            routeName: previousRouteName,
            isCatchAll: isPreviousRouteCatchAll,
            scrollX: typeof window !== 'undefined' ? window.scrollX : 0,
            scrollY: typeof window !== 'undefined' ? window.scrollY : 0
        }
        runRoutingPipeline(loc, qs, incomingContext, currentRouteSnapshot, { revalidationOnly: true })
    })
    return unregister
})

// Effect to handle scroll restoration
$effect(() => {
    if (restoreScrollState) {
        history.scrollRestoration = 'manual'

        const popStateHandler = (event) => {
            if (event.state && (event.state.__svelte_spa_router_scrollY || event.state.__svelte_spa_router_scrollX)) {
                previousScrollState = event.state
            } else {
                previousScrollState = null
            }
        }

        window.addEventListener('popstate', popStateHandler)

        return () => {
            window.removeEventListener('popstate', popStateHandler)
            history.scrollRestoration = 'auto'
        }
    } else {
        history.scrollRestoration = 'auto'
    }
})

// Effect to restore scroll after component updates
$effect(() => {
    scrollLogger.debug('Scroll effect triggered - restoreScrollState:', restoreScrollState, 'component:', !!component)
    if (component) {
        // Check if navigationContext has scroll behavior override.
        // Use the raw accessor because __scrollBehavior is an internal key
        // filtered out of the public navigationContext().
        const navContext = untrack(() => getRawNavigationContext())
        const scrollBehavior = navContext?.__scrollBehavior

        scrollLogger.debug('Scroll behavior:', scrollBehavior, 'navigationContext:', navContext)

        if (scrollBehavior === 'none') {
            // Don't scroll
            scrollLogger.debug('Skipping scroll (behavior: none)')
            return
        } else if (scrollBehavior === 'restore') {
            // Restore from target scroll position in navigationContext (goBack scenario)
            if (navContext?.__targetScrollX !== undefined && navContext?.__targetScrollY !== undefined) {
                const targetState = {
                    __svelte_spa_router_scrollX: navContext.__targetScrollX,
                    __svelte_spa_router_scrollY: navContext.__targetScrollY
                }
                scrollLogger.debug('Restoring scroll from navigationContext target:', targetState)
                restoreScroll(targetState)
            } else {
                // Fallback to history.state (if available)
                const state = typeof window !== 'undefined' ? window.history.state : null
                scrollLogger.debug('Restoring scroll from history.state:', state)
                restoreScroll(state)
            }
        } else if (restoreScrollState) {
            // Browser back/forward: restore from previousScrollState
            scrollLogger.debug('Browser back/forward - previousScrollState:', previousScrollState)
            restoreScroll(previousScrollState)
        } else {
            // Default programmatic navigation: scroll to top
            scrollLogger.debug('Default programmatic navigation - scrolling to top')
            restoreScroll(null)
        }
    }
})

// OLD loadRoute function removed - now using pipeline architecture
// See runRoutingPipeline() above for the new implementation
</script>

{#if zone}
    <!-- Zone-based rendering: render component for this zone -->
    {#if zoneComponentData}
        {@const Comp = zoneComponentData.component}
        {@const zoneParams = zoneComponentData.params}
        {@const zoneProps = zoneComponentData.props}
        {@const zoneRouteContext = zoneComponentData.routeContext}
        {#if zoneParams}
            <Comp routeParams={zoneParams} routeContext={zoneRouteContext} {...zoneProps} />
        {:else}
            <Comp routeContext={zoneRouteContext} {...zoneProps} />
        {/if}
    {/if}
{:else if component}
    <!-- Show loading component while waiting for data -->
    {#if isWaitingForData && loadingComponent}
        {#if loadingParams}
            {@const LoadingComp = loadingComponent}
            <LoadingComp routeParams={loadingParams} />
        {:else}
            {@const LoadingComp = loadingComponent}
            <LoadingComp />
        {/if}
    {/if}

    <!-- Real component -->
    {#if loadingComponent}
        <!-- Routes with loading: wrapper needed to hide component while loading spinner shows -->
        <div style:display={isWaitingForData ? 'none' : 'contents'}>
            {#if componentParams}
                {@const Comp = component}
                <Comp routeParams={componentParams} {...componentProps} />
            {:else}
                {@const Comp = component}
                <Comp {...componentProps} />
            {/if}
        </div>
    {:else}
        <!-- Routes without loading: render directly, no wrapper div -->
        {#if componentParams}
            {@const Comp = component}
            <Comp routeParams={componentParams} {...componentProps} />
        {:else}
            {@const Comp = component}
            <Comp {...componentProps} />
        {/if}
    {/if}
{/if}
