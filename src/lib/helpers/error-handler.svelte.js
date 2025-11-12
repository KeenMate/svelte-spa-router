import { errorHandlerLogger } from '../logger.ts'
/**
 * Global Error Handler for svelte-spa-router
 * Provides production-ready error handling with loop prevention and recovery strategies
 */

import { location as getLocation } from '../utils.svelte.js'

// Configuration state
let config = $state({
    onError: null,
    onRecover: null,
    maxRestarts: 3,
    restartWindow: 60000, // 1 minute
    strategy: 'navigateSafe', // 'navigateSafe' | 'restart' | 'showError' | 'custom'
    safeRoute: '/',
    showToast: true,
    showErrorComponent: false,
    autoRestart: false,
    restartDelay: 5000,
    ignoreErrors: [],
    isDevelopment: false,
})

// Error state
let errorState = $state({
    currentError: null,
    errorInfo: null,
    sessionErrors: [],
    isActive: false,
})

// SessionStorage key for restart tracking
const RESTART_KEY = 'spr_error_restarts'

/**
 * Configure the global error handler
 * @param {Object} options Configuration options
 */
export function configureGlobalErrorHandler(options = {}) {
    config = { ...config, ...options }
}

/**
 * Get current configuration
 */
export function getConfig() {
    return config
}

/**
 * Get current error state
 */
export function getErrorState() {
    return errorState
}

/**
 * Set current error
 */
export function setError(error, info) {
    errorState.currentError = error
    errorState.errorInfo = info
    errorState.sessionErrors = [...errorState.sessionErrors, info]
}

/**
 * Clear current error
 */
export function clearError() {
    errorState.currentError = null
    errorState.errorInfo = null
}

/**
 * Set error handler active state
 */
export function setActive(active) {
    errorState.isActive = active
}

/**
 * Check if error should be ignored based on ignore patterns
 */
export function shouldIgnoreError(error) {
    if (!config.ignoreErrors || config.ignoreErrors.length === 0) {
        return false
    }

    const message = error.message || String(error)

    return config.ignoreErrors.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(message)
        }
        return message.includes(pattern)
    })
}

/**
 * Get restart history from sessionStorage
 */
export function getRestartHistory() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return []
    }

    try {
        const history = sessionStorage.getItem(RESTART_KEY)
        return history ? JSON.parse(history) : []
    } catch (err) {
        errorHandlerLogger.warn('Failed to read restart history:', err)
        return []
    }
}

/**
 * Check if restart is safe (not in loop)
 */
export function canRestart() {
    const now = Date.now()
    const history = getRestartHistory()

    // Filter restarts within the time window
    const recentRestarts = history.filter(time => now - time < config.restartWindow)

    return recentRestarts.length < config.maxRestarts
}

/**
 * Get current restart count within window
 */
export function getRestartCount() {
    const now = Date.now()
    const history = getRestartHistory()
    const recentRestarts = history.filter(time => now - time < config.restartWindow)
    return recentRestarts.length
}

/**
 * Record a restart in sessionStorage
 */
export function recordRestart() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return
    }

    try {
        const now = Date.now()
        const history = getRestartHistory()

        // Filter out old restarts and add new one
        const recentRestarts = history.filter(time => now - time < config.restartWindow)
        recentRestarts.push(now)

        sessionStorage.setItem(RESTART_KEY, JSON.stringify(recentRestarts))
    } catch (err) {
        errorHandlerLogger.warn('Failed to record restart:', err)
    }
}

/**
 * Clear restart history
 */
export function clearRestartHistory() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return
    }

    try {
        sessionStorage.removeItem(RESTART_KEY)
    } catch (err) {
        errorHandlerLogger.warn('Failed to clear restart history:', err)
    }
}

/**
 * Safe restart with loop prevention
 */
export function restart() {
    if (!canRestart()) {
        errorHandlerLogger.error('Restart prevented: too many restarts in time window')
        return false
    }

    recordRestart()

    if (typeof window !== 'undefined') {
        window.location.reload()
    }

    return true
}

/**
 * Navigate to a route
 */
export function navigate(route) {
    // Import push dynamically to avoid circular dependency
    import('../utils.svelte.js').then(({ push }) => {
        push(route)
    })
}

/**
 * Show error component
 */
export function showError() {
    // This will be handled by GlobalErrorHandler component
    config.showErrorComponent = true
}

/**
 * Create error info object
 */
export function createErrorInfo(error, type = 'error') {
    const info = {
        message: error.message || String(error),
        stack: error.stack,
        timestamp: new Date().toISOString(),
        type: type,
        restartCount: getRestartCount(),
    }

    // Add context information (only in browser)
    if (typeof window !== 'undefined') {
        info.location = window.location.href
        info.userAgent = navigator.userAgent

        // Add router location if available
        try {
            info.route = getLocation()
        } catch (err) {
            // Router might not be initialized yet
        }
    }

    return info
}

/**
 * Create helper functions for onRecover callback
 */
export function createRecoveryHelpers() {
    return {
        restart: restart,
        navigate: navigate,
        showError: showError,
        canRestart: canRestart,
        getRestartCount: getRestartCount,
    }
}
