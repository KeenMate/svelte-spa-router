/**
 * URL helper utilities for path manipulation
 */

/**
 * Joins multiple path segments intelligently
 * - Removes duplicate slashes
 * - Preserves trailing slash on last segment if present
 * - Handles empty segments
 *
 * @param {...string} paths - Path segments to join
 * @returns {string} Joined path
 *
 * @example
 * joinPaths('/app', 'user', 'profile') // '/app/user/profile'
 * joinPaths('/app/', '/user/', '/profile') // '/app/user/profile'
 * joinPaths('', 'user', '') // '/user'
 */
export function joinPaths(...paths) {
    if (!paths || !paths.length) {
        return '/'
    }

    // Track if we should start with /
    const startsWithSlash = paths.some(x => x && x.trim().startsWith('/'))

    const joined = paths
        .map(x => x.trim())
        .filter(x => x)
        .map((x, i, arr) => {
            if (i === 0) {
                // First segment: remove trailing slash
                return x.replace(/\/$/, '')
            } else if (i < arr.length - 1) {
                // Middle segments: remove leading and trailing slashes
                return x.replace(/(^\/|\/$)/g, '')
            } else {
                // Last segment: remove leading slash only
                return x.replace(/^\//, '')
            }
        })
        .map(x => x.trim())
        .filter(x => x)
        .join('/')

    // Ensure leading slash if any input had one
    return startsWithSlash && !joined.startsWith('/') ? '/' + joined : joined
}
