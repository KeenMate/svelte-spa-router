<script>
import {link} from '../../../src/lib/utils.svelte.js'
</script>

<h1>@keenmate/svelte-spa-router</h1>
<p>A dual-mode router for Svelte 5 using runes. Supports both hash (#/path) and history API (/path) routing!</p>

<div class="mode-notice">
    <strong>📍 Hash Mode Demo</strong>
    <p>This example uses <strong>hash routing</strong> (URLs with <code>#</code>). No server configuration needed!</p>
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
            <td>Makes <code>&lt;a&gt;</code> tags use router navigation</td>
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

.mode-notice {
    background: #fff8e1;
    border-left: 4px solid #ff9800;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
}

.mode-notice strong {
    color: #ff9800;
    font-size: 1.1em;
}

.mode-notice p {
    margin: 0.5rem 0 0 0;
}
</style>
