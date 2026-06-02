<script>
/**
 * defineRoutes() Demo
 * Demonstrates using defineRoutes() as a single source of truth for route definitions,
 * providing type-safe navigation helpers and path builders with IDE autocomplete.
 */

import { link, location } from '@keenmate/svelte-spa-router'
import { defineRoutes, buildUrl, hasRoute } from '@keenmate/svelte-spa-router/routes'

// --- Live demo: define a small set of routes ---
// In a real app, this would be in your App.svelte or a routes.js file
const { routes: demoRoutes, nav, paths } = defineRoutes({
    home: {
        path: '/',
        component: { name: 'Home' } // placeholder
    },
    userProfile: {
        path: '/user/:userId',
        component: () => Promise.resolve({ default: { name: 'User' } }),
        conditions: [() => true],
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'User Profile' }
        ]
    },
    documentDetail: {
        path: '/documents/:docId',
        component: () => Promise.resolve({ default: { name: 'Document' } })
    },
    settings: {
        path: '/settings',
        component: () => Promise.resolve({ default: { name: 'Settings' } })
    }
})

// Live demo state
let selectedRoute = $state('userProfile')
let paramUserId = $state('42')
let paramDocId = $state('abc-123')
let queryTab = $state('overview')

const builtUrl = $derived.by(() => {
    if (selectedRoute === 'home') return paths.home()
    if (selectedRoute === 'userProfile') return paths.userProfile({ userId: paramUserId })
    if (selectedRoute === 'documentDetail') return paths.documentDetail({ docId: paramDocId })
    if (selectedRoute === 'settings') return paths.settings()
    return ''
})

const builtUrlWithQuery = $derived.by(() => {
    if (selectedRoute === 'userProfile') return paths.userProfile({ userId: paramUserId }, { tab: queryTab })
    if (selectedRoute === 'documentDetail') return paths.documentDetail({ docId: paramDocId }, { tab: queryTab })
    return builtUrl
})

const linkActionResult = $derived.by(() => {
    if (selectedRoute === 'home') return nav.home.link()
    if (selectedRoute === 'userProfile') return nav.userProfile.link({ userId: paramUserId })
    if (selectedRoute === 'documentDetail') return nav.documentDetail.link({ docId: paramDocId })
    if (selectedRoute === 'settings') return nav.settings.link()
    return {}
})

// Check registered routes
const registeredRoutes = $derived({
    home: hasRoute('home'),
    userProfile: hasRoute('userProfile'),
    documentDetail: hasRoute('documentDetail'),
    settings: hasRoute('settings')
})
</script>

<div class="define-routes-demo">
    <h1>defineRoutes() Demo</h1>

    <div class="intro">
        <p>
            <strong>defineRoutes()</strong> provides a single source of truth for your route definitions.
            Instead of defining routes in one place, registering names in another, and manually calling
            <code>push('routeName', params)</code> everywhere &mdash; you get one definition that produces:
        </p>
        <ul>
            <li><strong>routes</strong> &mdash; the routes object for <code>&lt;Router&gt;</code></li>
            <li><strong>nav</strong> &mdash; navigation helpers with IDE autocomplete on route names and params</li>
            <li><strong>paths</strong> &mdash; URL builders for <code>href</code> values</li>
        </ul>
    </div>

    <!-- Section 1: Basic Usage -->
    <div class="section">
        <h2>Basic Usage</h2>
        <div class="code-block">
            <pre><code>{`import { defineRoutes } from '@keenmate/svelte-spa-router/routes'
import Home from './routes/Home.svelte'

const { routes, nav, paths } = defineRoutes({
  home: {
    path: '/',
    component: Home
  },
  user: {
    path: '/user/:id',
    component: () => import('./routes/User.svelte'),
    conditions: [checkAuth],
    breadcrumbs: [{ label: 'User' }]
  },
  contacts: {
    path: '/contacts',
    component: () => import('./routes/Contacts.svelte')
  }
})`}</code></pre>
        </div>

        <div class="note">
            <strong>Key insight:</strong> Simple sync components (no options, no async) are passed directly
            to the router without wrapping overhead. Async components or those with options are automatically
            wrapped via <code>createRoute()</code>.
        </div>
    </div>

    <!-- Section 2: Navigation Helpers (nav) -->
    <div class="section">
        <h2>Navigation Helpers (<code>nav</code>)</h2>
        <p>Each route gets <code>push()</code>, <code>replace()</code>, <code>link()</code>, and <code>path</code>:</p>

        <div class="code-block">
            <pre><code>{`// Navigate with autocomplete (no typos possible!)
nav.user.push({ id: 123 })               // push('user', { id: 123 })
nav.contacts.push()                       // push('contacts')
nav.home.replace()                        // replace('home')

// With query string and navigation context
nav.user.push({ id: 123 }, { tab: 'settings' }, { source: 'menu' })

// Raw path pattern
nav.user.path                             // '/user/:id'

// For use:link action
<a use:link={nav.user.link({ id: 123 })}>User 123</a>`}</code></pre>
        </div>
    </div>

    <!-- Section 3: Path Builders (paths) -->
    <div class="section">
        <h2>Path Builders (<code>paths</code>)</h2>
        <p>Build URLs for <code>href</code> attributes:</p>

        <div class="code-block">
            <pre><code>{`// Build resolved URLs
paths.user({ id: 123 })                   // '/user/123'
paths.contacts()                           // '/contacts'
paths.user({ id: 456 }, { tab: 'info' })  // '/user/456?tab=info'

// Use in templates
<a href={paths.user({ id: 123 })} use:link>User 123</a>
<a href={paths.contacts()} use:link>Contacts</a>`}</code></pre>
        </div>
    </div>

    <!-- Section 4: Interactive Playground -->
    <div class="section playground">
        <h2>Interactive Playground</h2>
        <p>Try building URLs with the demo routes defined above:</p>

        <div class="playground-grid">
            <div class="playground-controls">
                <label class="control-row">
                    <span class="control-label">Route:</span>
                    <select bind:value={selectedRoute}>
                        <option value="home">home</option>
                        <option value="userProfile">userProfile</option>
                        <option value="documentDetail">documentDetail</option>
                        <option value="settings">settings</option>
                    </select>
                </label>

                {#if selectedRoute === 'userProfile'}
                    <label class="control-row">
                        <span class="control-label">userId:</span>
                        <input type="text" bind:value={paramUserId} placeholder="e.g. 42" />
                    </label>
                {/if}

                {#if selectedRoute === 'documentDetail'}
                    <label class="control-row">
                        <span class="control-label">docId:</span>
                        <input type="text" bind:value={paramDocId} placeholder="e.g. abc-123" />
                    </label>
                {/if}

                {#if selectedRoute === 'userProfile' || selectedRoute === 'documentDetail'}
                    <label class="control-row">
                        <span class="control-label">query (tab):</span>
                        <input type="text" bind:value={queryTab} placeholder="e.g. overview" />
                    </label>
                {/if}
            </div>

            <div class="playground-results">
                <div class="result-row">
                    <span class="result-label">nav.{selectedRoute}.path</span>
                    <code class="result-value">{nav[selectedRoute]?.path}</code>
                </div>
                <div class="result-row">
                    <span class="result-label">paths.{selectedRoute}(params)</span>
                    <code class="result-value">{builtUrl}</code>
                </div>
                <div class="result-row">
                    <span class="result-label">paths.{selectedRoute}(params, query)</span>
                    <code class="result-value">{builtUrlWithQuery}</code>
                </div>
                <div class="result-row">
                    <span class="result-label">nav.{selectedRoute}.link(params)</span>
                    <code class="result-value">{JSON.stringify(linkActionResult)}</code>
                </div>
                <div class="result-row">
                    <span class="result-label">hasRoute('{selectedRoute}')</span>
                    <code class="result-value">{registeredRoutes[selectedRoute]}</code>
                </div>
            </div>
        </div>
    </div>

    <!-- Section 5: Generated Routes Object -->
    <div class="section">
        <h2>Generated <code>routes</code> Object</h2>
        <p>This is what gets passed to <code>&lt;Router {'{routes}'} /&gt;</code>:</p>

        <div class="routes-table">
            <table>
                <thead>
                    <tr>
                        <th>Path</th>
                        <th>Type</th>
                        <th>Wrapped?</th>
                    </tr>
                </thead>
                <tbody>
                    {#each Object.entries(demoRoutes) as [path, component]}
                        <tr>
                            <td><code>{path}</code></td>
                            <td>
                                {#if component._sveltesparouter}
                                    Async / has options
                                {:else}
                                    Simple sync
                                {/if}
                            </td>
                            <td>
                                {#if component._sveltesparouter}
                                    <span class="badge badge-wrapped">wrapped</span>
                                {:else}
                                    <span class="badge badge-direct">direct</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

    <!-- Section 6: Before & After Comparison -->
    <div class="section">
        <h2>Before vs After</h2>
        <div class="comparison-grid">
            <div class="comparison-card before">
                <h3>Before (scattered definitions)</h3>
                <pre><code>{`// routes.js - route paths
const routes = {
  '/': Home,
  '/user/:id': wrap({
    asyncComponent: () => import('./User.svelte'),
    conditions: [checkAuth]
  })
}

// main.js - route names (separate!)
registerRoutes({
  home: '/',
  user: '/user/:id'
})

// SomeComponent.svelte - navigation
push('user', { id: 123 })  // typo? no autocomplete
push('usr', { id: 123 })   // silent failure!`}</code></pre>
            </div>

            <div class="comparison-card after">
                <h3>After (single source of truth)</h3>
                <pre><code>{`// routes.js - everything in one place!
const { routes, nav, paths } = defineRoutes({
  home: { path: '/', component: Home },
  user: {
    path: '/user/:id',
    component: () => import('./User.svelte'),
    conditions: [checkAuth]
  }
})

// SomeComponent.svelte - autocomplete!
nav.user.push({ id: 123 })  // IDE autocomplete
nav.usr.push()               // TypeScript error!`}</code></pre>
            </div>
        </div>
    </div>

    <!-- Section 7: TypeScript Types -->
    <div class="section">
        <h2>TypeScript Support</h2>
        <p>With TypeScript, you get full type safety on route names and parameters:</p>

        <div class="code-block">
            <pre><code>{`// TypeScript extracts params from path patterns!
// path: '/user/:id' → params: { id: string | number }

nav.user.push({ id: 123 })        // OK
nav.user.push({ userId: 123 })    // Type error: 'userId' not in params
nav.user.push()                   // OK (params optional)

// Autocomplete on route names
nav.  // IDE shows: home, user, contacts, ...
paths.  // IDE shows: home, user, contacts, ...`}</code></pre>
        </div>
    </div>

    <!-- Section 8: Route Definition Options -->
    <div class="section">
        <h2>Supported Route Options</h2>
        <p>Each route accepts <code>path</code>, <code>component</code>, and all <code>createRoute()</code> / <code>wrap()</code> options:</p>

        <table class="options-table">
            <thead>
                <tr>
                    <th>Option</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>path</code></td>
                    <td><strong>Required.</strong> URL pattern (e.g. <code>/user/:id</code>)</td>
                </tr>
                <tr>
                    <td><code>component</code></td>
                    <td><strong>Required.</strong> Svelte component or <code>() => import(...)</code></td>
                </tr>
                <tr>
                    <td><code>conditions</code></td>
                    <td>Route guards/pre-conditions</td>
                </tr>
                <tr>
                    <td><code>breadcrumbs</code></td>
                    <td>Breadcrumb trail</td>
                </tr>
                <tr>
                    <td><code>title</code></td>
                    <td>Page title</td>
                </tr>
                <tr>
                    <td><code>loadingComponent</code></td>
                    <td>Placeholder while async component loads</td>
                </tr>
                <tr>
                    <td><code>props</code></td>
                    <td>Static props passed to the component</td>
                </tr>
                <tr>
                    <td><code>permissions</code></td>
                    <td>Permission requirements (<code>{`{ any: [...] }`}</code> or <code>{`{ all: [...] }`}</code>)</td>
                </tr>
                <tr>
                    <td><code>routeContext</code></td>
                    <td>Custom context data for route events</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
h1 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

h2 {
    color: #2c3e50;
    margin-top: 0;
}

.intro {
    background: #e3f2fd;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #2196f3;
    margin-bottom: 2rem;
}

.intro p {
    margin: 0 0 1rem 0;
    line-height: 1.6;
}

.intro ul {
    margin: 0;
    padding-left: 1.5rem;
}

.intro li {
    margin: 0.5rem 0;
}

.intro code {
    background: rgba(0,0,0,0.08);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.section {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.section p {
    line-height: 1.6;
    color: #444;
}

.section code {
    background: rgba(0,0,0,0.06);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.code-block pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1.25rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0 0 0;
    line-height: 1.5;
}

.code-block code {
    background: none;
    padding: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: inherit;
}

.note {
    background: #fff3cd;
    padding: 1rem 1.25rem;
    border-radius: 6px;
    border-left: 4px solid #ffc107;
    margin-top: 1rem;
}

.note strong {
    color: #856404;
}

.note code {
    background: rgba(0,0,0,0.08);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
}

/* Playground */
.playground-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1.5rem;
    margin-top: 1rem;
}

@media (max-width: 700px) {
    .playground-grid {
        grid-template-columns: 1fr;
    }
}

.playground-controls {
    background: #f8fafc;
    padding: 1.25rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.control-row {
    display: block;
    margin-bottom: 1rem;
}

.control-row:last-child {
    margin-bottom: 0;
}

.control-label {
    display: block;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.35rem;
    font-size: 0.9rem;
}

.control-row select,
.control-row input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 0.95rem;
    box-sizing: border-box;
}

.playground-results {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.result-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #f8fafc;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.result-label {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #64748b;
    white-space: nowrap;
    min-width: 240px;
}

.result-value {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    color: #2563eb;
    font-weight: 600;
    background: white !important;
    padding: 0.3rem 0.6rem !important;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    word-break: break-all;
}

/* Routes table */
.routes-table {
    margin-top: 1rem;
}

.routes-table table {
    width: 100%;
    border-collapse: collapse;
}

.routes-table th,
.routes-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.routes-table th {
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
}

.badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
}

.badge-wrapped {
    background: #dbeafe;
    color: #1d4ed8;
}

.badge-direct {
    background: #dcfce7;
    color: #166534;
}

/* Before/After comparison */
.comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-top: 1rem;
}

@media (max-width: 800px) {
    .comparison-grid {
        grid-template-columns: 1fr;
    }
}

.comparison-card {
    border-radius: 8px;
    overflow: hidden;
}

.comparison-card h3 {
    margin: 0;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
}

.before h3 {
    background: #fee2e2;
    color: #991b1b;
}

.after h3 {
    background: #dcfce7;
    color: #166534;
}

.comparison-card pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    margin: 0;
    overflow-x: auto;
    border-radius: 0;
    line-height: 1.5;
}

.comparison-card code {
    background: none;
    padding: 0;
    font-size: 0.8rem;
    color: inherit;
}

/* Options table */
.options-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.options-table th,
.options-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.options-table th {
    background: #f1f5f9;
    font-weight: 600;
    color: #475569;
}

.options-table td code {
    color: #2563eb;
    font-weight: 600;
}
</style>
