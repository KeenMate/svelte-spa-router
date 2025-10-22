<script>
/**
 * Default Error Display Component
 * Shows a user-friendly error page with recovery options
 */

let {
    error,
    errorInfo,
    onRestart,
    onNavigateSafe,
    onContinue,
    canRestart,
    safeRoute = '/',
    isDevelopment = false,
} = $props()

let showDetails = $state(false)

function toggleDetails() {
    showDetails = !showDetails
}

// Generate a simple error ID for support reference
const errorId = errorInfo?.timestamp
    ? new Date(errorInfo.timestamp).getTime().toString(36).toUpperCase()
    : 'UNKNOWN'
</script>

<div class="error-display">
    <div class="error-container">
        <div class="error-header">
            <div class="error-icon">⚠️</div>
            <h1>Something Went Wrong</h1>
            <p class="error-subtitle">
                We apologize for the inconvenience. An unexpected error occurred.
            </p>
        </div>

        <div class="error-message">
            <h2>Error Details</h2>
            <p class="message">{error.message}</p>
            <p class="error-ref">Error Reference: <code>{errorId}</code></p>
        </div>

        {#if errorInfo?.restartCount >= 2}
            <div class="warning-box">
                <strong>⚠️ Multiple errors detected</strong>
                <p>
                    This error has occurred {errorInfo.restartCount} times.
                    {#if !canRestart}
                        <strong>Auto-restart has been disabled to prevent loops.</strong>
                    {/if}
                </p>
            </div>
        {/if}

        <div class="error-actions">
            <button onclick={onNavigateSafe} class="btn btn-primary">
                Go to Home Page
            </button>

            {#if canRestart}
                <button onclick={onRestart} class="btn btn-secondary">
                    Reload Application
                </button>
            {/if}

            <button onclick={onContinue} class="btn btn-tertiary">
                Try to Continue
            </button>
        </div>

        {#if isDevelopment || showDetails}
            <div class="error-details">
                <button onclick={toggleDetails} class="details-toggle">
                    {showDetails ? '▼' : '▶'} Technical Details
                </button>

                {#if showDetails}
                    <div class="details-content">
                        <h3>Stack Trace</h3>
                        <pre>{error.stack || 'No stack trace available'}</pre>

                        {#if errorInfo}
                            <h3>Error Context</h3>
                            <table>
                                <tbody>
                                    <tr>
                                        <td><strong>Timestamp:</strong></td>
                                        <td>{new Date(errorInfo.timestamp).toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Type:</strong></td>
                                        <td>{errorInfo.type}</td>
                                    </tr>
                                    {#if errorInfo.route}
                                        <tr>
                                            <td><strong>Route:</strong></td>
                                            <td>{errorInfo.route}</td>
                                        </tr>
                                    {/if}
                                    {#if errorInfo.location}
                                        <tr>
                                            <td><strong>URL:</strong></td>
                                            <td class="url">{errorInfo.location}</td>
                                        </tr>
                                    {/if}
                                    <tr>
                                        <td><strong>Restart Count:</strong></td>
                                        <td>{errorInfo.restartCount || 0}</td>
                                    </tr>
                                </tbody>
                            </table>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}

        <div class="error-footer">
            <p>
                If this problem persists, please contact support with the error reference code above.
            </p>
        </div>
    </div>
</div>

<style>
.error-display {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    z-index: 9999;
    overflow-y: auto;
}

.error-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    max-width: 800px;
    width: 100%;
    padding: 3rem;
}

.error-header {
    text-align: center;
    margin-bottom: 2rem;
}

.error-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

h1 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
    font-size: 2rem;
}

.error-subtitle {
    margin: 0;
    color: #7f8c8d;
    font-size: 1.1rem;
}

.error-message {
    background: #fff5f5;
    border-left: 4px solid #dc3545;
    padding: 1.5rem;
    border-radius: 4px;
    margin-bottom: 2rem;
}

.error-message h2 {
    margin: 0 0 1rem 0;
    color: #dc3545;
    font-size: 1.2rem;
}

.message {
    margin: 0 0 1rem 0;
    font-family: monospace;
    color: #721c24;
    font-size: 0.95rem;
    word-break: break-word;
}

.error-ref {
    margin: 0;
    font-size: 0.85rem;
    color: #7f8c8d;
}

.error-ref code {
    background: rgba(0,0,0,0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
}

.warning-box {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
}

.warning-box strong {
    color: #856404;
    display: block;
    margin-bottom: 0.5rem;
}

.warning-box p {
    margin: 0;
    color: #856404;
}

.error-actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5568d3;
}

.btn-secondary {
    background: #28a745;
    color: white;
}

.btn-secondary:hover {
    background: #218838;
}

.btn-tertiary {
    background: #6c757d;
    color: white;
}

.btn-tertiary:hover {
    background: #5a6268;
}

.error-details {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
}

.details-toggle {
    background: none;
    border: none;
    color: #667eea;
    font-weight: 600;
    cursor: pointer;
    padding: 0.5rem;
    font-size: 1rem;
    width: 100%;
    text-align: left;
}

.details-toggle:hover {
    background: rgba(102, 126, 234, 0.1);
    border-radius: 4px;
}

.details-content {
    margin-top: 1rem;
}

.details-content h3 {
    margin: 1.5rem 0 0.5rem 0;
    color: #2c3e50;
    font-size: 1rem;
}

.details-content h3:first-child {
    margin-top: 0;
}

.details-content pre {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.85rem;
    line-height: 1.4;
    color: #2c3e50;
}

.details-content table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 4px;
    overflow: hidden;
}

.details-content table tr {
    border-bottom: 1px solid #dee2e6;
}

.details-content table tr:last-child {
    border-bottom: none;
}

.details-content table td {
    padding: 0.75rem;
    font-size: 0.9rem;
}

.details-content table td:first-child {
    width: 150px;
    color: #6c757d;
}

.details-content table td.url {
    word-break: break-all;
    font-family: monospace;
    font-size: 0.85rem;
}

.error-footer {
    text-align: center;
    color: #7f8c8d;
    font-size: 0.9rem;
    border-top: 1px solid #dee2e6;
    padding-top: 1.5rem;
}

.error-footer p {
    margin: 0;
}

@media (max-width: 640px) {
    .error-display {
        padding: 1rem;
    }

    .error-container {
        padding: 1.5rem;
    }

    .error-actions {
        flex-direction: column;
    }

    .btn {
        width: 100%;
    }
}
</style>
