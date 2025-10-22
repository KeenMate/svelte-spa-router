<script>
/**
 * Error Handling Demo
 * Demonstrates global error handler capabilities
 */

import { getConfig, getRestartCount, canRestart } from '@keenmate/svelte-spa-router/helpers/error-handler'

let config = $derived(getConfig())
let restartCount = $state(0)
let showErrorButtons = $state(true)

// Update restart count periodically
$effect(() => {
    const interval = setInterval(() => {
        restartCount = getRestartCount()
    }, 1000)

    return () => clearInterval(interval)
})

// Test error scenarios
function throwRenderError() {
    const obj = null
    // This will throw synchronously during render
    return obj.property
}

function throwEffectError() {
    throw new Error('Error thrown in $effect - caught by global handler')
}

function throwEventHandlerError() {
    throw new Error('Error thrown in event handler - caught by global handler')
}

function throwAsyncError() {
    setTimeout(() => {
        throw new Error('Async error thrown - caught by global handler')
    }, 100)
}

function throwPromiseRejection() {
    Promise.reject(new Error('Unhandled promise rejection - caught by global handler'))
}

let shouldThrowEffect = $state(false)

$effect(() => {
    if (shouldThrowEffect) {
        throwEffectError()
    }
})

let shouldThrowRender = $state(false)
</script>

<div class="error-demo">
    <h1>🛡️ Global Error Handler Demo</h1>

    <div class="intro">
        <p>
            This demo shows how the <strong>Global Error Handler</strong> catches all unhandled errors
            and executes recovery strategies to prevent app crashes.
        </p>
    </div>

    <div class="config-display">
        <h2>Current Configuration</h2>
        <table>
            <tbody>
                <tr>
                    <td><strong>Strategy:</strong></td>
                    <td><code>{config.strategy}</code></td>
                </tr>
                <tr>
                    <td><strong>Safe Route:</strong></td>
                    <td><code>{config.safeRoute}</code></td>
                </tr>
                <tr>
                    <td><strong>Show Toast:</strong></td>
                    <td>{config.showToast ? '✅' : '❌'}</td>
                </tr>
                <tr>
                    <td><strong>Max Restarts:</strong></td>
                    <td>{config.maxRestarts}</td>
                </tr>
                <tr>
                    <td><strong>Restart Window:</strong></td>
                    <td>{config.restartWindow / 1000}s</td>
                </tr>
                <tr>
                    <td><strong>Can Restart:</strong></td>
                    <td>{canRestart() ? '✅ Yes' : '❌ No (loop prevention active)'}</td>
                </tr>
                <tr>
                    <td><strong>Restart Count:</strong></td>
                    <td>{restartCount} / {config.maxRestarts}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="warning-box">
        <h3>⚠️ Warning</h3>
        <p>
            Clicking the buttons below will throw <strong>real errors</strong>.
            The global error handler will catch them and execute the configured recovery strategy.
        </p>
        <p>
            Current strategy: <strong>{config.strategy}</strong> →
            {#if config.strategy === 'navigateSafe'}
                You will be redirected to <code>{config.safeRoute}</code>
            {:else if config.strategy === 'restart'}
                The page will reload (with loop prevention)
            {:else if config.strategy === 'showError'}
                An error screen will be displayed
            {:else}
                Custom recovery logic will execute
            {/if}
        </p>
    </div>

    {#if showErrorButtons}
        <div class="error-tests">
            <h2>Test Error Scenarios</h2>

            <div class="test-section">
                <h3>1. Event Handler Error</h3>
                <p>Error thrown when you click a button (async context)</p>
                <button onclick={throwEventHandlerError} class="error-btn">
                    Throw Event Handler Error
                </button>
            </div>

            <div class="test-section">
                <h3>2. Async Error</h3>
                <p>Error thrown in setTimeout (async context)</p>
                <button onclick={throwAsyncError} class="error-btn">
                    Throw Async Error
                </button>
            </div>

            <div class="test-section">
                <h3>3. Promise Rejection</h3>
                <p>Unhandled promise rejection</p>
                <button onclick={throwPromiseRejection} class="error-btn">
                    Throw Promise Rejection
                </button>
            </div>

            <div class="test-section">
                <h3>4. Effect Error</h3>
                <p>Error thrown in $effect (lifecycle)</p>
                <button onclick={() => shouldThrowEffect = true} class="error-btn">
                    Throw Effect Error
                </button>
            </div>

            <div class="test-section">
                <h3>5. Render Error</h3>
                <p>Null property access during render (synchronous)</p>
                <button onclick={() => shouldThrowRender = true} class="error-btn">
                    Throw Render Error
                </button>
            </div>
        </div>
    {/if}

    {#if shouldThrowRender}
        <!-- This will throw a render error -->
        <div>{throwRenderError()}</div>
    {/if}

    <div class="info-section">
        <h2>How It Works</h2>
        <ol>
            <li>Error occurs anywhere in the app</li>
            <li>Global error handler catches it via <code>window.addEventListener('error')</code></li>
            <li><code>onError</code> callback fires for logging/monitoring</li>
            <li>Recovery strategy executes:
                <ul>
                    <li><strong>navigateSafe:</strong> Navigate to safe route</li>
                    <li><strong>restart:</strong> Reload page (with loop prevention)</li>
                    <li><strong>showError:</strong> Display error component</li>
                    <li><strong>custom:</strong> Call <code>onRecover</code> callback</li>
                </ul>
            </li>
            <li>Loop prevention tracks restarts in sessionStorage</li>
            <li>If too many restarts occur, show fatal error screen</li>
        </ol>
    </div>

    <div class="code-example">
        <h2>Configuration Example</h2>
        <pre><code>// main.js
import {'{'}configureGlobalErrorHandler{'}'} from '@keenmate/svelte-spa-router/helpers/error-handler'

configureGlobalErrorHandler({'{'}
    onError: (error, errorInfo, context) => {'{'}
        // Log to monitoring service
        Sentry.captureException(error, {'{'} extra: errorInfo {'}'})
    {'}'},

    strategy: 'navigateSafe',  // or 'restart', 'showError', 'custom'
    safeRoute: '/',

    maxRestarts: 3,
    restartWindow: 60000,  // 1 minute

    showToast: true,
    isDevelopment: import.meta.env.DEV,
{'}'})</code></pre>
    </div>
</div>

<style>
.error-demo {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
}

h1 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.intro {
    background: #e3f2fd;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #2196f3;
    margin-bottom: 2rem;
}

.intro p {
    margin: 0;
    line-height: 1.6;
}

.config-display {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.config-display h2 {
    margin-top: 0;
    color: #2c3e50;
}

.config-display table {
    width: 100%;
    border-collapse: collapse;
}

.config-display tr {
    border-bottom: 1px solid #e0e0e0;
}

.config-display tr:last-child {
    border-bottom: none;
}

.config-display td {
    padding: 0.75rem 0;
}

.config-display td:first-child {
    width: 180px;
}

.config-display code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.warning-box {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.warning-box h3 {
    margin: 0 0 1rem 0;
    color: #856404;
}

.warning-box p {
    margin: 0.5rem 0;
    color: #856404;
}

.warning-box code {
    background: rgba(0,0,0,0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.error-tests {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.error-tests h2 {
    margin-top: 0;
    color: #2c3e50;
}

.test-section {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 6px;
}

.test-section h3 {
    margin: 0 0 0.5rem 0;
    color: #dc3545;
}

.test-section p {
    margin: 0 0 1rem 0;
    color: #6c757d;
    font-size: 0.9rem;
}

.error-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
}

.error-btn:hover {
    background: #c82333;
}

.info-section {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.info-section h2 {
    margin-top: 0;
    color: #2c3e50;
}

.info-section ol {
    margin: 0;
    padding-left: 1.5rem;
}

.info-section li {
    margin: 0.5rem 0;
    line-height: 1.6;
}

.info-section ul {
    margin: 0.5rem 0;
}

.info-section code {
    background: white;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.code-example {
    background: #2c3e50;
    color: #ecf0f1;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.code-example h2 {
    margin-top: 0;
    color: #ecf0f1;
}

.code-example pre {
    margin: 0;
    overflow-x: auto;
}

.code-example code {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
}
</style>
