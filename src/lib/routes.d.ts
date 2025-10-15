/**
 * Named routes registry and URL builder
 */

/**
 * Register a named route
 *
 * @param name - Route name (e.g., 'documentDetail')
 * @param pattern - Path pattern (e.g., '/documents/:documentId')
 *
 * @example
 * ```typescript
 * registerRoute('documentDetail', '/documents/:documentId')
 * registerRoute('userProfile', '/users/:userId/profile')
 * ```
 */
export function registerRoute(name: string, pattern: string): void;

/**
 * Register multiple routes at once
 *
 * @param routes - Object mapping route names to patterns
 *
 * @example
 * ```typescript
 * registerRoutes({
 *   home: '/',
 *   documentDetail: '/documents/:documentId',
 *   userProfile: '/users/:userId/profile'
 * })
 * ```
 */
export function registerRoutes(routes: Record<string, string>): void;

/**
 * Get all registered routes
 *
 * @returns Route registry
 */
export function getRoutes(): Record<string, string>;

/**
 * Clear all registered routes
 */
export function clearRoutes(): void;

/**
 * Build a URL from a route name and parameters
 *
 * @param name - Route name
 * @param params - Route parameters
 * @param query - Query string parameters
 * @returns Built URL
 *
 * @example
 * ```typescript
 * buildUrl('documentDetail', { documentId: 123 })
 * // Returns: '/documents/123'
 *
 * buildUrl('documentDetail', { documentId: 123 }, { tab: 'info' })
 * // Returns: '/documents/123?tab=info'
 * ```
 */
export function buildUrl(
    name: string,
    params?: Record<string, any>,
    query?: Record<string, any>
): string;

/**
 * Check if a route name is registered
 *
 * @param name - Route name
 * @returns True if route is registered
 */
export function hasRoute(name: string): boolean;
