import { tick } from 'svelte'
import { joinPaths } from './helpers/url-helpers.svelte.js'
import { buildUrl, hasRoute } from './routes.svelte.js'

/**
 * @typedef {Object} Location
 * @property {string} location - Location (page/view), for example `/book`
 * @property {string} [querystring] - Querystring from the hash, as a string not parsed
 */

// Configuration state - must be set before app initialization
let hashRoutingEnabled = $state(true)
let basePath = $state('/')

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

// Reactive location state
let locationState = $state(getLocation())

// Listen to navigation events
if (typeof window !== 'undefined') {
    // Listen to hashchange for hash mode
    window.addEventListener('hashchange', () => {
        if (hashRoutingEnabled) {
            locationState = getLocation()
        }
    }, false)

    // Listen to popstate for history mode (back/forward buttons)
    window.addEventListener('popstate', () => {
        if (!hashRoutingEnabled) {
            locationState = getLocation()
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
 * Get current params
 */
export function params() {
    return paramsState
}

/**
 * Internal function to set params (used by router)
 */
export function setParams(newParams) {
    paramsState = newParams
}

/**
 * Internal navigation function supporting both hash and history modes
 *
 * @param {string} location - Path to navigate to
 * @param {boolean} shouldReplace - If true, replaces current history entry instead of pushing
 * @private
 */
function navigate(location, shouldReplace = false) {
    if (hashRoutingEnabled) {
        // Hash mode - same as before
        const dest = (location.charAt(0) == '#' ? '' : '#') + location
        if (shouldReplace) {
            window.location.replace(dest)
        } else {
            // Save scroll state before navigation
            history.replaceState({...history.state, __svelte_spa_router_scrollX: window.scrollX, __svelte_spa_router_scrollY: window.scrollY}, undefined)
            window.location.hash = dest
        }
    } else {
        // History mode - use pushState/replaceState
        const fullPath = basePath !== '/' ? joinPaths(basePath, location) : location
        // Note: Don't append window.location.search here - the location parameter
        // already contains the querystring if one should be present

        if (shouldReplace) {
            window.history.replaceState({}, '', fullPath)
        } else {
            // Save scroll state before navigation
            history.replaceState({...history.state, __svelte_spa_router_scrollX: window.scrollX, __svelte_spa_router_scrollY: window.scrollY}, undefined)
            window.history.pushState({}, '', fullPath)
        }

        // Manually trigger popstate to update location
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    }
}

/**
 * Navigates to a new page programmatically.
 *
 * @param {string} location - Path to navigate to (must start with `/` or '#/')
 * @return {Promise<void>} Promise that resolves after the page navigation has completed
 */
export async function push(location) {
    if (!location || location.length < 1 || (location.charAt(0) != '/' && location.indexOf('#/') !== 0)) {
        throw Error('Invalid parameter location')
    }

    // Execute this code when the current call stack is complete
    await tick()

    navigate(location, false)
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
 * Replaces the current page but without modifying the history stack.
 *
 * @param {string} location - Path to navigate to (must start with `/` or '#/')
 * @return {Promise<void>} Promise that resolves after the page navigation has completed
 */
export async function replace(location) {
    if (!location || location.length < 1 || (location.charAt(0) != '/' && location.indexOf('#/') !== 0)) {
        throw Error('Invalid parameter location')
    }

    // Execute this code when the current call stack is complete
    await tick()

    if (hashRoutingEnabled) {
        // Hash mode - use history.replaceState
        const dest = (location.charAt(0) == '#' ? '' : '#') + location
        try {
            const newState = {
                ...history.state
            }
            delete newState['__svelte_spa_router_scrollX']
            delete newState['__svelte_spa_router_scrollY']
            window.history.replaceState(newState, undefined, dest)
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Caught exception while replacing the current page. If you\'re running this in the Svelte REPL, please note that the `replace` method might not work in this environment.')
        }

        // The method above doesn't trigger the hashchange event, so let's do that manually
        window.dispatchEvent(new Event('hashchange'))
    } else {
        // History mode - use navigate with shouldReplace=true
        navigate(location, true)
    }
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
        window.scrollTo(state.__svelte_spa_router_scrollX, state.__svelte_spa_router_scrollY)
    }
    else {
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
    // Handle array format: ['routeName', {params}]
    if (Array.isArray(val)) {
        const [route, params = {}, query = {}] = val
        return { route, params, query }
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
