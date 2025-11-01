/**
 * Generic category-based logging utility
 *
 * Provides a flexible logging system with:
 * - Multiple log levels (debug, info, warn, error)
 * - Category-based filtering
 * - Custom prefixes and colors
 *
 * This is an internal utility not exposed to end users.
 */

// Track which categories are enabled
const enabledCategories = new Set()

/**
 * Enable logging for a specific category
 * @param {string} category - Category name to enable
 */
export function enableLoggingCategory(category) {
    enabledCategories.add(category)
}

/**
 * Disable logging for a specific category
 * @param {string} category - Category name to disable
 */
export function disableLoggingCategory(category) {
    enabledCategories.delete(category)
}

/**
 * Check if a category is enabled
 * @param {string} category - Category name to check
 * @returns {boolean} true if category is enabled
 */
export function isLoggingCategoryEnabled(category) {
    return enabledCategories.has(category)
}

/**
 * Internal log function that handles all logging
 * @param {string} level - Log level (debug, info, warn, error)
 * @param {string} category - Category name
 * @param {string} prefix - Display prefix (e.g., '[Router]')
 * @param {string} color - CSS color for prefix
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments to log
 */
function log(level, category, prefix, color, message, ...args) {
    // Check if category is enabled
    if (!enabledCategories.has(category)) {
        return
    }

    // Select appropriate console method
    const method = level === 'warn' ? console.warn :
                   level === 'error' ? console.error :
                   level === 'info' ? console.info :
                   console.log

    // Log with CSS styling
    method(
        `%c${prefix}%c ${message}`,
        `color: ${color}; font-weight: bold;`,
        'color: inherit;',
        ...args
    )
}

/**
 * Create a logger instance for a specific category
 *
 * @param {string} category - Category identifier (e.g., 'router', 'router-utils')
 * @param {string} prefix - Display prefix (e.g., '[Router]')
 * @param {string} color - CSS color for the prefix (e.g., '#ff3e00')
 * @returns {Object} Logger instance with debug, info, warn, error methods
 *
 * @example
 * const logger = createLogger('router', '[Router]', '#ff3e00')
 * logger.debug('Route matched:', route)
 * logger.warn('No match found for:', path)
 */
export function createLogger(category, prefix, color) {
    return {
        /**
         * Log debug-level message
         * @param {string} message - Message to log
         * @param {...any} args - Additional arguments
         */
        debug: (message, ...args) => {
            log('debug', category, prefix, color, message, ...args)
        },

        /**
         * Log info-level message
         * @param {string} message - Message to log
         * @param {...any} args - Additional arguments
         */
        info: (message, ...args) => {
            log('info', category, prefix, color, message, ...args)
        },

        /**
         * Log warning-level message
         * @param {string} message - Message to log
         * @param {...any} args - Additional arguments
         */
        warn: (message, ...args) => {
            log('warn', category, prefix, color, message, ...args)
        },

        /**
         * Log error-level message
         * @param {string} message - Message to log
         * @param {...any} args - Additional arguments
         */
        error: (message, ...args) => {
            log('error', category, prefix, color, message, ...args)
        }
    }
}
