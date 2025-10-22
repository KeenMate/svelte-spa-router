import {parse} from 'regexparam'
import {getHashRoutingEnabled, getBasePath} from './utils.svelte.js'

// List of nodes to update
const nodes = []

// Get current location from hash or pathname
function getCurrentLocation() {
    const hashRoutingEnabled = getHashRoutingEnabled()
    const basePath = getBasePath()

    if (hashRoutingEnabled) {
        // Hash mode
        const hashPosition = window.location.href.indexOf('#/')
        let location = (hashPosition > -1) ? window.location.href.substr(hashPosition + 1) : '/'

        // Check if there's a querystring
        const qsPosition = location.indexOf('?')
        if (qsPosition > -1) {
            const querystring = location.substr(qsPosition + 1)
            location = location.substr(0, qsPosition)
            return location + '?' + querystring
        }

        return location
    } else {
        // History mode
        let location = window.location.pathname

        // Remove basePath prefix
        if (basePath !== '/' && location.startsWith(basePath)) {
            location = location.substring(basePath.length) || '/'
        }

        // Ensure location starts with /
        if (!location.startsWith('/')) {
            location = '/' + location
        }

        // Add querystring if present
        if (window.location.search) {
            location += window.location.search
        }

        return location
    }
}

// Current location
let currentLocation = typeof window !== 'undefined' ? getCurrentLocation() : ''

// Function that updates all nodes marking the active ones
function checkActive(el) {
    const matchesLocation = el.pattern.test(currentLocation)
    toggleClasses(el, el.className, matchesLocation)
    toggleClasses(el, el.inactiveClassName, !matchesLocation)
}

function toggleClasses(el, className, shouldAdd) {
    (className || '').split(' ').forEach((cls) => {
        if (!cls) {
            return
        }
        // Remove the class first
        el.node.classList.remove(cls)

        // If the pattern matches, add the class
        if (shouldAdd) {
            el.node.classList.add(cls)
        }
    })
}

// Update all active states when location changes
function updateAllNodes() {
    currentLocation = getCurrentLocation()
    nodes.forEach(checkActive)
}

// Listen to navigation events
if (typeof window !== 'undefined') {
    // Listen to hashchange for hash mode
    window.addEventListener('hashchange', updateAllNodes, false)
    // Listen to popstate for history mode
    window.addEventListener('popstate', updateAllNodes, false)
}

/**
 * @typedef {Object} ActiveOptions
 * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
 * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
 */

/**
 * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
 *
 * @param {HTMLElement} node - The target node (automatically set by Svelte)
 * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
 * @returns {{destroy: function(): void}} Destroy function
 */
export default function active(node, opts) {
    // Check options
    if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
        // Interpret strings and regular expressions as opts.path
        opts = {
            path: opts
        }
    }
    else {
        // Ensure opts is a dictionary
        opts = opts || {}
    }

    // Path defaults to link target
    if (!opts.path && node.hasAttribute('href')) {
        opts.path = node.getAttribute('href')
        if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
            opts.path = opts.path.substring(1)
        }
    }

    // Default class name
    if (!opts.className) {
        opts.className = 'active'
    }

    // If path is a string, it must start with '/' or '*'
    if (!opts.path ||
        typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
    ) {
        throw Error('Invalid value for "path" argument')
    }

    // If path is not a regular expression already, make it
    const {pattern} = typeof opts.path == 'string' ?
        parse(opts.path) :
        {pattern: opts.path}

    // Add the node to the list
    const el = {
        node,
        className: opts.className,
        inactiveClassName: opts.inactiveClassName,
        pattern
    }
    nodes.push(el)

    // Update current location before checking (ensures we have the latest routing mode config)
    currentLocation = getCurrentLocation()

    // Trigger the action right away
    checkActive(el)

    return {
        // When the element is destroyed, remove it from the list
        destroy() {
            nodes.splice(nodes.indexOf(el), 1)
        }
    }
}
