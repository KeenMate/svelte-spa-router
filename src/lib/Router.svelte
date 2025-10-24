<script>
import {parse} from './parse-route.js'
import { tick, untrack } from 'svelte'
import { location, querystring, params, setParams, restoreScroll, getZoneComponent, setZoneComponents } from './utils.svelte.js'
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
        }
        else {
            // Convert the component to a function that returns a Promise, to normalize it
            this.component = () => Promise.resolve(component)
            this.zones = null
            this.isZoneMode = false
            this.conditions = []
            this.props = {}
            this.shouldDisplayLoadingOnRouteLoad = false
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
                params: untrack(() => params()),
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

            // Check if the route can be loaded - if all conditions succeed
            if (!(await routesList[i].checkConditions(detail))) {
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

                // Update route metadata
                updateRouteMetadata(detail.routeContext || {})

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

            // Update route metadata
            updateRouteMetadata(detail.routeContext || {})

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
            <Comp params={zoneParams} {onrouteEvent} routeContext={zonerouteContext} {...zoneProps} />
        {:else}
            <Comp {onrouteEvent} routeContext={zonerouteContext} {...zoneProps} />
        {/if}
    {/if}
{:else if component}
    <!-- Show loading component while waiting for data -->
    {#if isWaitingForData && loadingComponent}
        {#if loadingParams}
            {@const LoadingComp = loadingComponent}
            <LoadingComp params={loadingParams} />
        {:else}
            {@const LoadingComp = loadingComponent}
            <LoadingComp />
        {/if}
    {/if}

    <!-- Real component (hidden while loading, visible after hideLoading() called) -->
    <div style:display={isWaitingForData ? 'none' : 'block'}>
        {#if componentParams}
            {@const Comp = component}
            <Comp params={componentParams} {onrouteEvent} routeContext={componentrouteContext} {...componentProps} />
        {:else}
            {@const Comp = component}
            <Comp {onrouteEvent} routeContext={componentrouteContext} {...componentProps} />
        {/if}
    </div>
{/if}
