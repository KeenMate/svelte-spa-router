<script>
import Router from '../../src/lib/Router.svelte'
import {link, location, push} from '../../src/lib/utils.svelte.js'
import active from '../../src/lib/active.svelte.js'
import wrap from '../../src/lib/wrap.js'
import { configurePermissions, createPermissionCondition } from '../../src/lib/helpers/permissions.svelte.js'
import { user, toggleUser, getCurrentUser, checkPermissions } from './stores/userStore.svelte.js'

import Home from './routes/Home.svelte'
import About from './routes/About.svelte'
import User from './routes/User.svelte'
import Book from './routes/Book.svelte'
import NotFound from './routes/NotFound.svelte'
import Unauthorized from './routes/Unauthorized.svelte'
import AdminPanel from './routes/AdminPanel.svelte'
import Settings from './routes/Settings.svelte'
import QuerystringDemo from './routes/QuerystringDemo.svelte'

// Configure permissions system
configurePermissions({
    checkPermissions,
    getCurrentUser,
    onUnauthorized: (detail) => {
        console.log('Unauthorized access attempt:', detail)
        push('/unauthorized')
    }
})

// Define routes with permissions
const routes = {
    '/': Home,
    '/about': About,
    '/user/:first/:last?': User,
    '/book/*': Book,
    '/querystring-demo': QuerystringDemo,
    '/unauthorized': Unauthorized,
    '/admin': wrap({
        component: AdminPanel,
        conditions: [createPermissionCondition({ any: ['admin'] })]
    }),
    '/settings': wrap({
        component: Settings,
        conditions: [createPermissionCondition({ any: ['settings:manage'] })]
    }),
    '*': NotFound
}

const currentUser = $derived(user())

function handleRouteLoaded(event) {
    console.log('Route loaded:', event.detail)
}

function handleToggleUser() {
    toggleUser()
}
</script>

<div class="app">
    <header>
        <h1>@keenmate/svelte-spa-router Example</h1>
        <nav>
            <a href="/" use:link use:active>Home</a>
            <a href="/about" use:link use:active>About</a>
            <a href="/user/john/doe" use:link use:active>User</a>
            <a href="/querystring-demo" use:link use:active>Querystring</a>
            <a href="/admin" use:link use:active>Admin</a>
            <a href="/settings" use:link use:active>Settings</a>
        </nav>
        <div class="user-controls">
            <button onclick={handleToggleUser} class="toggle-btn" title="Switch user">
                Toggle <span class="user-icon">👤</span>
            </button>
            <span class="user-name">{currentUser.name}</span>
        </div>
    </header>

    <main>
        <Router {routes} onrouteLoaded={handleRouteLoaded} />
    </main>

    <footer>
        <p>Current route: <code>{location()}</code></p>
    </footer>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    header {
        background: #ff3e00;
        color: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    header h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    nav {
        display: flex;
        gap: 1rem;
        flex: 1;
    }

    .user-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-left: auto;
        position: absolute;
        top: 1rem;
        right: 2rem;
    }

    .toggle-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
    }

    .toggle-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
    }

    .user-icon {
        font-size: 1.2rem;
    }

    .user-name {
        font-weight: 500;
        font-size: 1rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    nav a {
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background 0.2s;
    }

    nav a:hover {
        background: rgba(255,255,255,0.1);
    }

    nav :global(a.active) {
        background: rgba(255,255,255,0.2);
        font-weight: bold;
    }

    main {
        flex: 1;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
    }

    footer {
        background: #f5f5f5;
        padding: 1rem 2rem;
        text-align: center;
        border-top: 1px solid #ddd;
    }

    footer code {
        background: white;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-family: monospace;
    }
</style>
