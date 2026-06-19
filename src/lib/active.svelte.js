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

function splitClasses(s) {
    return (s || '').split(' ').filter(Boolean)
}

/**
 * Sync the className / inactiveClassName state on a single node by aggregating
 * across every `use:active` entry that targets it. Stacking actions on the
 * same node — e.g. `use:active use:active={'/foo/*'}` for a sidebar parent
 * that should light up on both `/foo` and `/foo/bar` — depends on this. An
 * earlier implementation per-entry remove-then-maybe-add was order-dependent
 * and the last entry could strip a class the previous one added.
 *
 * Rules:
 *   - Active class is present iff ANY entry's pattern matches.
 *   - Inactive class is present iff NO entry that declared it matches —
 *     i.e., the element is fully inactive. Without this aggregation, a single
 *     non-matching entry would force the inactive class on, even when a
 *     sibling action says the element IS active.
 */
function syncClassesForNode(node) {
    const activeMatched = Object.create(null)   // class → any entry matched
    const inactiveMatched = Object.create(null) // class → any controlling entry matched

    for (const entry of nodes) {
        if (entry.node !== node) continue
        const matches = entry.pattern.test(currentLocation)
        for (const cls of splitClasses(entry.className)) {
            activeMatched[cls] = activeMatched[cls] || matches
        }
        for (const cls of splitClasses(entry.inactiveClassName)) {
            inactiveMatched[cls] = inactiveMatched[cls] || matches
        }
    }

    for (const cls in activeMatched) {
        if (activeMatched[cls]) node.classList.add(cls)
        else node.classList.remove(cls)
    }
    for (const cls in inactiveMatched) {
        if (inactiveMatched[cls]) node.classList.remove(cls)
        else node.classList.add(cls)
    }
}

// Update all active states when location changes. Sync each unique node
// once — multiple entries on the same node are coalesced inside syncClassesForNode.
function updateAllNodes() {
    currentLocation = getCurrentLocation()
    const seen = new WeakSet()
    for (const entry of nodes) {
        if (seen.has(entry.node)) continue
        seen.add(entry.node)
        syncClassesForNode(entry.node)
    }
}

// Listen to navigation events
if (typeof window !== 'undefined') {
    // Listen to hashchange for hash mode
    window.addEventListener('hashchange', updateAllNodes, false)
    // Listen to popstate for history mode
    window.addEventListener('popstate', updateAllNodes, false)
}

function readHref(node) {
    if (!node.hasAttribute('href')) return null
    let href = node.getAttribute('href')
    if (href && href.length > 1 && href.charAt(0) == '#') {
        href = href.substring(1)
    }
    return href
}

function assertValidPathString(p) {
    if (typeof p != 'string') return
    if (p.length < 1 || (p.charAt(0) != '/' && p.charAt(0) != '*')) {
        throw Error('Invalid value for "path" argument')
    }
}

/**
 * @typedef {Object} ActiveOptions
 * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href. Ignored when `subtree: true`.
 * @property {string} [className] - CSS class to apply to the element when active; default "active"
 * @property {string} [inactiveClassName] - CSS class to apply when not matching
 * @property {boolean} [subtree] - Match the link's `href` exactly AND any descendant path. Sidebar parents stay highlighted on their own index page and every nested URL without writing a regex.
 * @property {string} [subtreeClassName] - Class used for the descendants pattern when `subtree: true`. Defaults to `className`. Set distinct from `className` to style "really active" vs "parent of active" separately (e.g. `link-active` / `sublink-active`).
 */

/**
 * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
 *
 * @param {HTMLElement} node - The target node (automatically set by Svelte)
 * @param {ActiveOptions|string|RegExp} [opts] - Options object, or a string/RegExp shorthand for `opts.path`.
 * @returns {{destroy: function(): void}} Destroy function
 */
export default function active(node, opts) {
    if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
        opts = { path: opts }
    } else {
        opts = opts || {}
    }

    const className = opts.className || 'active'
    const inactiveClassName = opts.inactiveClassName
    const ownEntries = []

    if (opts.subtree) {
        // Subtree mode: derive both patterns from the element's href. Saves
        // callers from writing /^\/foo(\/|$)/ by hand and lets a generated
        // nav (e.g. walked from createHierarchy() input) light up parents on
        // their own index AND every descendant URL.
        const href = readHref(node)
        if (!href) {
            throw Error('use:active with subtree:true requires the element to have an href')
        }
        assertValidPathString(href)

        const exactEntry = {
            node,
            className,
            inactiveClassName,
            pattern: parse(href).pattern
        }
        const descEntry = {
            node,
            className: opts.subtreeClassName || className,
            pattern: parse(href + '/*').pattern
        }
        ownEntries.push(exactEntry, descEntry)
    } else {
        let path = opts.path
        if (!path) {
            path = readHref(node)
        }
        assertValidPathString(path)
        if (!path) {
            throw Error('Invalid value for "path" argument')
        }
        const pattern = typeof path == 'string' ? parse(path).pattern : path
        ownEntries.push({ node, className, inactiveClassName, pattern })
    }

    for (const entry of ownEntries) nodes.push(entry)

    // Update current location before syncing (ensures we have the latest routing mode config)
    currentLocation = getCurrentLocation()
    syncClassesForNode(node)

    return {
        destroy() {
            for (const entry of ownEntries) {
                const idx = nodes.indexOf(entry)
                if (idx >= 0) nodes.splice(idx, 1)
            }
        }
    }
}
