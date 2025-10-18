import { parse as regexparamParse } from 'regexparam'

/**
 * Enhanced route pattern parser that supports static prefixes with parameters.
 *
 * Supports patterns like:
 * - /users/:id - standard parameter (handled by regexparam)
 * - /project-:code - static prefix "project-" with parameter
 * - /user-:id/post-:postId - multiple prefixed parameters
 *
 * @param {string} pattern - Route pattern to parse
 * @returns {{pattern: RegExp, keys: string[]}} Compiled regex and parameter keys
 */
export function parse(pattern) {
    // Check if pattern contains static prefix patterns (text-:param)
    // Match: word characters followed by dash and colon (e.g., "project-:")
    const hasPrefixPattern = /\w+-:/g.test(pattern)

    if (!hasPrefixPattern) {
        // No prefix patterns, use regexparam as-is
        return regexparamParse(pattern)
    }

    // Parse pattern with static prefixes
    const keys = []
    let regexPattern = pattern

    // Replace prefix patterns: "project-:code" -> capture group
    // Match pattern: (word chars)-(colon)(param name)
    regexPattern = regexPattern.replace(/(\w+)-:(\w+)/g, (match, prefix, paramName) => {
        keys.push(paramName)
        // Create regex: match the prefix literally, then capture the rest
        return `${prefix}-([^/]+?)`
    })

    // Replace remaining standard parameters: ":id" -> capture group
    regexPattern = regexPattern.replace(/:(\w+)/g, (match, paramName) => {
        keys.push(paramName)
        return '([^/]+?)'
    })

    // Handle wildcards
    regexPattern = regexPattern.replace(/\*/g, '(.*)')

    // Escape forward slashes and other regex special chars
    regexPattern = regexPattern.replace(/\//g, '\\/')

    // Make trailing slash optional and add anchors
    regexPattern = `^${regexPattern}\\/?$`

    // Compile regex (case-insensitive)
    const pattern_regex = new RegExp(regexPattern, 'i')

    return {
        pattern: pattern_regex,
        keys: keys.length > 0 ? keys : false
    }
}
