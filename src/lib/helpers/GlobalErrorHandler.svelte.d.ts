/**
 * Type definitions for GlobalErrorHandler.svelte component
 */

import type { Component, Snippet } from 'svelte'
import type { ErrorInfo } from './error-handler.js'

/**
 * Props passed to a custom errorComponent snippet
 */
export interface ErrorComponentProps {
    /** The caught error */
    error: Error
    /** Additional error context */
    errorInfo: ErrorInfo | null
    /** Restart the application */
    onRestart: () => void
    /** Navigate to the safe route */
    onNavigateSafe: () => void
    /** Dismiss the error and continue */
    onContinue: () => void
    /** Whether restart is allowed (not in a restart loop) */
    canRestart: boolean
}

/**
 * GlobalErrorHandler component props
 */
export interface GlobalErrorHandlerProps {
    /**
     * App content rendered inside the error boundary.
     */
    children: Snippet

    /**
     * Custom error UI snippet. When provided, replaces the default ErrorDisplay.
     * Receives ErrorComponentProps as its argument.
     * @default null
     */
    errorComponent?: Snippet<[ErrorComponentProps]> | null
}

declare const GlobalErrorHandler: Component<GlobalErrorHandlerProps>
export default GlobalErrorHandler
