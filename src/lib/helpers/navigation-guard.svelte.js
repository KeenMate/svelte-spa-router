/**
 * Navigation Guard System for svelte-spa-router
 *
 * Allows components to register beforeLeave guards to prevent navigation
 * when there is unsaved work or other conditions that need user confirmation.
 */

/**
 * Custom error to signal navigation cancellation
 */
export class NavigationCancelledError extends Error {
    constructor(message = 'Navigation cancelled by user') {
        super(message)
        this.name = 'NavigationCancelledError'
    }
}

/**
 * Array of registered beforeLeave handlers
 * @type {Set<Function>}
 */
let beforeLeaveHandlers = $state(new Set())

/**
 * Register a beforeLeave guard handler
 * Should be called in onMount or component initialization
 *
 * @param {Function} handler - Async function that receives navigation context
 *                             Should throw NavigationCancelledError to cancel navigation
 *
 * @example
 * ```javascript
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
export function registerBeforeLeave(handler) {
    if (typeof handler !== 'function') {
        throw new Error('registerBeforeLeave: handler must be a function')
    }

    // Avoid duplicate registrations
    if (!beforeLeaveHandlers.has(handler)) {
        beforeLeaveHandlers.add(handler)
    }
}

/**
 * Unregister a beforeLeave guard handler
 * Should be called in onDestroy or component cleanup
 *
 * @param {Function} handler - The handler to unregister
 */
export function unregisterBeforeLeave(handler) {
    beforeLeaveHandlers.delete(handler)
}

/**
 * Clear all registered beforeLeave handlers
 * Useful for testing or manual cleanup
 */
export function clearBeforeLeaveHandlers() {
    beforeLeaveHandlers.clear()
}

/**
 * Get all registered handlers (for debugging)
 * @returns {Array<Function>}
 */
export function getBeforeLeaveHandlers() {
    return [...beforeLeaveHandlers]
}

/**
 * Run all registered beforeLeave guards
 * Called by the router before navigation
 *
 * @param {Object} context - Navigation context
 * @param {string} context.from - Current route location
 * @param {string} context.to - Destination route location
 * @param {Object} [context.params] - Current route parameters
 * @param {string} [context.querystring] - Current querystring
 * @returns {Promise<boolean>} - true if navigation allowed, false if cancelled
 */
export async function runBeforeLeaveGuards(context) {
    // No handlers registered, allow navigation
    if (beforeLeaveHandlers.size === 0) {
        return true
    }

    // Run all handlers sequentially
    for (const handler of beforeLeaveHandlers.values()) {
        try {
            await handler(context)
        } catch (error) {
            // Navigation cancelled
            if (error instanceof NavigationCancelledError) {
                return false
            }
            // Other errors should be re-thrown
            throw error
        }
    }

    // All handlers passed, allow navigation
    return true
}

/**
 * Helper to create a beforeLeave handler that checks a dirty flag
 *
 * @param {Function} isDirtyFn - Function that returns true if there are unsaved changes
 * @param {string} [message] - Custom confirmation message
 * @returns {Function} - beforeLeave handler function
 *
 * @example
 * ```javascript
 * const beforeLeave = createDirtyCheckGuard(
 *   () => formIsDirty,
 *   "You have unsaved changes. Leave anyway?"
 * )
 *
 * onMount(() => registerBeforeLeave(beforeLeave))
 * onDestroy(() => unregisterBeforeLeave(beforeLeave))
 * ```
 */
export function createDirtyCheckGuard(isDirtyFn, message = 'You have unsaved changes. Leave this page?') {
    return async function beforeLeave() {
        if (isDirtyFn() && !confirm(message)) {
            throw new NavigationCancelledError()
        }
    }
}

/**
 * Setup browser beforeunload handler for registered guards
 * This will warn users when they try to close the tab/window
 *
 * Note: This only works for guards that have an isDirty property/function
 * Modern browsers ignore custom messages and show generic "Changes may not be saved"
 */
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (e) => {
        // Check if any handler indicates dirty state
        for (const handler of beforeLeaveHandlers.values()) {
            try {
                // Check if handler has isDirty property
                if (handler.isDirty) {
                    const isDirty = typeof handler.isDirty === 'function'
                        ? handler.isDirty()
                        : handler.isDirty

                    if (isDirty) {
                        // Prevent default and show browser confirmation
                        e.preventDefault()
                        e.returnValue = '' // Chrome requires this
                        return ''
                    }
                }
            } catch (error) {
                // Ignore errors in isDirty checks
                console.warn('Error checking isDirty in beforeunload:', error)
            }
        }
    })
}
