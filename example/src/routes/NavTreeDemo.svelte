<script>
import { location, push } from '@keenmate/svelte-spa-router'
import { filterByPermissions } from '@keenmate/svelte-spa-router/helpers/nav-tree'
import NavLink from '../components/NavLink.svelte'
import { navTree, findNodeByPath, flags } from './nav-tree.svelte.js'
import { user, toggleUser } from '../stores/userStore.svelte.js'

/**
 * Tree-driven nav demo with permission filtering.
 *
 * - `navTree` (./nav-tree.js) carries `permissions` and `isHidden` per node.
 * - The sidebar runs `filterByPermissions(navTree, { mode })` inside a
 *   `$derived`. Because `hasPermission()` reads the reactive user store and
 *   the `isHidden` getter is called on every filter pass, the sidebar
 *   updates live when the user role changes — no extra wiring.
 *
 * Toggles:
 *   - Donna (read, write, user:view) ↔ Audrey (admin + everything else)
 *   - hide mode (forbidden items vanish) ↔ disable mode (forbidden items
 *     render as `<span class="forbidden">`)
 */

const path = $derived(location())
const currentUser = $derived(user())
let mode = $state('hide')   // 'hide' | 'disable'

const visibleTree = $derived(filterByPermissions(navTree, { mode }))
const active = $derived(findNodeByPath(navTree, path))
</script>

<div class="page">
    <nav class="topbar" aria-label="Tree-driven navbar">
        {#each visibleTree as item}
            {#if item.children}
                <div class="topbar-item">
                    <NavLink
                        href={item.path}
                        subtree={true}
                        className="link-active"
                        subtreeClassName="sublink-active"
                        forbidden={item._forbidden}
                        forbiddenClassName={item._forbiddenClassName}
                    >{item.title} <span class="caret" aria-hidden="true">▾</span></NavLink>

                    <div class="dropdown">
                        {#each item.children as child}
                            {#if child.children}
                                <div class="has-sub">
                                    <NavLink
                                        href={child.path}
                                        subtree={true}
                                        className="link-active"
                                        subtreeClassName="sublink-active"
                                        forbidden={child._forbidden}
                                        forbiddenClassName={child._forbiddenClassName}
                                    >{child.title} <span class="caret" aria-hidden="true">▸</span></NavLink>
                                    <div class="dropdown-sub">
                                        {#each child.children as grandchild}
                                            <NavLink
                                                href={grandchild.path}
                                                className="link-active"
                                                forbidden={grandchild._forbidden}
                                                forbiddenClassName={grandchild._forbiddenClassName}
                                            >{grandchild.title}</NavLink>
                                        {/each}
                                    </div>
                                </div>
                            {:else}
                                <NavLink
                                    href={child.path}
                                    className="link-active"
                                    forbidden={child._forbidden}
                                    forbiddenClassName={child._forbiddenClassName}
                                >{child.title}</NavLink>
                            {/if}
                        {/each}
                    </div>
                </div>
            {:else}
                <NavLink
                    href={item.path}
                    className="link-active"
                    forbidden={item._forbidden}
                    forbiddenClassName={item._forbiddenClassName}
                >{item.title}</NavLink>
            {/if}
        {/each}
    </nav>

<div class="layout">
    <aside class="sidebar">
        <header class="aside-header">
            <strong>Tree-driven sidebar</strong>
            <div class="user">{currentUser.name}</div>
        </header>

        <div class="controls">
            <button onclick={toggleUser}>switch user</button>
            <label>
                <input type="radio" bind:group={mode} value="hide" />
                hide
            </label>
            <label>
                <input type="radio" bind:group={mode} value="disable" />
                disable
            </label>
        </div>
        <div class="controls">
            <label data-testid="toggle-new-features">
                <input type="checkbox" bind:checked={flags.showNewFeatures} />
                show new features
            </label>
        </div>

        <nav>
            {#each visibleTree as item}
                {#if item.children}
                    <div class="group">
                        <NavLink
                            href={item.path}
                            subtree={true}
                            className="link-active"
                            subtreeClassName="sublink-active"
                            forbidden={item._forbidden}
                            forbiddenClassName={item._forbiddenClassName}
                        >{item.title}</NavLink>

                        <div class="submenu">
                            {#each item.children as child}
                                {#if child.children}
                                    <NavLink
                                        href={child.path}
                                        subtree={true}
                                        className="link-active"
                                        subtreeClassName="sublink-active"
                                        forbidden={child._forbidden}
                                        forbiddenClassName={child._forbiddenClassName}
                                    >{child.title}</NavLink>
                                    <div class="submenu">
                                        {#each child.children as grandchild}
                                            <NavLink
                                                href={grandchild.path}
                                                className="link-active"
                                                forbidden={grandchild._forbidden}
                                                forbiddenClassName={grandchild._forbiddenClassName}
                                            >{grandchild.title}</NavLink>
                                        {/each}
                                    </div>
                                {:else}
                                    <NavLink
                                        href={child.path}
                                        className="link-active"
                                        forbidden={child._forbidden}
                                        forbiddenClassName={child._forbiddenClassName}
                                    >{child.title}</NavLink>
                                {/if}
                            {/each}
                        </div>
                    </div>
                {:else}
                    <NavLink
                        href={item.path}
                        className="link-active"
                        forbidden={item._forbidden}
                        forbiddenClassName={item._forbiddenClassName}
                    >{item.title}</NavLink>
                {/if}
            {/each}
        </nav>

        <footer class="aside-footer">
            <code>{path}</code>
        </footer>
    </aside>

    <main class="content">
        <h1>Tree-driven nav demo</h1>
        <p>
            One <code>navTree</code> drives the top navbar, the sidebar,
            <em>and</em> the routes. Permission filtering runs inside
            <code>$derived(filterByPermissions(...))</code> — switching the
            user re-runs both renderings automatically.
        </p>
        <p class="muted">
            The tree is three levels deep: hover <strong>Users → User 123</strong>
            in the navbar (or expand it in the sidebar) to see grandchildren.
        </p>

        <div class="card">
            {#if active}
                <h2>{active.title}</h2>
                <p class="muted">You're on <code>{active.path}</code>.</p>
            {:else}
                <h2>Unknown page</h2>
                <p class="muted">Current location: <code>{path}</code>.</p>
            {/if}
            <button onclick={() => push('/nav-tree-demo')}>Back to overview</button>
        </div>

        <h3>What this demo proves</h3>
        <ul>
            <li><strong>Permissions inherited from parents</strong> — the Admin submenu items have no explicit permissions; they ride on the parent's <code>any: ['admin']</code>.</li>
            <li><strong>Cascading parent hide</strong> — when the user can't reach <em>any</em> Admin child, the Admin header itself disappears in <code>hide</code> mode.</li>
            <li><strong><code>isHidden</code> getter — env-gated</strong> — the Labs section only renders when <code>import.meta.env.DEV</code> is true (i.e. in <code>make dev</code>, not in a production build).</li>
            <li><strong><code>isHidden</code> getter — runtime-reactive</strong> — Preview features reads a <code>$state</code> rune. Flip the "show new features" checkbox above and watch the whole section appear or disappear, no page reload. This is the feature-flag pattern: in production you'd hydrate the flag from your feature-flag service.</li>
            <li><strong><code>isHidden: true</code></strong> — Secret ops never renders for anyone.</li>
            <li><strong><code>disable</code> mode</strong> — same filter, but forbidden items render as <code>&lt;span class="forbidden"&gt;</code> instead of vanishing.</li>
        </ul>

        <h3>What each user sees</h3>
        <table>
            <thead>
                <tr><th></th><th>Donna</th><th>Audrey</th></tr>
            </thead>
            <tbody>
                <tr><td>Overview</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → All users</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → Create user</td><td><em>no</em> (needs user:edit)</td><td>yes</td></tr>
                <tr><td>Users → User 123</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → User 123 → Profile</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → User 123 → Activity</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → User 123 → Permissions</td><td><em>no</em> (needs user:edit)</td><td>yes</td></tr>
                <tr><td>Admin section</td><td><em>no</em> (needs admin)</td><td>yes</td></tr>
                <tr><td>Settings</td><td><em>no</em> (needs settings:manage)</td><td>yes</td></tr>
                <tr><td>Labs</td><td>only in dev</td><td>only in dev</td></tr>
                <tr><td>Preview features</td><td>only when toggled on</td><td>only when toggled on</td></tr>
                <tr><td>Secret ops</td><td>never</td><td>never</td></tr>
            </tbody>
        </table>
    </main>
</div>
</div>

<style>
    .page {
        max-width: 1100px;
        margin: 0 auto;
    }
    .topbar {
        display: flex;
        gap: 0.25rem;
        align-items: center;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.4rem 0.6rem;
        margin-bottom: 1rem;
        position: relative;
        z-index: 5;
    }
    .topbar-item {
        position: relative;
    }
    .topbar-item .caret {
        font-size: 0.7em;
        opacity: 0.6;
    }
    .topbar :global(a),
    .topbar :global(span) {
        display: inline-block;
        padding: 0.4rem 0.7rem;
        font-size: 0.9rem;
        color: #1d4ed8;
        text-decoration: none;
        border-radius: 4px;
        white-space: nowrap;
    }
    .topbar :global(a:hover) { background: #f1f5f9; }
    .topbar :global(a.link-active) {
        background: #fee2e2;
        color: #b91c1c;
        font-weight: 600;
    }
    .topbar :global(a.sublink-active) {
        background: #ffedd5;
        color: #c2410c;
    }
    .topbar :global(span.forbidden) {
        color: #94a3b8;
        text-decoration: line-through;
        cursor: not-allowed;
        font-style: italic;
    }

    .dropdown,
    .dropdown-sub {
        display: none;
        position: absolute;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
        padding: 0.25rem;
        min-width: 200px;
        z-index: 10;
    }
    .dropdown {
        top: 100%;
        left: 0;
        margin-top: 2px;
    }
    .dropdown-sub {
        top: 0;
        left: 100%;
        margin-left: 2px;
    }
    .topbar-item:hover > .dropdown,
    .topbar-item:focus-within > .dropdown {
        display: block;
    }
    .dropdown > :global(a),
    .dropdown > :global(span),
    .dropdown-sub > :global(a),
    .dropdown-sub > :global(span) {
        display: block;
    }
    .has-sub {
        position: relative;
    }
    .has-sub:hover > .dropdown-sub,
    .has-sub:focus-within > .dropdown-sub {
        display: block;
    }

    .layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 1.25rem;
    }
    .sidebar {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem;
        align-self: start;
        position: sticky;
        top: 1rem;
    }
    .aside-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        margin-bottom: 0.5rem;
        padding-bottom: 0.4rem;
        border-bottom: 1px solid #e2e8f0;
    }
    .user {
        font-size: 0.75rem;
        color: #64748b;
        font-family: monospace;
    }
    .controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
        padding: 0.4rem 0;
        font-size: 0.75rem;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
    }
    .controls button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 0.25rem 0.6rem;
        border-radius: 3px;
        cursor: pointer;
        font-size: 0.75rem;
    }
    .controls button:hover { background: #1d4ed8; }
    .controls label { display: flex; align-items: center; gap: 0.2rem; cursor: pointer; }

    nav :global(a),
    nav :global(span) {
        display: block;
        padding: 0.35rem 0.5rem;
        font-size: 0.9rem;
        color: #1d4ed8;
        text-decoration: none;
        border-radius: 4px;
    }
    nav :global(a:hover) { background: #f1f5f9; }

    nav :global(a.link-active) {
        background: #fee2e2;
        color: #b91c1c;
        font-weight: 600;
    }
    nav :global(a.sublink-active) {
        background: #ffedd5;
        color: #c2410c;
    }
    /* forbidden state — non-clickable */
    nav :global(span.forbidden) {
        color: #94a3b8;
        text-decoration: line-through;
        cursor: not-allowed;
        font-style: italic;
    }

    .group .submenu {
        margin-left: 0.5rem;
        padding-left: 0.5rem;
        border-left: 2px solid #cbd5e1;
    }

    .aside-footer {
        margin-top: 0.5rem;
        padding-top: 0.4rem;
        border-top: 1px solid #e2e8f0;
        font-size: 0.75rem;
        color: #64748b;
    }
    .aside-footer code {
        font-family: monospace;
        font-size: 0.75rem;
    }

    .content {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem 1.5rem;
    }
    .content h1 { margin-top: 0; }
    .card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .card h2 { margin-top: 0; }
    .muted { color: #64748b; font-size: 0.9rem; }
    .card button {
        background: #2563eb;
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }
    .card button:hover { background: #1d4ed8; }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
        margin-top: 0.5rem;
    }
    th, td {
        text-align: left;
        padding: 0.35rem 0.5rem;
        border: 1px solid #e2e8f0;
    }
    th {
        background: #f1f5f9;
        font-weight: 600;
    }
    td em { color: #64748b; font-style: italic; }
</style>
