<script>
import { errorHandlerLogger } from '../logger.ts'
/**
 * Global Error Handler Component
 * Catches all unhandled errors and executes recovery strategies
 */

import {
    getConfig,
    getErrorState,
    setError,
    clearError,
    setActive,
    shouldIgnoreError,
    createErrorInfo,
    createRecoveryHelpers,
    canRestart,
    restart,
    clearRestartHistory,
} from './error-handler.svelte.js'
import { push } from '../utils.svelte.js'
import ErrorDisplay from './ErrorDisplay.svelte'

let {
    children,
    errorComponent = null,
} = $props()

let config = $derived(getConfig())
let errorState = $derived(getErrorState())

// Handle global errors
function handleError(event) {
    const error = event.error || event.reason || new Error('Unknown error')

    // Check if error should be ignored
    if (shouldIgnoreError(error)) {
        errorHandlerLogger.debug('Ignoring error:', error.message)
        return
    }

    const errorInfo = createErrorInfo(error, event.type)

    errorHandlerLogger.error('Global error caught:', error)

    // Store error in state
    setError(error, errorInfo)

    // Call onError callback for logging/monitoring
    if (config.onError) {
        try {
            config.onError(error, errorInfo, {
                sessionErrors: errorState.sessionErrors,
            })
        } catch (err) {
            errorHandlerLogger.error('Error in onError callback:', err)
        }
    }

    // Execute recovery strategy
    executeRecoveryStrategy(error, errorInfo)

    // Prevent default browser error handling
    event.preventDefault()
    return false
}

// Execute recovery strategy
function executeRecoveryStrategy(error, errorInfo) {
    const helpers = createRecoveryHelpers()

    // Custom strategy - delegate to onRecover
    if (config.strategy === 'custom') {
        if (config.onRecover) {
            try {
                config.onRecover(error, errorInfo, {
                    sessionErrors: errorState.sessionErrors,
                }, helpers)
            } catch (err) {
                errorHandlerLogger.error('Error in onRecover callback:', err)
                // Fallback to navigateSafe
                helpers.navigate(config.safeRoute)
            }
        } else {
            errorHandlerLogger.warn('Custom strategy selected but no onRecover callback provided, falling back to navigateSafe')
            helpers.navigate(config.safeRoute)
        }
        return
    }

    // Built-in strategies
    switch (config.strategy) {
        case 'restart':
            if (config.autoRestart) {
                setTimeout(() => {
                    restart()
                }, config.restartDelay)
            } else {
                // Show error component and let user decide
                config.showErrorComponent = true
            }
            break

        case 'showError':
            config.showErrorComponent = true
            break

        case 'navigateSafe':
        default:
            // Navigate to safe route
            try {
                push(config.safeRoute)
                clearError()
            } catch (err) {
                errorHandlerLogger.error('Failed to navigate to safe route:', err)
                config.showErrorComponent = true
            }
            break
    }
}

// Manual restart (called from error component)
function handleRestart() {
    if (canRestart()) {
        restart()
    } else {
        alert('Too many restarts detected. Please contact support if the problem persists.')
    }
}

// Navigate to safe route
function handleNavigateSafe() {
    push(config.safeRoute)
    config.showErrorComponent = false
    clearError()
}

// Clear error and continue
function handleContinue() {
    config.showErrorComponent = false
    clearError()
}

// Setup global error handlers
$effect(() => {
    if (typeof window === 'undefined') {
        return
    }

    setActive(true)

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)

    return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleError)
        setActive(false)
    }
})

</script>

{#if config.showErrorComponent && errorState.currentError}
    {#if errorComponent}
        <!-- Custom error component -->
        {@render errorComponent({
            error: errorState.currentError,
            errorInfo: errorState.errorInfo,
            onRestart: handleRestart,
            onNavigateSafe: handleNavigateSafe,
            onContinue: handleContinue,
            canRestart: canRestart(),
        })}
    {:else}
        <!-- Default error component -->
        <ErrorDisplay
            error={errorState.currentError}
            errorInfo={errorState.errorInfo}
            onRestart={handleRestart}
            onNavigateSafe={handleNavigateSafe}
            onContinue={handleContinue}
            {canRestart}
            safeRoute={config.safeRoute}
            isDevelopment={config.isDevelopment}
        />
    {/if}
{:else}
    <!-- Normal app rendering -->
    {@render children()}
{/if}

