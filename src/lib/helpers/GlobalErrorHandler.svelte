<script>
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
let toastVisible = $state(false)
let toastTimeoutId = null

// Handle global errors
function handleError(event) {
    const error = event.error || event.reason || new Error('Unknown error')

    // Check if error should be ignored
    if (shouldIgnoreError(error)) {
        console.debug('Ignoring error:', error.message)
        return
    }

    const errorInfo = createErrorInfo(error, event.type)

    console.error('Global error caught:', error)

    // Store error in state
    setError(error, errorInfo)

    // Call onError callback for logging/monitoring
    if (config.onError) {
        try {
            config.onError(error, errorInfo, {
                sessionErrors: errorState.sessionErrors,
            })
        } catch (err) {
            console.error('Error in onError callback:', err)
        }
    }

    // Show toast if enabled and not showing error component
    if (config.showToast && !config.showErrorComponent) {
        showToast()
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
                console.error('Error in onRecover callback:', err)
                // Fallback to navigateSafe
                helpers.navigate(config.safeRoute)
            }
        } else {
            console.warn('Custom strategy selected but no onRecover callback provided, falling back to navigateSafe')
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
                console.error('Failed to navigate to safe route:', err)
                config.showErrorComponent = true
            }
            break
    }
}

// Show toast notification
function showToast() {
    toastVisible = true

    // Clear existing timeout
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId)
    }

    // Auto-hide after 5 seconds
    toastTimeoutId = setTimeout(() => {
        toastVisible = false
    }, 5000)
}

// Dismiss toast
function dismissToast() {
    toastVisible = false
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId)
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
    dismissToast()
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

// Cleanup on unmount
$effect(() => {
    return () => {
        if (toastTimeoutId) {
            clearTimeout(toastTimeoutId)
        }
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

{#if toastVisible && errorState.currentError && !config.showErrorComponent}
    <div class="error-toast">
        <div class="toast-header">
            <span class="toast-icon">⚠️</span>
            <span class="toast-title">Error Caught</span>
            <button onclick={dismissToast} class="toast-close" aria-label="Close">×</button>
        </div>
        <div class="toast-body">
            {errorState.currentError.message}
        </div>
    </div>
{/if}

<style>
.error-toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: white;
    border: 2px solid #dc3545;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    min-width: 300px;
    max-width: 500px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.toast-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #dc3545;
    color: white;
    border-radius: 6px 6px 0 0;
}

.toast-icon {
    font-size: 1.5rem;
}

.toast-title {
    flex: 1;
    font-weight: 600;
}

.toast-close {
    background: none;
    border: none;
    color: white;
    font-size: 2rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-close:hover {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.toast-body {
    padding: 1rem;
    color: #721c24;
    font-family: monospace;
    font-size: 0.9rem;
}
</style>
