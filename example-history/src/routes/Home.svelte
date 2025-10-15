<script>
import {link} from '../../../src/lib/utils.svelte.js'
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
            <p class="access">✅ Can access: Home, About, User pages</p>
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
            <th>Component</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>&lt;Router&gt;</code></td>
            <td>Component</td>
            <td>Main router component. Pass routes object and event handlers.</td>
        </tr>
        <tr>
            <td><code>location()</code></td>
            <td>Function</td>
            <td>Returns current path (e.g., <code>/about</code>)</td>
        </tr>
        <tr>
            <td><code>querystring()</code></td>
            <td>Function</td>
            <td>Returns query parameters (e.g., <code>foo=bar</code>)</td>
        </tr>
        <tr>
            <td><code>params()</code></td>
            <td>Function</td>
            <td>Returns route parameters (e.g., <code>{'{'}id: '42'{'}'}</code>)</td>
        </tr>
        <tr>
            <td><code>push(path)</code></td>
            <td>Function</td>
            <td>Navigate to new page programmatically</td>
        </tr>
        <tr>
            <td><code>pop()</code></td>
            <td>Function</td>
            <td>Navigate back (browser back button)</td>
        </tr>
        <tr>
            <td><code>replace(path)</code></td>
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
            <td>Wrap routes for dynamic imports, guards, and props</td>
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

<h2>Helper Functions</h2>

<table>
    <thead>
        <tr>
            <th>Function</th>
            <th>Module</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>joinPaths(...paths)</code></td>
            <td>helpers/url-helpers</td>
            <td>Intelligently join path segments, handles slashes</td>
        </tr>
    </tbody>
</table>

<h2>Example Routes</h2>

<nav>
    <ul>
        <li><a href="/about" use:link>About</a> - Simple route</li>
        <li><a href="/user/john/doe" use:link>User: John Doe</a> - Named parameters</li>
        <li><a href="/user/jane" use:link>User: Jane</a> - Optional parameter</li>
        <li><a href="/book/svelte-guide" use:link>Book</a> - Wildcard route</li>
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
