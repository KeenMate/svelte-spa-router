/**
 * Type definitions for ErrorDisplay.svelte component
 */

import type { Component } from 'svelte'
import type { ErrorInfo } from './error-handler.js'

/**
 * ErrorDisplay component props
 */
export interface ErrorDisplayProps {
    /** The error to display */
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

    /**
     * Route to navigate to when clicking "Go to Home Page"
     * @default '/'
     */
    safeRoute?: string

    /**
     * Show detailed technical information (stack trace, error context)
     * @default false
     */
    isDevelopment?: boolean
}

declare const ErrorDisplay: Component<ErrorDisplayProps>
export default ErrorDisplay
