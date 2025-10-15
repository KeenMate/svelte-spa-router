/**
 * Navigation Guard System Type Definitions
 */

/**
 * Custom error to signal navigation cancellation
 * Throw this error in a beforeLeave handler to prevent navigation
 *
 * @example
 * ```typescript
 * if (formIsDirty && !confirm("Leave?")) {
 *   throw new NavigationCancelledError()
 * }
 * ```
 */
export class NavigationCancelledError extends Error {
    constructor(message?: string);
}

/**
 * Navigation context passed to beforeLeave handlers
 */
export interface NavigationContext {
    /** Current route location */
    from: string;
    /** Destination route location */
    to: string;
    /** Current route parameters */
    params?: Record<string, string>;
    /** Current querystring */
    querystring?: string;
}

/**
 * beforeLeave handler function type
 * Can be async or sync
 * Should throw NavigationCancelledError to prevent navigation
 */
export type BeforeLeaveHandler = (context: NavigationContext) => void | Promise<void>;

/**
 * beforeLeave handler with optional isDirty property for browser beforeunload
 */
export interface BeforeLeaveHandlerWithDirty extends Function {
    (context: NavigationContext): void | Promise<void>;
    /** Optional isDirty flag or function for browser beforeunload warning */
    isDirty?: boolean | (() => boolean);
}

/**
 * Register a beforeLeave guard handler
 * Should be called in onMount or component initialization
 *
 * @param handler - Function that receives navigation context
 *
 * @example
 * ```typescript
 * import { registerBeforeLeave, NavigationCancelledError } from '@keenmate/svelte-spa-router/helpers/navigation-guard'
 * import { onMount, onDestroy } from 'svelte'
 *
 * let formIsDirty = $state(false)
 *
 * async function beforeLeave(ctx) {
 *   if (formIsDirty && !confirm("Unsaved changes. Leave anyway?")) {
 *     throw new NavigationCancelledError()
 *   }
 * }
 *
 * onMount(() => registerBeforeLeave(beforeLeave))
 * onDestroy(() => unregisterBeforeLeave(beforeLeave))
 * ```
 */
export function registerBeforeLeave(handler: BeforeLeaveHandler | BeforeLeaveHandlerWithDirty): void;

/**
 * Unregister a beforeLeave guard handler
 * Should be called in onDestroy or component cleanup
 *
 * @param handler - The handler to unregister
 */
export function unregisterBeforeLeave(handler: BeforeLeaveHandler | BeforeLeaveHandlerWithDirty): void;

/**
 * Clear all registered beforeLeave handlers
 * Useful for testing or manual cleanup
 */
export function clearBeforeLeaveHandlers(): void;

/**
 * Get all registered handlers (for debugging)
 * @returns Array of registered handlers
 */
export function getBeforeLeaveHandlers(): Array<BeforeLeaveHandler | BeforeLeaveHandlerWithDirty>;

/**
 * Run all registered beforeLeave guards
 * Called by the router before navigation
 *
 * @param context - Navigation context
 * @returns Promise that resolves to true if navigation allowed, false if cancelled
 */
export function runBeforeLeaveGuards(context: NavigationContext): Promise<boolean>;

/**
 * Helper to create a beforeLeave handler that checks a dirty flag
 *
 * @param isDirtyFn - Function that returns true if there are unsaved changes
 * @param message - Custom confirmation message (optional)
 * @returns beforeLeave handler function
 *
 * @example
 * ```typescript
 * import { createDirtyCheckGuard } from '@keenmate/svelte-spa-router/helpers/navigation-guard'
 *
 * let formIsDirty = $state(false)
 *
 * const beforeLeave = createDirtyCheckGuard(
 *   () => formIsDirty,
 *   "You have unsaved changes. Leave anyway?"
 * )
 *
 * onMount(() => registerBeforeLeave(beforeLeave))
 * onDestroy(() => unregisterBeforeLeave(beforeLeave))
 * ```
 */
export function createDirtyCheckGuard(
    isDirtyFn: () => boolean,
    message?: string
): BeforeLeaveHandlerWithDirty;
