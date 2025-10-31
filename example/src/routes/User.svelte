<script>
import {push, navigationContext} from '@keenmate/svelte-spa-router/utils'

// Get route params using $props
let { routeParams = {} } = $props()

const navContext = $derived(navigationContext())
const referrer = $derived(navContext?.referrer)
const canGoBack = $derived(referrer?.location && referrer.location !== '/')

function goBack() {
    const returnPath = referrer?.location || '/'
    const returnQuery = referrer?.querystring
    const returnUrl = returnQuery ? `${returnPath}?${returnQuery}` : returnPath
    push(returnUrl)
}

function goHome() {
    push('/')
}
</script>

<h1>User Profile</h1>

<div class="profile">
    <p><strong>First Name:</strong> {routeParams.first || 'Unknown'}</p>
    {#if routeParams.last}
        <p><strong>Last Name:</strong> {routeParams.last}</p>
    {:else}
        <p><em>No last name provided</em></p>
    {/if}
</div>

<h2>All Params:</h2>
<pre>{JSON.stringify(routeParams, null, 2)}</pre>

<div class="actions">
    {#if canGoBack}
        <button onclick={goBack} class="btn-secondary">
            ← Go Back to {referrer.location}
        </button>
    {/if}
    <button onclick={goHome} class="btn-primary">
        Go to Home
    </button>
</div>

<style>
.profile {
    background: #e3f2fd;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}
pre {
    background: #263238;
    color: #aed581;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
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
