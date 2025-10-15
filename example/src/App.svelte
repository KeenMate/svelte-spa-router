<script>
import Router from '../../src/lib/Router.svelte'
import {link, location} from '../../src/lib/utils.svelte.js'
import active from '../../src/lib/active.svelte.js'

import Home from './routes/Home.svelte'
import About from './routes/About.svelte'
import User from './routes/User.svelte'
import Book from './routes/Book.svelte'
import LinksDemo from './routes/LinksDemo.svelte'
import NotFound from './routes/NotFound.svelte'

const routes = {
    '/': Home,
    '/about': About,
    '/user/:first/:last?': User,
    '/book/*': Book,
    '/links-demo': LinksDemo,
    '*': NotFound
}

function handleRouteLoaded(event) {
    console.log('Route loaded:', event.detail)
}
</script>

<div class="app">
    <header>
        <h1>@keenmate/svelte-spa-router Example</h1>
        <nav>
            <a href="/" use:link use:active>Home</a>
            <a href="/about" use:link use:active>About</a>
            <a href="/user/john/doe" use:link use:active>User</a>
            <a href="/links-demo" use:link use:active>Links Demo</a>
        </nav>
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
    }

    header h1 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
    }

    nav {
        display: flex;
        gap: 1rem;
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
