<script>
import { user } from '../stores/userStore.svelte.js'

const currentUser = $derived(user())
</script>

<div class="admin-panel">
    <h1>🔐 Admin Panel</h1>
    <p class="welcome">Welcome, <strong>{currentUser.name}</strong>!</p>

    <div class="info-box">
        <h2>Admin Access Granted</h2>
        <p>This page requires <code>admin</code> permission.</p>
        <p>You have successfully accessed the admin panel.</p>
    </div>

    <div class="features">
        <h3>Admin Features:</h3>
        <ul>
            <li>Manage users</li>
            <li>Configure system settings</li>
            <li>View analytics</li>
            <li>Access logs</li>
        </ul>
    </div>

    <div class="permissions">
        <h3>Your permissions:</h3>
        <div class="permission-tags">
            {#each currentUser.permissions as permission}
                <span class="tag">{permission}</span>
            {/each}
        </div>
    </div>
</div>

<style>
    .admin-panel {
        padding: 2rem;
    }

    h1 {
        color: #1976d2;
        margin-bottom: 0.5rem;
    }

    .welcome {
        font-size: 1.1rem;
        color: #555;
        margin-bottom: 2rem;
    }

    .info-box {
        background: #e3f2fd;
        border-left: 4px solid #1976d2;
        padding: 1.5rem;
        border-radius: 4px;
        margin: 2rem 0;
    }

    .info-box h2 {
        margin-top: 0;
        color: #1976d2;
    }

    .info-box code {
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        color: #1976d2;
        font-weight: bold;
    }

    .features {
        margin: 2rem 0;
    }

    .features h3 {
        color: #333;
    }

    .features ul {
        list-style: none;
        padding: 0;
    }

    .features li {
        padding: 0.5rem 0;
        padding-left: 1.5rem;
        position: relative;
    }

    .features li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #4caf50;
        font-weight: bold;
    }

    .permissions {
        background: #f5f5f5;
        padding: 1.5rem;
        border-radius: 8px;
        margin-top: 2rem;
    }

    .permissions h3 {
        margin-top: 0;
        color: #333;
    }

    .permission-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tag {
        background: #ff3e00;
        color: white;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        font-size: 0.9rem;
        font-family: monospace;
    }
</style>
