<script>
import {parse} from './parse-route.js'
import { tick, untrack } from 'svelte'
import { location, querystring, routeParams, setParams, restoreScroll, getZoneComponent, setZoneComponents, getHierarchicalRoutesEnabled } from './utils.svelte.js'
import { runBeforeLeaveGuards } from './helpers/navigation-guard.svelte.js'
import { updateRouteMetadata, startRouteLoading, waitForRouteReady, hideLoading } from './helpers/route-metadata.svelte.js'

// Component props
let {
    /**
     * Dictionary of all routes, in the format `'/path': component`.
     */
    routes = {},
    /**
     * Optional prefix for the routes in this router. This is useful for example in the case of nested routers.
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
    onrouteEvent,
    onrouteLoading,
    onrouteLoaded,
    onconditionsFailed,
    onNotFound
} = $props()

/**
 * Container for a route: path, component
 */
class RouteItem {
    /**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    constructor(path, component) {
        if (!component || (typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true))) {
            throw Error('Invalid component object')
        }

        // Path must be a regular or expression, or a string starting with '/' or '*'
        if (!path ||
            (typeof path == 'string' && (path.length < 1 || (path.charAt(0) != '/' && path.charAt(0) != '*'))) ||
            (typeof path == 'object' && !(path instanceof RegExp))
        ) {
            throw Error('Invalid value for "path" argument - strings must start with / or *')
        }

        const {pattern, keys} = parse(path)

        this.path = path

        // Check if the component is wrapped and we have conditions
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
            this.routeContext = component.routeContext
            this.props = component.props || {}
            this.shouldDisplayLoadingOnRouteLoad = component.shouldDisplayLoadingOnRouteLoad || false
            // Store inheritance flags
            this.inheritBreadcrumbs = component.inheritBreadcrumbs !== undefined ? component.inheritBreadcrumbs : true
            this.inheritPermissions = component.inheritPermissions !== undefined ? component.inheritPermissions : true
            this.inheritConditions = component.inheritConditions !== undefined ? component.inheritConditions : true
            this.inheritAuthorization = component.inheritAuthorization !== undefined ? component.inheritAuthorization : true
        }
        else {
            // Convert the component to a function that returns a Promise, to normalize it
            this.component = () => Promise.resolve(component)
            this.zones = null
            this.isZoneMode = false
            this.conditions = []
            this.props = {}
            this.shouldDisplayLoadingOnRouteLoad = false
            this.inheritBreadcrumbs = true
            this.inheritPermissions = true
            this.inheritConditions = true
            this.inheritAuthorization = true
        }

        this._pattern = pattern
        this._keys = keys
    }

    /**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    match(path) {
        // If there's a prefix, check if it matches the start of the path.
        // If not, bail early, else remove it before we run the matching.
        if (prefix) {
            if (typeof prefix == 'string') {
                if (path.startsWith(prefix)) {
                    path = path.substr(prefix.length) || '/'
                }
                else {
                    return null
                }
            }
            else if (prefix instanceof RegExp) {
                const match = path.match(prefix)
                if (match && match[0]) {
                    path = path.substr(match[0].length) || '/'
                }
                else {
                    return null
                }
            }
        }

        // Check if the pattern matches
        const matches = this._pattern.exec(path)
        if (matches === null) {
            return null
        }

        // If the input was a regular expression, this._keys would be false, so return matches as is
        if (this._keys === false) {
            return matches
        }

        const out = {}
        let i = 0
        while (i < this._keys.length) {
            // In the match parameters, URL-decode all values
            try {
                out[this._keys[i]] = decodeURIComponent(matches[i + 1] || '') || null
            }
            catch (e) {
                out[this._keys[i]] = null
            }
            i++
        }
        return out
    }

    /**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     *
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
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

// Set up all routes
const routesList = []
if (routes instanceof Map) {
    // If it's a map, iterate on it right away
    routes.forEach((route, path) => {
        routesList.push(new RouteItem(path, route))
    })
}
else {
    // We have an object, so iterate on its own properties
    Object.keys(routes).forEach((path) => {
        routesList.push(new RouteItem(path, routes[path]))
    })
}

/**
 * Find parent route for hierarchical inheritance
 * Matches by path pattern - finds longest matching parent path
 *
 * @param {string} childPath - Path of the child route (e.g., '/documents/:id/logs')
 * @returns {RouteItem|null} Parent RouteItem or null if no parent found
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
    // /documents/:id/logs → try /documents/:id, then /documents
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
 *
 * @param {RouteItem} route - The route to get hierarchy for
 * @returns {RouteItem[]} Array of routes from root to current [parent, child, grandchild]
 */
function getRouteHierarchy(route) {
    if (!getHierarchicalRoutesEnabled()) {
        return [route]
    }

    const hierarchy = []
    let current = route
    let visited = new Set() // Prevent circular references

    // Build hierarchy bottom-up
    while (current) {
        // Check for circular reference
        if (visited.has(current.path)) {
            console.warn('Circular route hierarchy detected for path:', current.path)
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
 * Concatenates parent breadcrumbs with child breadcrumbs
 *
 * @param {RouteItem} route - The current route
 * @returns {Array} Composed breadcrumbs array
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

    return breadcrumbs
}

/**
 * Get composed conditions from route hierarchy
 * Returns array of all conditions from parent to child
 *
 * @param {RouteItem} route - The current route
 * @returns {Array} Array of condition functions to execute in order
 */
function composeConditions(route) {
    if (!getHierarchicalRoutesEnabled() || !route.inheritConditions) {
        // Return only this route's conditions
        return route.conditions || []
    }

    const hierarchy = getRouteHierarchy(route)
    const conditions = []

    for (const r of hierarchy) {
        // Skip if this specific route opts out
        if (r === route && !route.inheritConditions) {
            return route.conditions || []
        }

        // Add conditions from this level
        if (r.conditions && r.conditions.length > 0) {
            conditions.push(...r.conditions)
        }
    }

    return conditions
}

// Component state
let component = $state(null)
let componentParams = $state(null)
let componentProps = $state({})
let componentrouteContext = $state({})
let componentObj = $state(null)
let loadingComponent = $state(null)
let loadingParams = $state(null)
let isWaitingForData = $state(false)

// For zone-based routing: get component from zone state if zone prop is set
let zoneComponentData = $derived(zone ? getZoneComponent(zone) : null)

// Previous scroll state for restoration
let previousScrollState = $state(null)

// Track last location to handle race conditions
let lastLoc = null
let currentLocation = $state(null)
let currentQuerystring = $state('')
let lastNotFoundLocation = null

// Dispatch events using callbacks
function dispatchEvent(name, detail) {
    if (name === 'routeEvent' && onrouteEvent) {
        onrouteEvent({ detail })
    } else if (name === 'routeLoading' && onrouteLoading) {
        onrouteLoading({ detail })
    } else if (name === 'routeLoaded' && onrouteLoaded) {
        onrouteLoaded({ detail })
    } else if (name === 'conditionsFailed' && onconditionsFailed) {
        onconditionsFailed({ detail })
    } else if (name === 'notFound' && onNotFound) {
        onNotFound({ detail })
    }
}

// Dispatch on next tick
async function dispatchNextTick(name, detail) {
    await tick()
    dispatchEvent(name, detail)
}

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

// Main routing effect - watches location changes
$effect(() => {
    // Create a location object from the shared state
    const newLoc = {
        location: location(),
        querystring: querystring()
    }

    // Run routing logic
    ;(async () => {
        // Run beforeLeave guards if we're changing routes
        if (currentLocation && currentLocation !== newLoc.location) {
            const canLeave = await runBeforeLeaveGuards({
                from: currentLocation,
                to: newLoc.location,
                params: untrack(() => routeParams()),
                querystring: untrack(() => querystring())
            })

            if (!canLeave) {
                // Navigation cancelled - revert to current location
                // We need to restore the browser history state with the original querystring
                if (typeof window !== 'undefined' && window.history) {
                    // Build the full URL with the original querystring
                    const fullPath = currentLocation + (currentQuerystring ? '?' + currentQuerystring : '')

                    // Push the previous location back to history
                    const hashMode = location().startsWith('#')
                    if (hashMode) {
                        window.location.hash = fullPath
                    } else {
                        window.history.pushState({}, '', fullPath)
                    }
                }
                return
            }
        }

        // Update current location and querystring
        currentLocation = newLoc.location
        currentQuerystring = newLoc.querystring
        lastLoc = newLoc

        // Find a route matching the location
        let i = 0
        while (i < routesList.length) {
            const match = routesList[i].match(newLoc.location)
            if (!match) {
                i++
                continue
            }

            const detail = {
                route: routesList[i].path,
                location: newLoc.location,
                querystring: newLoc.querystring,
                routeContext: routesList[i].routeContext,
                params: (match && typeof match == 'object' && Object.keys(match).length) ? match : null
            }

            // Fire onNotFound if this is the catch-all route (only once per location)
            if (routesList[i].path === '*' && onNotFound && lastNotFoundLocation !== newLoc.location) {
                lastNotFoundLocation = newLoc.location
                dispatchNextTick('notFound', {
                    location: newLoc.location,
                    querystring: newLoc.querystring
                })
            }

            // Check if the route can be loaded - check composed conditions (includes parent conditions)
            const composedConditions = composeConditions(routesList[i])
            let allConditionsPassed = true

            for (let condIdx = 0; condIdx < composedConditions.length; condIdx++) {
                if (!(await composedConditions[condIdx](detail))) {
                    allConditionsPassed = false
                    break
                }
            }

            if (!allConditionsPassed) {
                // Don't display anything
                component = null
                componentObj = null
                componentrouteContext = {}
                isWaitingForData = false
                updateRouteMetadata({})
                // Trigger an event to notify the user, then exit
                dispatchNextTick('conditionsFailed', detail)
                return
            }

            // Trigger an event to alert that we're loading the route
            dispatchNextTick('routeLoading', Object.assign({}, detail))

            // Check if this is a zone-based route
            if (routesList[i].isZoneMode) {
                // Zone-based route: load all zone components
                const zoneComponents = {}
                const zones = routesList[i].zones

                // Load all zone components in parallel
                await Promise.all(
                    Object.entries(zones).map(async ([zoneName, zoneLoader]) => {
                        const loaded = await zoneLoader()
                        // Extract default export if present
                        zoneComponents[zoneName] = {
                            component: (loaded && loaded.default) || loaded,
                            params: (match && typeof match == 'object' && Object.keys(match).length) ? match : null,
                            props: routesList[i].props,
                            routeContext: detail.routeContext || {}
                        }
                    })
                )

                // Check if we still want this route
                if (untrack(() => newLoc != lastLoc)) {
                    return
                }

                // Update zone components in shared state (all Router instances will see this)
                setZoneComponents(zoneComponents)

                // Set params from match
                if (match && typeof match == 'object' && Object.keys(match).length) {
                    componentParams = match
                } else {
                    componentParams = null
                }

                // Set static props and routeContext
                componentProps = routesList[i].props
                componentrouteContext = detail.routeContext || {}

                // Update route metadata with composed breadcrumbs
                const composedBreadcrumbs = composeBreadcrumbs(routesList[i])
                const metadata = {
                    ...(detail.routeContext || {}),
                    breadcrumbs: composedBreadcrumbs.length > 0 ? composedBreadcrumbs : (detail.routeContext?.breadcrumbs || [])
                }
                updateRouteMetadata(metadata)

                // Set params in shared state
                setParams(componentParams)

                // For non-zone Router instances, clear component
                component = null
                componentObj = null
                loadingComponent = null
                loadingParams = null

                // Dispatch the routeLoaded event then exit
                dispatchNextTick('routeLoaded', Object.assign({}, detail, {
                    zones: Object.keys(zoneComponents),
                    params: componentParams
                }))
                return
            } else {
                // Single component route (original behavior)
                // Clear zone components when switching to single-component route
                setZoneComponents({})

                // Check if this route should display loading on route load
                const shouldDisplayLoadingOnRouteLoad = routesList[i].shouldDisplayLoadingOnRouteLoad

                // If there's a component to show while we're loading the route, display it
                const obj = routesList[i].component
                // Do not replace the component if we're loading the same one as before
                if (componentObj != obj) {
                    // Store loading component info if exists
                    if (obj.loading) {
                        loadingComponent = obj.loading
                        loadingParams = obj.loadingParams

                        // If NOT waiting for data, show loading component immediately
                        if (!shouldDisplayLoadingOnRouteLoad) {
                            component = obj.loading
                            componentObj = obj
                            componentParams = obj.loadingParams
                            componentProps = {}

                            // Trigger the routeLoaded event for the loading component
                            dispatchNextTick('routeLoaded', Object.assign({}, detail, {
                                component: component,
                                name: component.name,
                                params: componentParams
                            }))
                        }
                    }
                    else {
                        loadingComponent = null
                        loadingParams = null
                        component = null
                        componentObj = null
                    }

                    // Invoke the Promise to load the actual component
                    const loaded = await obj()

                    // Check if we still want this component
                    if (untrack(() => newLoc != lastLoc)) {
                        return
                    }

                    // If there is a "default" property, pick that
                    component = (loaded && loaded.default) || loaded
                    componentObj = obj
                }
            }

            // Set componentParams, props and routeContext BEFORE waiting
            // This allows the component to mount with correct params
            if (match && typeof match == 'object' && Object.keys(match).length) {
                componentParams = match
            }
            else {
                componentParams = null
            }

            // Set static props and routeContext
            componentProps = routesList[i].props
            componentrouteContext = detail.routeContext || {}

            // If shouldDisplayLoadingOnRouteLoad is true, set waiting state and wait for component to signal ready
            // Note: This only applies to single-component routes, not zone routes
            if (!routesList[i].isZoneMode && routesList[i].shouldDisplayLoadingOnRouteLoad && loadingComponent) {
                isWaitingForData = true
                startRouteLoading(true) // true indicates this route has a custom loading component
                await waitForRouteReady()
                isWaitingForData = false
            }

            // Update route metadata with composed breadcrumbs
            const composedBreadcrumbs = composeBreadcrumbs(routesList[i])
            const metadata = {
                ...(detail.routeContext || {}),
                breadcrumbs: composedBreadcrumbs.length > 0 ? composedBreadcrumbs : (detail.routeContext?.breadcrumbs || [])
            }
            updateRouteMetadata(metadata)

            // Dispatch the routeLoaded event then exit
            dispatchNextTick('routeLoaded', Object.assign({}, detail, {
                component: component,
                name: component.name,
                params: componentParams
            })).then(() => {
                setParams(componentParams)
            })
            return
        }

        // If we're still here, there was no match (and no catch-all route)
        // Note: onNotFound is already fired if catch-all route ('*') matched
        component = null
        componentObj = null
        componentrouteContext = {}
        isWaitingForData = false
        setParams(undefined)
        updateRouteMetadata({})
    })()
})
</script>

{#if zone}
    <!-- Zone-based rendering: render component for this zone -->
    {#if zoneComponentData}
        {@const Comp = zoneComponentData.component}
        {@const zoneParams = zoneComponentData.params}
        {@const zoneProps = zoneComponentData.props}
        {@const zonerouteContext = zoneComponentData.routeContext}
        {#if zoneParams}
            <Comp routeParams={zoneParams} {onrouteEvent} routeContext={zonerouteContext} {...zoneProps} />
        {:else}
            <Comp {onrouteEvent} routeContext={zonerouteContext} {...zoneProps} />
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
            <Comp routeParams={componentParams} {onrouteEvent} routeContext={componentrouteContext} {...componentProps} />
        {:else}
            {@const Comp = component}
            <Comp {onrouteEvent} routeContext={componentrouteContext} {...componentParams} />
        {/if}
    </div>
{/if}
