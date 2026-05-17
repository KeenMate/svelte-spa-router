/**
 * Global Error Handler Type Definitions
 */

export interface ErrorInfo {
    message: string
    stack?: string
    timestamp: string
    type: 'error' | 'unhandledrejection'
    restartCount: number
    location?: string
    route?: string
    userAgent?: string
}

export interface ErrorContext {
    sessionErrors: ErrorInfo[]
}

export interface RecoveryHelpers {
    restart: () => boolean
    navigate: (route: string) => void
    showError: () => void
    canRestart: () => boolean
    getRestartCount: () => number
}

export type RecoveryStrategy = 'navigateSafe' | 'restart' | 'showError' | 'custom'

export type ErrorPattern = RegExp | string

export interface GlobalErrorHandlerConfig {
    /**
     * Callback for error logging and monitoring
     * Called whenever an error occurs (does not affect recovery)
     */
    onError?: (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => void

    /**
     * Callback for custom error recovery
     * Only called when strategy is 'custom'
     */
    onRecover?: (
        error: Error,
        errorInfo: ErrorInfo,
        context: ErrorContext,
        helpers: RecoveryHelpers
    ) => void

    /**
     * Maximum number of restarts allowed within restartWindow
     * @default 3
     */
    maxRestarts?: number

    /**
     * Time window (in ms) for counting restarts
     * @default 60000 (1 minute)
     */
    restartWindow?: number

    /**
     * Error recovery strategy
     * - 'navigateSafe': Navigate to safeRoute (default)
     * - 'restart': Reload the page (with loop prevention)
     * - 'showError': Display error component and let user decide
     * - 'custom': Call onRecover callback
     * @default 'navigateSafe'
     */
    strategy?: RecoveryStrategy

    /**
     * Route to navigate to when using 'navigateSafe' strategy
     * @default '/'
     */
    safeRoute?: string

    /**
     * Show full-page error component
     * @default false
     */
    showErrorComponent?: boolean

    /**
     * Automatically restart after error (when using 'restart' strategy)
     * @default false
     */
    autoRestart?: boolean

    /**
     * Delay (in ms) before auto-restart
     * @default 5000
     */
    restartDelay?: number

    /**
     * Array of error patterns to ignore
     * Can be RegExp or string patterns
     * @default []
     */
    ignoreErrors?: ErrorPattern[]

    /**
     * Enable development mode (shows detailed error info)
     * @default false
     */
    isDevelopment?: boolean
}

export interface ErrorState {
    currentError: Error | null
    errorInfo: ErrorInfo | null
    sessionErrors: ErrorInfo[]
    isActive: boolean
}

/**
 * Configure the global error handler
 */
export function configureGlobalErrorHandler(config?: GlobalErrorHandlerConfig): void

/**
 * Get current configuration
 */
export function getConfig(): GlobalErrorHandlerConfig

/**
 * Get current error state
 */
export function getErrorState(): ErrorState

/**
 * Set current error
 */
export function setError(error: Error, info: ErrorInfo): void

/**
 * Clear current error
 */
export function clearError(): void

/**
 * Set error handler active state
 */
export function setActive(active: boolean): void

/**
 * Check if error should be ignored based on ignore patterns
 */
export function shouldIgnoreError(error: Error): boolean

/**
 * Get restart history from sessionStorage
 */
export function getRestartHistory(): number[]

/**
 * Check if restart is safe (not in loop)
 */
export function canRestart(): boolean

/**
 * Get current restart count within window
 */
export function getRestartCount(): number

/**
 * Record a restart in sessionStorage
 */
export function recordRestart(): void

/**
 * Clear restart history
 */
export function clearRestartHistory(): void

/**
 * Safe restart with loop prevention
 */
export function restart(): boolean

/**
 * Navigate to a route
 */
export function navigate(route: string): void

/**
 * Show error component
 */
export function showError(): void

/**
 * Create error info object
 */
export function createErrorInfo(error: Error, type?: 'error' | 'unhandledrejection'): ErrorInfo

/**
 * Create helper functions for onRecover callback
 */
export function createRecoveryHelpers(): RecoveryHelpers
