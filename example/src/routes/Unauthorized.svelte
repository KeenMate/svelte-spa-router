<script>
import { push } from '@keenmate/svelte-spa-router/utils'
import { user } from '../stores/userStore.svelte.js'

const currentUser = $derived(user())

function goHome() {
    push('/')
}
</script>

<div class="unauthorized">
    <div class="icon">🚫</div>
    <h1>Access Denied</h1>
    <p>Sorry, <strong>{currentUser.name}</strong>, you don't have permission to access this page.</p>

    <div class="info">
        <h3>Your current permissions:</h3>
        <ul>
            {#each currentUser.permissions as permission}
                <li><code>{permission}</code></li>
            {/each}
        </ul>
    </div>

    <button onclick={goHome} class="btn-primary">
        Return to Home
    </button>
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

    .btn-primary {
        background: #ff3e00;
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        font-size: 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-primary:hover {
        background: #cc3200;
    }
</style>
