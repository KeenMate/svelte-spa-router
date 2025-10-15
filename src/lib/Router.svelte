<script>
import {parse} from 'regexparam'
import { tick, untrack } from 'svelte'
import { location, querystring, params, setParams, restoreScroll } from './utils.svelte.js'

// Re-export utilities so they can be imported from Router
export { link, push, pop, replace, location, querystring, params, loc, restoreScroll } from './utils.svelte.js'

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
    onconditionsFailed
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
            this.component = component.component
            this.conditions = component.conditions || []
            this.userData = component.userData
            this.props = component.props || {}
        }
        else {
            // Convert the component to a function that returns a Promise, to normalize it
            this.component = () => Promise.resolve(component)
            this.conditions = []
            this.props = {}
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
let componentObj = $state(null)

// Previous scroll state for restoration
let previousScrollState = $state(null)

// Track last location to handle race conditions
let lastLoc = null

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
                userData: routesList[i].userData,
                params: (match && typeof match == 'object' && Object.keys(match).length) ? match : null
            }

            // Check if the route can be loaded - if all conditions succeed
            if (!(await routesList[i].checkConditions(detail))) {
                // Don't display anything
                component = null
                componentObj = null
                // Trigger an event to notify the user, then exit
                dispatchNextTick('conditionsFailed', detail)
                return
            }

            // Trigger an event to alert that we're loading the route
            dispatchNextTick('routeLoading', Object.assign({}, detail))

            // If there's a component to show while we're loading the route, display it
            const obj = routesList[i].component
            // Do not replace the component if we're loading the same one as before
            if (componentObj != obj) {
                if (obj.loading) {
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
                else {
                    component = null
                    componentObj = null
                }

                // Invoke the Promise
                const loaded = await obj()

                // Check if we still want this component
                if (untrack(() => newLoc != lastLoc)) {
                    return
                }

                // If there is a "default" property, pick that
                component = (loaded && loaded.default) || loaded
                componentObj = obj
            }

            // Set componentParams only if we have a match
            if (match && typeof match == 'object' && Object.keys(match).length) {
                componentParams = match
            }
            else {
                componentParams = null
            }

            // Set static props
            componentProps = routesList[i].props

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

        // If we're still here, there was no match
        component = null
        componentObj = null
        setParams(undefined)
    })()
})
</script>

{#if component}
    {#if componentParams}
        <svelte:component this={component} params={componentParams} {onrouteEvent} {...componentProps} />
    {:else}
        <svelte:component this={component} {onrouteEvent} {...componentProps} />
    {/if}
{/if}
