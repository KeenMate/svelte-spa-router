<script>
import {push, navigationContext, location, querystring, goBack} from '@keenmate/svelte-spa-router'

const navContext = $derived(navigationContext())
const referrer = $derived(navContext?.referrer)
const canGoBack = $derived(referrer?.location && referrer.location !== '/')

// Use the imported goBack() which automatically restores scroll position
function handleGoBack() {
    goBack()
}

function goHome() {
    push('/')
}
</script>

<h1>About</h1>
<p>This is a Svelte 5 router using runes!</p>

<div class="info">
    <p><strong>Current Location:</strong> {location()}</p>
    <p><strong>Querystring:</strong> {querystring() || '(none)'}</p>
</div>

<div class="actions">
    {#if canGoBack}
        <button onclick={handleGoBack} class="btn-secondary">
            ← Go Back to {referrer.location}
        </button>
    {/if}
    <button onclick={goHome} class="btn-primary">
        Go to Home
    </button>
</div>

<style>
.info {
    background: #f0f0f0;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.btn-primary, .btn-secondary {
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
    font-weight: 500;
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
</style>
