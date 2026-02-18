import { tick } from 'svelte'
import { joinPaths } from './helpers/url-helpers.svelte.js'
import { buildUrl } from './routes.svelte.js'
import { navigationLogger, scrollLogger } from './logger.ts'

/**
 * @typedef {Object} Location
 * @property {string} location - Location (page/view), for example `/book`
 * @property {string} [querystring] - Querystring from the hash, as a string not parsed
 */

// Configuration state - must be set before app initialization
let hashRoutingEnabled = $state(true)
let basePath = $state('/')
let paramReplacementPlaceholder = $state('N-A')
let hierarchicalRoutesEnabled = $state(false)

/**
 * Enable or disable hash-based routing
 * Must be called before app initialization
 *
 * @param {boolean} value - true for hash mode (#/path), false for history mode (/path)
 */
export function setHashRoutingEnabled(value) {
    hashRoutingEnabled = value
}

/**
 * Set the base path for non-hash routing
 * Must be called before app initialization
 *
 * @param {string} value - Base path (e.g., '/app' or '/')
 */
export function setBasePath(value) {
    if (!value || value === '/') {
        basePath = '/'
        return
    }

    // Normalize: add leading slash if missing
    if (!value.startsWith('/')) {
        value = '/' + value
    }

    // Normalize: remove trailing slash
    if (value.endsWith('/') && value.length > 1) {
        value = value.slice(0, -1)
    }

    basePath = value
}

/**
 * Get current hash routing mode
 *
 * @returns {boolean} true if hash mode is enabled
 */
export function getHashRoutingEnabled() {
    return hashRoutingEnabled
}

/**
 * Get current base path
 *
 * @returns {string} Base path
 */
export function getBasePath() {
    return basePath
}

/**
 * Set the placeholder value for missing route parameters
 * Used when building URLs from named routes with incomplete parameters
 *
 * @param {string} value - Placeholder value (default: 'N-A')
 */
export function setParamReplacementPlaceholder(value) {
    paramReplacementPlaceholder = value
}

/**
 * Get current parameter replacement placeholder
 *
 * @returns {string} Placeholder value
 */
export function getParamReplacementPlaceholder() {
    return paramReplacementPlaceholder
}

/**
 * Enable or disable hierarchical route inheritance
 * Must be called before app initialization
 *
 * When enabled, child routes automatically inherit breadcrumbs, permissions,
 * conditions, and authorization callbacks from parent routes.
 *
 * @param {boolean} value - true to enable hierarchical mode, false for flat mode (default)
 */
export function setHierarchicalRoutesEnabled(value) {
    hierarchicalRoutesEnabled = value
}

/**
 * Get current hierarchical routes mode
 *
 * @returns {boolean} true if hierarchical mode is enabled
 */
export function getHierarchicalRoutesEnabled() {
    return hierarchicalRoutesEnabled
}

// Referrer tracking configuration
let includeReferrerState = $state('never')

/**
 * Configure automatic referrer tracking in navigationContext
 * Must be called before app initialization
 *
 * @param {string} value - 'never' (default), 'notfound' (404 only), or 'always' (all routes)
 */
export function setIncludeReferrer(value) {
    if (!['never', 'notfound', 'always'].includes(value)) {
        console.warn(`Invalid setIncludeReferrer value: "${value}". Use 'never', 'notfound', or 'always'.`)
        return
    }
    includeReferrerState = value
}

/**
 * Get current referrer tracking mode
 *
 * @returns {string} Current mode: 'never', 'notfound', or 'always'
 */
export function getIncludeReferrer() {
    return includeReferrerState
}


/**
 * Returns the current location from the hash or pathname.
 *
 * @returns {Location} Location object
 * @private
 */
function getLocation() {
    if (hashRoutingEnabled) {
        // Hash mode - same as before
        const hashPosition = window.location.href.indexOf('#/')
        let location = (hashPosition > -1) ? window.location.href.substr(hashPosition + 1) : '/'

        // Check if there's a querystring
        const qsPosition = location.indexOf('?')
        let querystring = ''
        if (qsPosition > -1) {
            querystring = location.substr(qsPosition + 1)
            location = location.substr(0, qsPosition)
        }

        return {location, querystring}
    } else {
        // History mode - use pathname
        let location = window.location.pathname

        // Validate that location starts with basePath
        if (basePath !== '/' && !location.startsWith(basePath)) {
            console.warn(`Current pathname "${location}" does not start with configured basePath "${basePath}"`)
        }

        // Remove basePath prefix
        if (basePath !== '/' && location.startsWith(basePath)) {
            location = location.substring(basePath.length) || '/'
        }

        // Ensure location starts with /
        if (!location.startsWith('/')) {
            location = '/' + location
        }

        // Get querystring from window.location.search
        const querystring = window.location.search ? window.location.search.substring(1) : ''

        return {location, querystring}
    }
}

// Trigger for manual updates (must be declared before locationState)
let updateTrigger = $state(0)

// Navigation sequence for detecting back/forward navigation
let navigationSequence = $state(0)

// Navigation context state for passing data between routes without URL
let navigationContextState = $state(null)

// Reactive location state - use derived to make it reactive to config changes
let locationState = $derived.by(() => {
    // This will re-run when hashRoutingEnabled or basePath changes (both are $state)
    // and also when we manually trigger updates via updateTrigger
    const _ = updateTrigger
    const _hashMode = hashRoutingEnabled
    const _base = basePath
    return getLocation()
})

// Listen to navigation events
if (typeof window !== 'undefined') {
    // Listen to hashchange for hash mode
    window.addEventListener('hashchange', () => {
        if (hashRoutingEnabled) {
            // Detect navigation direction by comparing sequence numbers
            const historyEntrySequence = history.state?.__navigationSequence ?? 0
            const isBackOrForward = historyEntrySequence !== 0  // If we have a sequence, it's back/forward

            // Update our sequence to match the history entry we're navigating to
            if (isBackOrForward) {
                navigationSequence = historyEntrySequence
            }

            // Restore context from history state if available
            if (history.state && history.state.__svelte_spa_router_navigation_context !== undefined) {
                setNavigationContext(history.state.__svelte_spa_router_navigation_context)
            } else {
                setNavigationContext(null)
            }
            updateTrigger++
        }
    }, false)

    // Listen to popstate for history mode (back/forward buttons)
    window.addEventListener('popstate', (event) => {
        if (!hashRoutingEnabled) {
            // Detect navigation direction by comparing sequence numbers
            const historyEntrySequence = event.state?.__navigationSequence ?? 0
            const isBackOrForward = historyEntrySequence !== 0  // If we have a sequence, it's back/forward

            // Update our sequence to match the history entry we're navigating to
            if (isBackOrForward) {
                navigationSequence = historyEntrySequence
            }

            // Restore context from history state if available
            if (event.state && event.state.__svelte_spa_router_navigation_context !== undefined) {
                setNavigationContext(event.state.__svelte_spa_router_navigation_context)
            } else {
                setNavigationContext(null)
            }
            updateTrigger++
        }
    }, false)
}

/**
 * Get current location
 */
export function location() {
    return locationState.location
}

/**
 * Get current querystring
 */
export function querystring() {
    return locationState.querystring
}

/**
 * Get full location object
 */
export function loc() {
    return locationState
}

// Params state for external access
let paramsState = $state(undefined)

/**
 * Get current route parameters
 */
export function routeParams() {
    return paramsState
}

/**
 * Internal function to set params (used by router)
 */
export function setParams(newParams) {
    paramsState = newParams
}

/**
 * Get route context data
 * Context is data passed during navigation that doesn't appear in the URL
 * Example: push('/orders', { context: { orderId: 123 } })
 *
 * @returns {any} Context object or null if no context was set
 */
export function navigationContext() {
    return navigationContextState
}

/**
 * Sets the navigation context to a new value
 *
 * @param newContext - The new navigation context value
 * @returns {void}
 */
export function setNavigationContext(newContext) {
    navigationContextState = newContext
}

// Zone components state for multi-zone routing
let zoneComponentsState = $state({})

/**
 * Get component for a specific zone
 * @param {string} zoneName - Name of the zone
 * @returns {Object|null} Zone component data or null if not set
 */
export function getZoneComponent(zoneName) {
    return zoneComponentsState[zoneName] || null
}

/**
 * Internal function to set zone components (used by router)
 * @param {Object} zoneComponents - Dictionary of zone names to component data
 */
export function setZoneComponents(zoneComponents) {
    const newValue = zoneComponents || {}
    const currentKeys = Object.keys(zoneComponentsState)
    const newKeys = Object.keys(newValue)

    // If both are empty objects, don't update
    if (currentKeys.length === 0 && newKeys.length === 0) {
        return
    }

    // If different number of keys, definitely different
    if (currentKeys.length !== newKeys.length) {
        zoneComponentsState = newValue
        return
    }

    // Check if keys or values are different
    const isDifferent = newKeys.some(key => {
        // Key doesn't exist in current state
        if (!currentKeys.includes(key)) return true
        // Component reference is different
        if (zoneComponentsState[key] !== newValue[key]) return true
        return false
    })

    if (isDifferent) {
        zoneComponentsState = newValue
    }
}

/**
 * Internal navigation function supporting both hash and history modes
 *
 * @param {string} location - Path to navigate to
 * @param {boolean} shouldReplace - If true, replaces current history entry instead of pushing
 * @param {any} context - Optional context data to pass to the route
 * @private
 */
function navigate(location, shouldReplace = false, context = null) {
    // Store context in reactive state (always works)
    setNavigationContext(context)

    if (hashRoutingEnabled) {
        // Hash mode
        const dest = (location.charAt(0) == '#' ? '' : '#') + location
        if (shouldReplace) {
            // Use history.replaceState to replace without adding history entry
            // This prevents history.length from increasing
            history.replaceState(
                history.state,
                '',
                window.location.pathname + window.location.search + dest
            )
            // Manually trigger hashchange event
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        } else {
            try {
                // Save CURRENT context (with referrer) to current history entry before navigating
                const currentContext = navigationContextState

                // Serialize context to handle Proxy objects in params
                let serializableContext = currentContext
                if (currentContext !== null) {
                    try {
                        structuredClone(currentContext)
                    } catch {
                        // If structured clone fails (e.g., Proxy objects), use JSON serialization
                        const jsonString = JSON.stringify(currentContext)
                        serializableContext = JSON.parse(jsonString)
                    }
                }

                history.replaceState({
                    ...history.state,
                    __svelte_spa_router_scrollX: window.scrollX,
                    __svelte_spa_router_scrollY: window.scrollY,
                    __navigationSequence: navigationSequence,
                    ...(serializableContext !== null && { __svelte_spa_router_navigation_context: serializableContext })
                }, undefined)
            } catch (e) {
                // If even without context it fails, just ignore
                console.warn('Failed to save state to history:', e)
            }
            window.location.hash = dest
        }
    } else {
        // History mode - use pushState/replaceState
        const fullPath = basePath !== '/' ? joinPaths(basePath, location) : location
        // Note: Don't append window.location.search here - the location parameter
        // already contains the querystring if one should be present

        // Declare state variable for both push and replace paths
        let state = null
        let processedNavigationContext = context

        if (shouldReplace) {
            // For replace, just increment and use the new sequence

            try {
                // First try structured clone (handles more types than JSON)
                if (context !== null) {
                    structuredClone(context)
                    processedNavigationContext = context
                }
                state = {
                    __navigationSequence: ++navigationSequence,
                    __svelte_spa_router_navigation_context: processedNavigationContext
                }
            } catch {
                // If structured clone fails, try JSON serialization
                try {
                    if (context !== null) {
                        const jsonString = JSON.stringify(context)
                        processedNavigationContext = JSON.parse(jsonString)
                        state = {
                            __navigationSequence: ++navigationSequence,
                            __svelte_spa_router_navigation_context: processedNavigationContext,
                            __svelte_spa_router_navigation_context_serialized: true
                        }
                    } else {
                        state = {
                            __navigationSequence: ++navigationSequence
                        }
                    }
                } catch (jsonError) {
                    // If JSON serialization also fails, don't store in history
                    console.warn('Navigation context data cannot be stored in history (not serializable). Navigation context will not persist on back/forward navigation.', jsonError)
                    state = {
                        __navigationSequence: ++navigationSequence
                    }
                }
            }
            window.history.replaceState(state, '', fullPath)
        } else {
            // For push:
            // 1. Save current entry with current sequence and current context (with referrer)
            // 2. Increment sequence
            // 3. Push new entry with new sequence and new context

            // Step 1: Save current entry (only if we have a history state)
            // On first navigation, history.state might be null, so we skip this
            if (history.state) {
                try {
                    const currentContext = navigationContextState  // Get current context with referrer

                    // Serialize context to handle Proxy objects in params
                    let serializableContext = currentContext
                    if (currentContext !== null) {
                        try {
                            structuredClone(currentContext)
                        } catch {
                            // If structured clone fails (e.g., Proxy objects), use JSON serialization
                            const jsonString = JSON.stringify(currentContext)
                            serializableContext = JSON.parse(jsonString)
                        }
                    }

                    history.replaceState({
                        ...history.state,
                        __svelte_spa_router_scrollX: window.scrollX,
                        __svelte_spa_router_scrollY: window.scrollY,
                        __navigationSequence: navigationSequence,  // Use CURRENT sequence
                        ...(serializableContext !== null && { __svelte_spa_router_navigation_context: serializableContext })
                    }, undefined)
                } catch (e) {
                    // If it fails, just ignore
                    console.warn('Failed to save state to history:', e)
                }
            }

            // Step 2 & 3: Increment and create new state
            try {
                // First try structured clone (handles more types than JSON)
                if (context !== null) {
                    structuredClone(context)
                    processedNavigationContext = context
                }
                state = {
                    __navigationSequence: ++navigationSequence,  // NOW increment
                    __svelte_spa_router_navigation_context: processedNavigationContext
                }
            } catch {
                // If structured clone fails, try JSON serialization
                try {
                    if (context !== null) {
                        const jsonString = JSON.stringify(context)
                        processedNavigationContext = JSON.parse(jsonString)
                        state = {
                            __navigationSequence: ++navigationSequence,
                            __svelte_spa_router_navigation_context: processedNavigationContext,
                            __svelte_spa_router_navigation_context_serialized: true
                        }
                    } else {
                        state = {
                            __navigationSequence: ++navigationSequence
                        }
                    }
                } catch (jsonError) {
                    // If JSON serialization also fails, don't store in history
                    console.warn('Navigation context data cannot be stored in history (not serializable). Navigation context will not persist on back/forward navigation.', jsonError)
                    state = {
                        __navigationSequence: ++navigationSequence
                    }
                }
            }

            window.history.pushState(state, '', fullPath)
        }

        // Manually trigger popstate to update location
        window.dispatchEvent(new PopStateEvent('popstate', { state }))
    }
}

/**
 * Navigates to a new page programmatically.
 *
 * Supports multiple signatures:
 * - push(location) - string, array, or object
 * - push(location, navigationContext) - with context data (legacy)
 * - push(route, routeParams, queryString, navigationContext) - multi-parameter
 * - push(route, routeParams, queryString, navigationContext, scrollOptions) - with scroll control
 *
 * @param {string|Array|LinkActionOpts} location - Path/route to navigate to
 * @param {any} [param2] - Route params (multi-param) or navigation context (legacy)
 * @param {any} [param3] - Query string (multi-param only)
 * @param {any} [param4] - Navigation context (multi-param only)
 * @param {Object} [param5] - Scroll options: { scrollBehavior: 'restore' | 'none' }
 * @return {Promise<void>} Promise that resolves after the page navigation has completed
 */
export async function push(location, param2, param3, param4, param5) {
    let opts
    let context = null
    let scrollOptions = {}

    // Detect signature based on arguments
    if (typeof location === 'string' && (param2 !== undefined && (typeof param2 === 'object' && !Array.isArray(param2)) || param3 !== undefined || param4 !== undefined)) {
        // Multi-parameter signature: push(route, routeParams, queryString, navigationContext, scrollOptions)
        const route = location
        const routeParams = param2 || {}
        const queryString = param3 || {}
        context = param4 || null
        scrollOptions = param5 || {}

        // Determine if route is a path (starts with /) or a named route
        if (route.startsWith('/')) {
            opts = { href: route, params: routeParams, query: queryString }
        } else {
            opts = { route, params: routeParams, query: queryString }
        }
    } else {
        // Legacy signatures: push(location) or push(location, navigationContext)
        if (typeof location === 'string') {
            // Check if it's a path (starts with /) or a named route
            if (location.startsWith('/') || location.startsWith('#/')) {
                opts = { href: location }
            } else {
                // Treat as named route
                opts = { route: location, params: {}, query: {} }
            }
        } else {
            opts = linkOpts(location)
        }

        // param2 is navigation context in legacy mode
        context = param2 !== undefined ? param2 : (opts.navigationContext || null)
    }

    // Build URL from route if needed
    const href = opts.route
        ? buildUrl(opts.route, opts.params, opts.query)
        : opts.href

    if (!href || href.length < 1 || (href.charAt(0) != '/' && href.indexOf('#/') !== 0)) {
        throw Error('Invalid parameter location')
    }

    // Inject the route identifier into navigationContext
    // Use route name if available (named route), otherwise use the href (URL path)
    // This allows the referrer tracking system to know which route the user came from
    context = {
        ...(context || {}),
        _routeName: opts.route || href
    }

    // Inject scroll behavior into context if specified
    if (scrollOptions.scrollBehavior) {
        navigationLogger.debug('Injecting scroll behavior into context:', scrollOptions.scrollBehavior)
        context.__scrollBehavior = scrollOptions.scrollBehavior
    }

    navigationLogger.debug('Navigating to:', href, 'with context:', context)

    // Execute this code when the current call stack is complete
    await tick()

    navigate(href, false, context)
}

/**
 * Navigates back in history (equivalent to pressing the browser's back button).
 *
 * @return {Promise<void>} Promise that resolves after the page navigation has completed
 */
export async function pop() {
    // Execute this code when the current call stack is complete
    await tick()

    window.history.back()
}

/**
 * Navigates back in browser history.
 *
 * This is equivalent to pressing the browser's back button or calling pop().
 * The referrer and scroll position are automatically restored from history.state.
 *
 * This function is a convenience alias for pop() that provides better semantics
 * when implementing "Go Back" buttons in your UI.
 *
 * @return {Promise<void>} Promise that resolves after navigation completes
 */
export async function goBack() {
    navigationLogger.debug('Going back in history')
    return pop()
}

/**
 * Replaces the current page but without modifying the history stack.
 *
 * Supports multiple signatures:
 * - replace(location) - string, array, or object
 * - replace(location, navigationContext) - with context data (legacy)
 * - replace(route, routeParams, queryString, navigationContext) - multi-parameter
 * - replace(route, routeParams, queryString, navigationContext, scrollOptions) - with scroll control
 *
 * @param {string|Array|LinkActionOpts} location - Path/route to navigate to
 * @param {any} [param2] - Route params (multi-param) or navigation context (legacy)
 * @param {any} [param3] - Query string (multi-param only)
 * @param {any} [param4] - Navigation context (multi-param only)
 * @param {Object} [param5] - Scroll options: { scrollBehavior: 'restore' | 'none' }
 * @return {Promise<void>} Promise that resolves after the page navigation has completed
 */
export async function replace(location, param2, param3, param4, param5) {
    let opts
    let context = null
    let scrollOptions = {}

    // Detect signature based on arguments
    if (typeof location === 'string' && (param2 !== undefined && (typeof param2 === 'object' && !Array.isArray(param2)) || param3 !== undefined || param4 !== undefined)) {
        // Multi-parameter signature: replace(route, routeParams, queryString, navigationContext, scrollOptions)
        const route = location
        const routeParams = param2 || {}
        const queryString = param3 || {}
        context = param4 || null
        scrollOptions = param5 || {}

        // Determine if route is a path (starts with /) or a named route
        if (route.startsWith('/')) {
            opts = { href: route, params: routeParams, query: queryString }
        } else {
            opts = { route, params: routeParams, query: queryString }
        }
    } else {
        // Legacy signatures: replace(location) or replace(location, navigationContext)
        if (typeof location === 'string') {
            // Check if it's a path (starts with /) or a named route
            if (location.startsWith('/') || location.startsWith('#/')) {
                opts = { href: location }
            } else {
                // Treat as named route
                opts = { route: location, params: {}, query: {} }
            }
        } else {
            opts = linkOpts(location)
        }

        // param2 is navigation context in legacy mode
        context = param2 !== undefined ? param2 : (opts.navigationContext || null)
    }

    // Build URL from route if needed
    const href = opts.route
        ? buildUrl(opts.route, opts.params, opts.query)
        : opts.href

    if (!href || href.length < 1 || (href.charAt(0) != '/' && href.indexOf('#/') !== 0)) {
        throw Error('Invalid parameter location')
    }

    // Inject the route identifier into navigationContext
    // Use route name if available (named route), otherwise use the href (URL path)
    // This allows the referrer tracking system to know which route the user came from
    context = {
        ...(context || {}),
        _routeName: opts.route || href
    }

    // Inject scroll behavior into context if specified
    if (scrollOptions.scrollBehavior) {
        navigationLogger.debug('Injecting scroll behavior into context:', scrollOptions.scrollBehavior)
        context.__scrollBehavior = scrollOptions.scrollBehavior
    }

    navigationLogger.debug('Navigating to:', href, 'with context:', context)

    // Execute this code when the current call stack is complete
    await tick()

    navigate(href, true, context)
}

/**
 * Dictionary with options for the link action.
 * @typedef {Object} LinkActionOpts
 * @property {string} [href] - A string to use in place of the link's href attribute. Using this allows for updating link's targets reactively.
 * @property {string} [route] - Named route to navigate to (requires route to be registered)
 * @property {Object.<string, any>} [params] - Route parameters (used with route option)
 * @property {Object.<string, any>} [query] - Query string parameters
 * @property {boolean} [disabled] - If true, link is disabled
 * @property {boolean} [replace] - If true, replaces current history entry instead of pushing
 */

/**
 * Svelte Action that enables a link element (`<a>`) to use our history management.
 *
 * Supports multiple usage patterns:
 *
 * ````html
 * <!-- Old style (still works) -->
 * <a href="/books" use:link>View books</a>
 *
 * <!-- Direct href with object syntax -->
 * <a use:link={{href: '/books'}}>View books</a>
 *
 * <!-- Named routes with params -->
 * <a use:link={{route: 'bookDetail', params: {bookId: 123}}}>View book</a>
 *
 * <!-- Array shorthand [routeName, params] -->
 * <a use:link={['bookDetail', {bookId: 123}]}>View book</a>
 *
 * <!-- With query string -->
 * <a use:link={{route: 'books', query: {category: 'fiction'}}}>Fiction books</a>
 * ````
 *
 * @param {HTMLElement} node - The target node (automatically set by Svelte). Must be an anchor tag (`<a>`) with a href attribute starting in `/`
 * @param {string|Array|LinkActionOpts} opts - Options: string (href), array [route, params], or object with href/route/params/query
 */
export function link(node, opts) {
    opts = linkOpts(opts)

    // Only apply to <a> tags
    if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
        throw Error('Action "link" can only be used with <a> tags')
    }

    updateLink(node, opts)

    return {
        update(updated) {
            updated = linkOpts(updated)
            updateLink(node, updated)
        }
    }
}

/**
 * Tries to restore the scroll state from the given history state.
 *
 * @param {{__svelte_spa_router_scrollX: number, __svelte_spa_router_scrollY: number}} [state] - The history state to restore from.
 */
export function restoreScroll(state) {
    // If this exists, then this is a back navigation: restore the scroll position
    if (state) {
        const scrollX = state.__svelte_spa_router_scrollX
        const scrollY = state.__svelte_spa_router_scrollY
        scrollLogger.debug('Restoring scroll to:', { scrollX, scrollY })
        window.scrollTo(scrollX, scrollY)
    }
    else {
        scrollLogger.debug('No state provided, scrolling to top')
        // Otherwise this is a forward navigation: scroll to top
        window.scrollTo(0, 0)
    }
}

// Internal function used by the link function
function updateLink(node, opts) {
    let href

    // Build href from route if specified
    if (opts.route) {
        href = buildUrl(opts.route, opts.params, opts.query)
    } else {
        href = opts.href || node.getAttribute('href')

        // Add query string if provided with href
        if (href && opts.query && Object.keys(opts.query).length > 0) {
            const queryString = Object.entries(opts.query)
                .filter(([, value]) => value !== undefined && value !== null)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
                .join('&')

            if (queryString) {
                href += (href.includes('?') ? '&' : '?') + queryString
            }
        }
    }

    if (hashRoutingEnabled) {
        // Hash mode - same as before
        // Destination must start with '/' or '#/'
        if (href && href.charAt(0) == '/') {
            // Add # to the href attribute
            href = '#' + href
        }
        else if (!href || href.length < 2 || href.slice(0, 2) != '#/') {
            throw Error('Invalid value for "href" attribute: ' + href)
        }

        node.setAttribute('href', href)
        node.addEventListener('click', (event) => {
            // Prevent default anchor onclick behaviour
            event.preventDefault()
            if (!opts.disabled) {
                scrollstateHistoryHandler(event.currentTarget.getAttribute('href'))
            }
        })
    } else {
        // History mode - enhanced with modifier key support
        // Normalize href
        if (href && href.charAt(0) == '#') {
            href = href.substring(1) // Remove # prefix
        }
        if (!href || href.charAt(0) != '/') {
            throw Error('Invalid value for "href" attribute: ' + href)
        }

        // Prepend basePath for display
        const fullPath = basePath !== '/' ? joinPaths(basePath, href) : href
        node.setAttribute('href', fullPath)

        node.addEventListener('click', (event) => {
            // Check for target attribute
            const target = node.getAttribute('target')
            if (target && target !== '_self') {
                // Let browser handle links with target attribute
                return
            }

            // Check for modifier keys (Ctrl, Shift, Meta/Cmd, Alt)
            if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) {
                // Let browser handle modified clicks
                return
            }

            // Prevent default and use our navigation
            event.preventDefault()

            if (!opts.disabled) {
                // Save scroll state
                history.replaceState({...history.state, __svelte_spa_router_scrollX: window.scrollX, __svelte_spa_router_scrollY: window.scrollY}, undefined)

                // Navigate
                if (opts.replace) {
                    navigate(href, true)
                } else {
                    navigate(href, false)
                }
            }
        })
    }
}

// Internal function that ensures the argument of the link action is always an object
function linkOpts(val) {
    // Handle array format: [route, params, query, navigationContext]
    if (Array.isArray(val)) {
        const [route, params = {}, query = {}, navigationContext] = val
        return { route, params, query, navigationContext }
    }

    // Handle string format (legacy): just an href
    if (val && typeof val == 'string') {
        return { href: val }
    }

    // Handle object format or null/undefined
    return val || {}
}

/**
 * The handler attached to an anchor tag responsible for updating the
 * current history state with the current scroll state
 *
 * @param {string} href - Destination
 */
function scrollstateHistoryHandler(href) {
    // Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    history.replaceState({...history.state, __svelte_spa_router_scrollX: window.scrollX, __svelte_spa_router_scrollY: window.scrollY}, undefined)
    // This will force an update as desired, but this time our scroll state will be attached
    window.location.hash = href
}
