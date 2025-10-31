<script>
import {push, navigationContext, location} from '@keenmate/svelte-spa-router/utils'

const navContext = $derived(navigationContext())
const attemptedRoute = $derived(navContext?.attemptedRoute || location())
const referrer = $derived(navContext?.referrer)
const canGoBack = $derived(referrer?.location && referrer.location !== '/')

function goBack() {
    const returnPath = referrer?.location || '/'
    const returnQuery = referrer?.querystring
    const returnUrl = returnQuery ? `${returnPath}?${returnQuery}` : returnPath
    push(returnUrl)  // Safe - explicit route, not history.back()
}

function goHome() {
    push('/')
}
</script>

<div class="not-found">
    <h1>404 - Page Not Found</h1>

    <p class="error-message">
        The page <code>{attemptedRoute}</code> could not be found.
    </p>

    <div class="actions">
        {#if canGoBack}
            <button onclick={goBack} class="btn btn-primary">
                ← Go Back to {referrer.location}
            </button>
        {/if}
        <button onclick={goHome} class="btn btn-secondary">
            Go to Home
        </button>
    </div>

    <div class="info-box">
        <h3>Why am I seeing this?</h3>
        <p>The requested page doesn't exist. This could be because:</p>
        <ul>
            <li>The URL was typed incorrectly</li>
            <li>The page has been moved or deleted</li>
            <li>You followed an outdated link</li>
        </ul>
    </div>
</div>

<style>
.not-found {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
}

h1 {
    color: #d32f2f;
    margin: 0 0 1rem 0;
    font-size: 2rem;
}

.error-message {
    background: #ffebee;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #d32f2f;
    margin: 1.5rem 0;
}

.error-message code {
    background: #ffcdd2;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-family: monospace;
    color: #c62828;
}

.actions {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
    flex-wrap: wrap;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
}

.btn-primary {
    background: #2563eb;
    color: white;
}

.btn-primary:hover {
    background: #1d4ed8;
}

.btn-secondary {
    background: #6b7280;
    color: white;
}

.btn-secondary:hover {
    background: #4b5563;
}

.info-box {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 6px;
    margin-top: 2rem;
}

.info-box h3 {
    margin: 0 0 1rem 0;
    color: #374151;
    font-size: 1.1rem;
}

.info-box p {
    margin: 0 0 0.5rem 0;
    color: #6b7280;
}

.info-box ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
    color: #6b7280;
}

.info-box li {
    margin: 0.25rem 0;
}
</style>
