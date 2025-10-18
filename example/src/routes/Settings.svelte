<script>
import { user } from '../stores/userStore.svelte.js'

const currentUser = $derived(user())
</script>

<div class="settings">
    <h1>⚙️ Settings</h1>
    <p class="welcome">Welcome, <strong>{currentUser.name}</strong>!</p>

    <div class="info-box">
        <h2>Settings Access Granted</h2>
        <p>This page requires <code>settings:manage</code> permission.</p>
        <p>You can manage application settings here.</p>
    </div>

    <div class="settings-sections">
        <div class="section">
            <h3>General Settings</h3>
            <div class="setting-item">
                <label>
                    <input type="checkbox" checked />
                    Enable notifications
                </label>
            </div>
            <div class="setting-item">
                <label>
                    <input type="checkbox" />
                    Dark mode
                </label>
            </div>
        </div>

        <div class="section">
            <h3>Security Settings</h3>
            <div class="setting-item">
                <label>
                    <input type="checkbox" checked />
                    Two-factor authentication
                </label>
            </div>
            <div class="setting-item">
                <label>
                    <input type="checkbox" checked />
                    Session timeout
                </label>
            </div>
        </div>

        <div class="section">
            <h3>Advanced Settings</h3>
            <div class="setting-item">
                <label>
                    <input type="checkbox" />
                    Debug mode
                </label>
            </div>
            <div class="setting-item">
                <label>
                    <input type="checkbox" />
                    Developer tools
                </label>
            </div>
        </div>
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
    .settings {
        padding: 2rem;
    }

    h1 {
        color: #7b1fa2;
        margin-bottom: 0.5rem;
    }

    .welcome {
        font-size: 1.1rem;
        color: #555;
        margin-bottom: 2rem;
    }

    .info-box {
        background: #f3e5f5;
        border-left: 4px solid #7b1fa2;
        padding: 1.5rem;
        border-radius: 4px;
        margin: 2rem 0;
    }

    .info-box h2 {
        margin-top: 0;
        color: #7b1fa2;
    }

    .info-box code {
        background: white;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        color: #7b1fa2;
        font-weight: bold;
    }

    .settings-sections {
        display: grid;
        gap: 2rem;
        margin: 2rem 0;
    }

    .section {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .section h3 {
        margin-top: 0;
        color: #333;
        margin-bottom: 1rem;
    }

    .setting-item {
        padding: 0.75rem 0;
        border-bottom: 1px solid #eee;
    }

    .setting-item:last-child {
        border-bottom: none;
    }

    .setting-item label {
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
    }

    .setting-item input[type="checkbox"] {
        margin-right: 0.75rem;
        width: 18px;
        height: 18px;
        cursor: pointer;
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
