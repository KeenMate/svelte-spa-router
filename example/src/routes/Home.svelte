<script>
import {link} from '@keenmate/svelte-spa-router/utils'
import { user } from '../stores/userStore.svelte.js'

const currentUser = $derived(user())
</script>

<h1>@keenmate/svelte-spa-router</h1>
<p>A dual-mode router for Svelte 5 using runes. Supports both hash (#/path) and history API (/path) routing!</p>

<div class="history-mode-notice">
    <strong>🎯 History Mode Demo</strong>
    <p>This example uses <strong>history API routing</strong> (clean URLs without hash). Notice the URLs don't have <code>#</code>!</p>
    <p>Configured in <code>main.js</code>:</p>
    <pre><code>setHashRoutingEnabled(false)
setBasePath(import.meta.env.BASE_URL || '/')</code></pre>
</div>

<div class="permissions-demo">
    <strong>🔐 Permissions Demo</strong>
    <p>Currently logged in as: <span class="user-badge">{currentUser.name}</span></p>
    <p>Use the "Toggle 👤" button in the top-right to switch users and test permissions!</p>

    <div class="users-info">
        <div class="user-card">
            <h4>👩 Donna Hayward</h4>
            <p>Permissions:</p>
            <ul>
                <li><code>read</code></li>
                <li><code>write</code></li>
                <li><code>user:view</code></li>
            </ul>
            <p class="access">✅ Can access: Home and demo pages</p>
            <p class="no-access">❌ Cannot access: Admin, Settings</p>
        </div>

        <div class="user-card">
            <h4>👩 Audrey Horne</h4>
            <p>Permissions:</p>
            <ul>
                <li><code>read</code></li>
                <li><code>admin</code></li>
                <li><code>user:view</code></li>
                <li><code>user:edit</code></li>
                <li><code>settings:manage</code></li>
            </ul>
            <p class="access">✅ Can access: All pages including Admin & Settings</p>
        </div>
    </div>

    <p class="try-it">
        <strong>Try it:</strong> Click <a href="/admin" use:link>Admin</a> or <a href="/settings" use:link>Settings</a> with different users!
    </p>
</div>

<h2>Router API</h2>

<table>
    <thead>
        <tr>
            <th>Component/Function</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>&lt;Router&gt;</code></td>
            <td>Component</td>
            <td>Main router component. Pass routes object, zone name (optional), and event handlers.</td>
        </tr>
        <tr>
            <td><code>location()</code></td>
            <td>Function</td>
            <td>Returns current path (e.g., <code>/products</code>)</td>
        </tr>
        <tr>
            <td><code>querystring()</code></td>
            <td>Function</td>
            <td>Returns raw query string (e.g., <code>foo=bar&amp;id=42</code>)</td>
        </tr>
        <tr>
            <td><code>routeParams()</code></td>
            <td>Function</td>
            <td>Returns route parameters (e.g., <code>{'{'}id: '42'{'}'}</code>)</td>
        </tr>
        <tr>
            <td><code>push(path, options?)</code></td>
            <td>Function</td>
            <td>Navigate to new page programmatically. Options: query params, filters, state</td>
        </tr>
        <tr>
            <td><code>pop()</code></td>
            <td>Function</td>
            <td>Navigate back (browser back button)</td>
        </tr>
        <tr>
            <td><code>replace(path, options?)</code></td>
            <td>Function</td>
            <td>Replace current route without adding to history</td>
        </tr>
        <tr>
            <td><code>use:link</code></td>
            <td>Action</td>
            <td>Makes <code>&lt;a&gt;</code> tags use router navigation (respects Ctrl+Click, target)</td>
        </tr>
        <tr>
            <td><code>use:active</code></td>
            <td>Action</td>
            <td>Adds "active" class to links matching current route</td>
        </tr>
        <tr>
            <td><code>wrap()</code></td>
            <td>Function</td>
            <td>Wrap routes for multi-zone, dynamic imports, guards, loading states, and props</td>
        </tr>
    </tbody>
</table>

<h2>Configuration Functions</h2>

<table>
    <thead>
        <tr>
            <th>Function</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>setHashRoutingEnabled(bool)</code></td>
            <td>Enable/disable hash mode. Call before mounting app.</td>
        </tr>
        <tr>
            <td><code>setBasePath(path)</code></td>
            <td>Set base path for history mode. Call before mounting app.</td>
        </tr>
        <tr>
            <td><code>getHashRoutingEnabled()</code></td>
            <td>Get current routing mode</td>
        </tr>
        <tr>
            <td><code>getBasePath()</code></td>
            <td>Get current base path</td>
        </tr>
    </tbody>
</table>

<h2>Helper Modules</h2>

<table>
    <thead>
        <tr>
            <th>Module</th>
            <th>Key Functions</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>helpers/permissions</code></td>
            <td><code>configurePermissions()</code>, <code>createProtectedRoute()</code>, <code>hasPermission()</code></td>
            <td>Role-based access control (RBAC) for routes and UI elements</td>
        </tr>
        <tr>
            <td><code>helpers/querystring</code></td>
            <td><code>parseQuery()</code>, <code>stringifyQuery()</code></td>
            <td>Parse and stringify query strings with type safety</td>
        </tr>
        <tr>
            <td><code>helpers/filters</code></td>
            <td><code>parseFilters()</code>, <code>stringifyFilters()</code></td>
            <td>Parse and manage filter parameters in URLs</td>
        </tr>
        <tr>
            <td><code>helpers/route-metadata</code></td>
            <td><code>routeIsLoading()</code>, <code>getRouteBreadcrumbs()</code>, <code>updateBreadcrumb()</code></td>
            <td>Access route metadata like loading state, title, breadcrumbs</td>
        </tr>
        <tr>
            <td><code>helpers/navigation-guard</code></td>
            <td><code>onBeforeRouteLeave()</code></td>
            <td>Guard navigation away from current route (e.g., unsaved changes)</td>
        </tr>
        <tr>
            <td><code>helpers/url-helpers</code></td>
            <td><code>joinPaths(...paths)</code></td>
            <td>Intelligently join path segments, handles slashes</td>
        </tr>
    </tbody>
</table>

<h2>Features & Demos</h2>

<nav>
    <ul>
        <li><a href="/links-demo" use:link>Links Demo</a> - SPA navigation with link action</li>
        <li><a href="/querystring-demo" use:link>Querystring Demo</a> - Parse and stringify query parameters</li>
        <li><a href="/filters-demo" use:link>Filters Demo</a> - URL filter management with type safety</li>
        <li><a href="/route-data-demo" use:link>Route Data Demo</a> - Access route params and metadata</li>
        <li><a href="/navigation-guard-demo" use:link>Navigation Guard Demo</a> - Prevent navigation (unsaved changes)</li>
        <li><a href="/metadata-demo" use:link>Metadata Demo</a> - Route metadata, breadcrumbs, titles</li>
        <li><a href="/loading-demo" use:link>Loading Demo</a> - Loading states for async routes</li>
        <li><a href="/multi-zone-demo" use:link>Multi-Zone Demo</a> - Load multiple components per route</li>
        <li><a href="/admin" use:link>Admin Panel</a> - Permission-protected route</li>
        <li><a href="/settings" use:link>Settings</a> - Permission-protected route</li>
        <li><a href="/nonexistent" use:link>404 Page</a> - Catch-all route</li>
    </ul>
</nav>

<style>
h1 {
    color: #ff3e00;
    margin-bottom: 0.5rem;
}

h2 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    color: #333;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
}

thead {
    background: #f5f5f5;
}

th {
    text-align: left;
    padding: 0.75rem;
    font-weight: 600;
    border-bottom: 2px solid #ddd;
}

td {
    padding: 0.75rem;
    border-bottom: 1px solid #eee;
}

tbody tr:hover {
    background: #f9f9f9;
}

code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    color: #e83e8c;
}

nav ul {
    list-style: none;
    padding: 0;
}

nav li {
    margin: 0.75rem 0;
    padding-left: 1rem;
}

nav li::before {
    content: "→ ";
    margin-right: 0.5rem;
    color: #ff3e00;
}

nav a {
    color: #0066cc;
    text-decoration: none;
}

nav a:hover {
    text-decoration: underline;
}

.history-mode-notice {
    background: #e7f3ff;
    border-left: 4px solid #0066cc;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
}

.history-mode-notice strong {
    color: #0066cc;
    font-size: 1.1em;
}

.history-mode-notice p {
    margin: 0.5rem 0;
}

.history-mode-notice pre {
    background: #f5f5f5;
    padding: 0.75rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5rem 0;
}

.history-mode-notice code {
    background: transparent;
    padding: 0;
    color: #333;
}

.permissions-demo {
    background: #fff3e0;
    border-left: 4px solid #ff9800;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
}

.permissions-demo strong {
    color: #e65100;
    font-size: 1.1em;
}

.permissions-demo p {
    margin: 0.5rem 0;
}

.user-badge {
    background: #ff9800;
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-weight: 600;
}

.users-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1rem 0;
}

.user-card {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #ffcc80;
}

.user-card h4 {
    margin: 0 0 0.5rem 0;
    color: #e65100;
}

.user-card ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0;
}

.user-card li {
    padding: 0.25rem 0;
}

.user-card code {
    background: #f5f5f5;
    color: #e83e8c;
    padding: 0.15rem 0.4rem;
    font-size: 0.85em;
}

.access {
    color: #2e7d32;
    font-size: 0.9em;
    margin-top: 0.5rem;
}

.no-access {
    color: #c62828;
    font-size: 0.9em;
}

.try-it {
    background: white;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
}

.try-it a {
    color: #0066cc;
    font-weight: 600;
}
</style>
