/**
 * Logging configuration using loglevel with categorized loggers
 *
 * Categories:
 * - ROUTER: Core routing pipeline, route matching, component loading (Router.svelte)
 * - ROUTER:NAVIGATION: Navigation functions like push, pop, replace, goBack (utils.svelte.js)
 * - ROUTER:SCROLL: Scroll restoration and positioning (Router.svelte, utils.svelte.js)
 * - ROUTER:GUARDS: Navigation guards and beforeLeave callbacks (Router.svelte)
 * - ROUTER:CONDITIONS: Route condition evaluation (Router.svelte)
 * - ROUTER:HIERARCHY: Hierarchical route inheritance (Router.svelte)
 * - ROUTER:PERMISSIONS: Permission checking and authorization (permissions.svelte.js)
 * - ROUTER:ROUTES: Named routes and URL building (routes.svelte.js)
 * - ROUTER:ZONES: Multi-zone routing (Router.svelte)
 * - ROUTER:METADATA: Breadcrumbs and route metadata (route-metadata.svelte.js)
 * - ROUTER:ERROR_HANDLER: Global error handling and recovery (error-handler.svelte.js, GlobalErrorHandler.svelte)
 * - ROUTER:FILTERS: Filter parsing (filters.svelte.js)
 *
 * Usage:
 * - By default, all logging is disabled (silent mode) for production
 * - Enable logging in browser console:
 *   ```javascript
 *   import { enableLogging, setLogLevel, setCategoryLevel } from '@keenmate/svelte-spa-router/logger';
 *
 *   // Enable all logging at debug level
 *   enableLogging();
 *
 *   // Or set a specific log level
 *   setLogLevel('info');  // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'
 *
 *   // Or configure specific categories
 *   disableLogging();  // First disable all
 *   setCategoryLevel('ROUTER:SCROLL', 'debug');  // Enable only scroll logs
 *   setCategoryLevel('ROUTER:NAVIGATION', 'info');  // Enable navigation logs at info level
 *   setCategoryLevel('ROUTER:PERMISSIONS', 'silent');  // Disable permission logs
 *   ```
 */

// Import vendored libraries via ES module wrappers
import log from './vendor/loglevel/index.js';
import prefix from './vendor/loglevel/prefix.js';

// Define color scheme
const COLORS = {
    debug: '#0ea5e9',  // Blue
    info: '#10b981',   // Green
    warn: '#f59e0b',   // Orange
    error: '#ef4444'   // Red
};

// Register prefix plugin with the root logger
prefix.reg(log);

// Configure prefix plugin with color-coded formatting
prefix.apply(log, {
    format(level: string, name: string | undefined, timestamp: string) {
        // Get color for the current log level
        const color = COLORS[level.toLowerCase() as keyof typeof COLORS] || '#666';

        // Return formatted prefix with color styling
        return `%c[${timestamp}]%c %c[${level}]%c ${name ? `%c[${name}]%c ` : ''}`;
    },
    timestampFormatter(date: Date) {
        // Format: HH:MM:SS.mmm
        return date.toTimeString().split(' ')[0] + '.' + date.getMilliseconds().toString().padStart(3, '0');
    }
});

// Apply color styling to console output using a custom method factory
const originalFactory = log.methodFactory;
log.methodFactory = function(methodName: string, logLevel: number, loggerName: string) {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);

    return function(...args: any[]) {
        // If first arg contains %c color codes, inject the colors
        if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('%c')) {
            const color = COLORS[methodName as keyof typeof COLORS] || '#666';
            const coloredArgs = [
                args[0],
                `color: ${color}; font-weight: bold;`,  // timestamp color
                'color: inherit;',                        // reset
                `color: ${color}; font-weight: bold;`,  // level color
                'color: inherit;',                        // reset
                ...(loggerName ? [
                    `color: ${color}; font-weight: bold;`,  // name color
                    'color: inherit;',                        // reset
                ] : []),
                ...args.slice(1)
            ];
            rawMethod(...coloredArgs);
        } else {
            rawMethod(...args);
        }
    };
};

// Set default log level to silent (production mode)
// Can be changed at runtime via setLogLevel()
log.setLevel('silent');

// Create category-specific loggers with hierarchical naming
export const routerLogger = log.getLogger('ROUTER');
export const navigationLogger = log.getLogger('ROUTER:NAVIGATION');
export const scrollLogger = log.getLogger('ROUTER:SCROLL');
export const guardsLogger = log.getLogger('ROUTER:GUARDS');
export const conditionsLogger = log.getLogger('ROUTER:CONDITIONS');
export const hierarchyLogger = log.getLogger('ROUTER:HIERARCHY');
export const permissionsLogger = log.getLogger('ROUTER:PERMISSIONS');
export const routesLogger = log.getLogger('ROUTER:ROUTES');
export const zonesLogger = log.getLogger('ROUTER:ZONES');
export const metadataLogger = log.getLogger('ROUTER:METADATA');
export const errorHandlerLogger = log.getLogger('ROUTER:ERROR_HANDLER');
export const filtersLogger = log.getLogger('ROUTER:FILTERS');

// Apply prefix and color styling to all category loggers
const allLoggers = [
    routerLogger,
    navigationLogger,
    scrollLogger,
    guardsLogger,
    conditionsLogger,
    hierarchyLogger,
    permissionsLogger,
    routesLogger,
    zonesLogger,
    metadataLogger,
    errorHandlerLogger,
    filtersLogger
];

allLoggers.forEach(logger => {
    prefix.apply(logger, {
        format(level: string, name: string | undefined, timestamp: string) {
            const color = COLORS[level.toLowerCase() as keyof typeof COLORS] || '#666';
            return `%c[${timestamp}]%c %c[${level}]%c %c[${name}]%c `;
        },
        timestampFormatter(date: Date) {
            return date.toTimeString().split(' ')[0] + '.' + date.getMilliseconds().toString().padStart(3, '0');
        }
    });

    // Apply color-aware method factory to category loggers
    const catOriginalFactory = logger.methodFactory;
    logger.methodFactory = function(methodName: string, logLevel: number, loggerName: string) {
        const rawMethod = catOriginalFactory(methodName, logLevel, loggerName);

        return function(...args: any[]) {
            if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('%c')) {
                const color = COLORS[methodName as keyof typeof COLORS] || '#666';
                const coloredArgs = [
                    args[0],
                    `color: ${color}; font-weight: bold;`,  // timestamp
                    'color: inherit;',
                    `color: ${color}; font-weight: bold;`,  // level
                    'color: inherit;',
                    `color: ${color}; font-weight: bold;`,  // category name
                    'color: inherit;',
                    ...args.slice(1)
                ];
                rawMethod(...coloredArgs);
            } else {
                rawMethod(...args);
            }
        };
    };

    logger.setLevel('silent');
});

// Export the default logger
export default log;

/**
 * Enable logging for all loggers
 * @param level Log level to set ('trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent')
 */
export const setLogLevel = (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent') => {
    log.setLevel(level);
    allLoggers.forEach(logger => logger.setLevel(level));
};

/**
 * Enable all logging (set to debug level)
 */
export const enableLogging = () => {
    setLogLevel('debug');
};

/**
 * Disable all logging (set to silent level)
 */
export const disableLogging = () => {
    setLogLevel('silent');
};

/**
 * Set log level for a specific category
 * @param category Category logger to configure
 * @param level Log level to set (default: 'debug')
 */
export const setCategoryLevel = (
    category: 'ROUTER' | 'ROUTER:NAVIGATION' | 'ROUTER:SCROLL' | 'ROUTER:GUARDS' | 'ROUTER:CONDITIONS' |
              'ROUTER:HIERARCHY' | 'ROUTER:PERMISSIONS' | 'ROUTER:ROUTES' | 'ROUTER:ZONES' |
              'ROUTER:METADATA' | 'ROUTER:ERROR_HANDLER' | 'ROUTER:FILTERS',
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent' = 'debug'
) => {
    const loggerMap = {
        'ROUTER': routerLogger,
        'ROUTER:NAVIGATION': navigationLogger,
        'ROUTER:SCROLL': scrollLogger,
        'ROUTER:GUARDS': guardsLogger,
        'ROUTER:CONDITIONS': conditionsLogger,
        'ROUTER:HIERARCHY': hierarchyLogger,
        'ROUTER:PERMISSIONS': permissionsLogger,
        'ROUTER:ROUTES': routesLogger,
        'ROUTER:ZONES': zonesLogger,
        'ROUTER:METADATA': metadataLogger,
        'ROUTER:ERROR_HANDLER': errorHandlerLogger,
        'ROUTER:FILTERS': filtersLogger
    };
    loggerMap[category].setLevel(level);
};

/**
 * Helper function to log structured data (objects/arrays)
 * Since loglevel doesn't natively support structured logging, this helper
 * ensures consistent formatting of complex data types.
 *
 * @param logger Logger instance to use
 * @param level Log level ('trace' | 'debug' | 'info' | 'warn' | 'error')
 * @param message Message string
 * @param data Optional data object to log
 */
export const logStructured = (
    logger: any,
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
) => {
    if (data !== undefined) {
        logger[level](message, data);
    } else {
        logger[level](message);
    }
};
