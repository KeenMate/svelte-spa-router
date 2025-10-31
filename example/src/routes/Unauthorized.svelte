<script>
import { push, navigationContext } from '@keenmate/svelte-spa-router/utils'
import { user } from '../stores/userStore.svelte.js'

const currentUser = $derived(user())
const navContext = $derived(navigationContext())

// Build return URL from navigation context
// Prefer referrer over manually-set returnTo (referrer is the actual last valid route)
const referrer = $derived(navContext?.referrer)
const returnPath = $derived(referrer?.location || navContext?.returnTo || '/')
const returnQuery = $derived(referrer?.querystring || navContext?.returnQuery)
const returnUrl = $derived(
    returnQuery ? `${returnPath}?${returnQuery}` : returnPath
)

// Check if we have a specific return path (vs default home)
const hasReturnPath = $derived(
    (referrer?.location && referrer.location !== '/') ||
    (navContext?.returnTo && navContext.returnTo !== '/')
)

function goBack() {
    push(returnUrl)
}

function goHome() {
    push('/')
}
</script>

<div class="unauthorized">
    <div class="icon">🚫</div>
    <h1>Access Denied</h1>
    <p>Sorry, <strong>{currentUser.name}</strong>, you don't have permission to access this page.</p>

    {#if navContext?.resource}
    <div class="access-info">
        <p><strong>Resource:</strong> {navContext.resource} {navContext.id ? `(ID: ${navContext.id})` : ''}</p>
        {#if navContext.title}
        <p><strong>Title:</strong> {navContext.title}</p>
        {/if}
    </div>
    {/if}

    <div class="info">
        <h3>Your current permissions:</h3>
        <ul>
            {#each currentUser.permissions as permission}
                <li><code>{permission}</code></li>
            {/each}
        </ul>
    </div>

    <div class="actions">
        {#if hasReturnPath}
        <button onclick={goBack} class="btn-secondary">
            ← Go Back
        </button>
        {/if}
        <button onclick={goHome} class="btn-primary">
            {hasReturnPath ? 'Go to Home' : 'Return to Home'}
        </button>
    </div>
</div>

<style>
    .unauthorized {
        text-align: center;
        padding: 3rem 2rem;
        max-width: 600px;
        margin: 0 auto;
    }

    .icon {
        font-size: 5rem;
        margin-bottom: 1rem;
    }

    h1 {
        color: #d32f2f;
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.1rem;
        color: #555;
        margin-bottom: 2rem;
    }

    .info {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 2rem 0;
        text-align: left;
    }

    .info h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
    }

    .info ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .info li {
        padding: 0.5rem;
        margin: 0.25rem 0;
    }

    .info code {
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        color: #d32f2f;
    }

    .access-info {
        background: #fff3e0;
        border-left: 4px solid #ff9800;
        border-radius: 4px;
        padding: 1rem 1.5rem;
        margin: 1.5rem 0;
        text-align: left;
    }

    .access-info p {
        margin: 0.5rem 0;
        font-size: 0.95rem;
    }

    .actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
    }

    .btn-primary, .btn-secondary {
        border: none;
        padding: 0.75rem 2rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
        font-weight: 500;
    }

    .btn-primary {
        background: #ff3e00;
        color: white;
    }

    .btn-primary:hover {
        background: #cc3200;
    }

    .btn-secondary {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
    }

    .btn-secondary:hover {
        background: #e0e0e0;
    }
</style>
