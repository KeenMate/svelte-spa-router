// Main router export (both default and named for flexibility)
export { default, default as Router } from './Router.svelte';

// Core utilities
export * from './utils.svelte.js';
export * from './constants.js';
export { default as wrap } from './wrap.js';

// Named routes system
export * from './routes.svelte.js';

// Helpers
export * from './helpers/permissions.svelte.js';
export * from './helpers/url-helpers.svelte.js';

// Querystring helpers (individual functions)
export * from './helpers/querystring-helpers.svelte.js';

// Querystring helpers (shared reactive state - recommended)
export * from './helpers/querystring.svelte.js';

// Filters helpers (flexible filter system)
export * from './helpers/filters.svelte.js';

// Navigation guard system
export * from './helpers/navigation-guard.svelte.js';

// Import logging utilities for global API
import {
    enableLogging,
    disableLogging,
    setLogLevel,
    setCategoryLevel
} from './logger';

/**
 * @typedef {Object} GlobalRouterAPI
 * @property {() => string} version - Get library version
 * @property {Object} config - Package metadata
 * @property {string} config.name - Package name
 * @property {string} config.version - Package version
 * @property {string} config.author - Package author
 * @property {string} config.license - Package license
 * @property {string} config.repository - Repository URL
 * @property {string} config.homepage - Homepage URL
 * @property {Object} logging - Logging controls
 * @property {() => void} logging.enableLogging - Enable all debug logging
 * @property {() => void} logging.disableLogging - Disable all logging
 * @property {(level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent') => void} logging.setLogLevel - Set global log level
 * @property {(category: string, level?: string) => void} logging.setCategoryLevel - Set category-specific log level
 * @property {() => string[]} logging.getCategories - List all logging categories
 */

// List of all logging categories
const LOGGING_CATEGORIES = [
    'ROUTER',
    'ROUTER:NAVIGATION',
    'ROUTER:SCROLL',
    'ROUTER:GUARDS',
    'ROUTER:CONDITIONS',
    'ROUTER:HIERARCHY',
    'ROUTER:PERMISSIONS',
    'ROUTER:ROUTES',
    'ROUTER:ZONES',
    'ROUTER:METADATA',
    'ROUTER:ERROR_HANDLER',
    'ROUTER:FILTERS'
];

// Initialize global API (SSR-safe)
if (typeof window !== 'undefined') {
    // Create components namespace if it doesn't exist
    window.components = window.components || {};

    // Initialize svelte-spa-router API
    // Note: __VERSION__, __PACKAGE_NAME__, etc. are injected by build tools (Vite, Rollup)
    // via the `define` option. Fallback values are provided for source distribution.
    window.components['svelte-spa-router'] = {
        version: () => typeof __VERSION__ !== 'undefined' ? __VERSION__ : '5.1.0',
        config: {
            name: typeof __PACKAGE_NAME__ !== 'undefined' ? __PACKAGE_NAME__ : '@keenmate/svelte-spa-router',
            version: typeof __VERSION__ !== 'undefined' ? __VERSION__ : '5.1.0',
            author: typeof __AUTHOR__ !== 'undefined' ? __AUTHOR__ : 'KeenMate (https://keenmate.com)',
            license: typeof __LICENSE__ !== 'undefined' ? __LICENSE__ : 'MIT',
            repository: typeof __REPOSITORY__ !== 'undefined' ? __REPOSITORY__ : 'https://github.com/keenmate/svelte-spa-router',
            homepage: typeof __HOMEPAGE__ !== 'undefined' ? __HOMEPAGE__ : 'https://github.com/keenmate/svelte-spa-router#readme'
        },
        logging: {
            enableLogging,
            disableLogging,
            setLogLevel,
            setCategoryLevel,
            getCategories: () => [...LOGGING_CATEGORIES]
        }
    };
}
