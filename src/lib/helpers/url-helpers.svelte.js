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

/**
 * Serializes a plain object into a URL querystring (without the leading '?').
 * Null/undefined values are skipped. Keys and values are URL-encoded.
 *
 * @param {Object} query - Object to serialize
 * @returns {string} Querystring without leading '?' (empty string if no entries)
 *
 * @example
 * serializeQuery({ foo: 'bar', baz: 1 }) // 'foo=bar&baz=1'
 * serializeQuery({ foo: null, baz: 'x' }) // 'baz=x'
 * serializeQuery({}) // ''
 */
export function serializeQuery(query) {
    if (!query || typeof query !== 'object' || Object.keys(query).length === 0) {
        return ''
    }

    return Object.entries(query)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')
}
