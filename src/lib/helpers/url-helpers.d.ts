/**
 * Type definitions for URL helper utilities
 */

/**
 * Intelligently joins multiple path segments
 * - Removes duplicate slashes
 * - Preserves trailing slash on last segment if present
 * - Handles empty segments
 *
 * @param paths - Path segments to join
 * @returns Joined path
 *
 * @example
 * ```typescript
 * import { joinPaths } from '@keenmate/svelte-spa-router/helpers/url-helpers'
 *
 * joinPaths('/app', 'user', 'profile') // '/app/user/profile'
 * joinPaths('/app/', '/user/', '/profile') // '/app/user/profile'
 * joinPaths('', 'user', '') // '/user'
 * joinPaths() // '/'
 * ```
 */
export function joinPaths(...paths: string[]): string;
