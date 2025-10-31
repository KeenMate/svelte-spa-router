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
import { location, querystring, routeParams, setParams, getHierarchicalRoutesEnabled, navigationContext, setNavigationContext, getIncludeReferrer, restoreScroll, getZoneComponent, setZoneComponents } from './utils.svelte.js'
import { runBeforeLeaveGuards } from './helpers/navigation-guard.svelte.js'
import { updateRouteMetadata, getUpdatedBreadcrumb, startRouteLoading, waitForRouteReady } from './helpers/route-metadata.svelte.js'

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
    onrouteLoading,
    onrouteLoaded,
    onconditionsFailed,
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

// Parse routes into RouteItem objects
const routesList = []
if (routes instanceof Map) {
    routes.forEach((route, path) => {
        routesList.push(new RouteItem(path, route))
    })
} else {
    Object.keys(routes).forEach((path) => {
        routesList.push(new RouteItem(path, routes[path]))
    })
}

console.log('[Router2] Initialized with', routesList.length, 'routes')

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
            console.warn('[Router2] Circular route hierarchy detected for path:', current.path)
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

// Previous scroll state for restoration
let previousScrollState = $state(null)

// For zone-based routing: get component from zone state if zone prop is set
let zoneComponentData = $derived(zone ? getZoneComponent(zone) : null)

// Dispatch helper
function dispatchEvent(name, detail) {
    if (name === 'routeLoading' && onrouteLoading) {
        onrouteLoading({ detail })
    } else if (name === 'routeLoaded' && onrouteLoaded) {
        onrouteLoaded({ detail })
    } else if (name === 'conditionsFailed' && onconditionsFailed) {
        onconditionsFailed({ detail })
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
    console.log('[Router2] Committing pipeline result:', ctx.resultType)

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

                // Don't update currentRoute tracking for failed conditions
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
                console.log('[Router2] Commit cancelled (race condition)')
                break

            default:
                console.warn('[Router2] Unknown result type:', ctx.resultType)
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

        if ((includeReferrer === 'notfound' || includeReferrer === 'always') && hasReferrer) {
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
                        routeName: ctx.previousRoute.routeName
                    }
                }
            }
        }
        return ctx
    }

    const includeReferrer = getIncludeReferrer()
    const isCatchAll = ctx.match.routeItem.path === '*'
    const hasReferrer = ctx.previousRoute.location !== null

    let updatedContext = ctx.incomingContext

    if (isCatchAll && (includeReferrer === 'notfound' || includeReferrer === 'always') && hasReferrer) {
        // Catch-all route: inject referrer with attemptedRoute
        console.log('[Router2] Catch-all route - Injecting referrer:', ctx.previousRoute.location)
        updatedContext = {
            ...updatedContext,
            attemptedRoute: ctx.location,
            attemptedQuerystring: ctx.querystring,
            referrer: {
                location: ctx.previousRoute.location,
                querystring: ctx.previousRoute.querystring,
                params: ctx.previousRoute.params,
                routeName: ctx.previousRoute.routeName
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
                routeName: ctx.previousRoute.routeName
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

    // Conditions failed
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
    return { ...ctx, conditionsPassed }
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

    console.log('[Router2] Route loaded successfully:', routeItem.path)

    // Check race condition
    if (ctx.loadingId !== loadingId) {
        console.log('[Router2] Component load cancelled (newer navigation)')
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

    console.log('[Router2] Zone components loaded:', Object.keys(zoneComponents))

    // Check race condition
    if (ctx.loadingId !== loadingId) {
        console.log('[Router2] Zone load cancelled (newer navigation)')
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
async function runRoutingPipeline(loc, qs, incomingContext, currentRouteSnapshot) {
    console.log('[Router2] Running pipeline for:', loc)

    // Phase 1: Create pipeline context (plain JS object, not reactive)
    let ctx = createPipelineContext(loc, qs, incomingContext, currentRouteSnapshot)

    // Phase 2: Match route (pure)
    ctx = pipelineMatchRoute(ctx)

    // Early exit: No match (404)
    if (!ctx.match) {
        console.log('[Router2] No route matched')
        ctx = pipelineCalculateReferrer(ctx)
        ctx = pipelineDetermineResultType(ctx)
        commitToReactiveState(ctx)
        await dispatchNextTick('notFound', { location: ctx.location, querystring: ctx.querystring })
        return
    }

    // Phase 3: Check navigation guards (async, may have side effects)
    ctx = await pipelineCheckGuards(ctx)

    if (!ctx.canLeave) {
        console.log('[Router2] Navigation cancelled by beforeLeave guard')
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

    // Dispatch loading event
    await dispatchNextTick('routeLoading', {
        route: ctx.match.routeItem.path,
        location: ctx.location,
        querystring: ctx.querystring,
        params: ctx.match.params
    })

    // Phase 4: Check route conditions (async)
    ctx = await pipelineCheckConditions(ctx)

    // Race condition check
    if (ctx.loadingId !== loadingId) {
        console.log('[Router2] Pipeline cancelled (newer navigation)')
        return
    }

    if (!ctx.conditionsPassed) {
        console.log('[Router2] Route conditions failed')
        ctx = pipelineDetermineResultType(ctx)
        commitToReactiveState(ctx)
        await dispatchNextTick('conditionsFailed', {
            route: ctx.match.routeItem.path,
            location: ctx.location,
            querystring: ctx.querystring,
            params: ctx.match.params
        })
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

    console.log('[Router2] Location changed:', loc, qs)

    // Read navigationContext to get route name (untracked to prevent re-runs on context changes)
    const incomingContext = untrack(() => navigationContext() || {})

    // Capture current route snapshot for referrer calculation
    const currentRouteSnapshot = {
        location: currentRoute,
        querystring: currentQuerystring,
        params: currentParams,
        routeName: currentRouteName,
        isCatchAll: isCurrentRouteCatchAll
    }

    // Run pipeline asynchronously
    runRoutingPipeline(loc, qs, incomingContext, currentRouteSnapshot)
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
    if (restoreScrollState && component) {
        restoreScroll(previousScrollState)
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
        {@const zonerouteContext = zoneComponentData.routeContext}
        {#if zoneParams}
            <Comp routeParams={zoneParams} routeContext={zonerouteContext} {...zoneProps} />
        {:else}
            <Comp routeContext={zonerouteContext} {...zoneProps} />
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

    <!-- Real component (hidden while loading, visible after hideLoading() called) -->
    <div style:display={isWaitingForData ? 'none' : 'block'}>
        {#if componentParams}
            {@const Comp = component}
            <Comp routeParams={componentParams} {...componentProps} />
        {:else}
            {@const Comp = component}
            <Comp {...componentProps} />
        {/if}
    </div>
{/if}
