<script>
import { location, push } from '@keenmate/svelte-spa-router'
import { filterByPermissions } from '@keenmate/svelte-spa-router/helpers/nav-tree'
import NavLink from '../components/NavLink.svelte'
import RichTooltip from '../components/RichTooltip.svelte'
import { navTree, findNodeByPath, flags } from './nav-tree.svelte.js'
import { user, toggleUser } from '../stores/userStore.svelte.js'

/**
 * Tree-driven nav demo with permission filtering.
 *
 * - `navTree` (./nav-tree.js) carries `permissions` and `hidden` per node.
 * - The sidebar runs `filterByPermissions(navTree, { mode })` inside a
 *   `$derived`. Because `hasPermission()` reads the reactive user store and
 *   the `hidden` getter is called on every filter pass, the sidebar
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

// `disabledClassName` opts in to a distinct CSS class on items whose
// forbidden state comes from `disabled: true` (product placeholder) vs.
// `forbiddenClassName` (default 'forbidden') which is applied to permission-
// denied items. Both classes are styled below — permission-denied red,
// product-disabled amber.
const visibleTree = $derived(filterByPermissions(navTree, {
    mode,
    disabledClassName: 'unavailable'
}))
const active = $derived(findNodeByPath(navTree, path))

// Collapsible-section state for noRoute headers. Stores paths of currently
// COLLAPSED sections; sections default to expanded (so the demo is rich at
// first glance). Pattern: $state(SvelteSet) — see Svelte 5 deep reactivity.
// Plain Set works here because we always reassign for reactivity.
let collapsed = $state(new Set())

function toggleCollapsed(p) {
    const next = new Set(collapsed)
    if (next.has(p)) next.delete(p)
    else next.add(p)
    collapsed = next
}

function isExpanded(p) {
    return !collapsed.has(p)
}

// Heuristic: any node carrying custom rich-tooltip data uses RichTooltip
// (with clickable content) instead of NavLink's `title=` attribute. Custom
// fields live under `meta` by convention — the library doesn't know or
// care, but it keeps top-level node properties clean.
function hasRichTooltip(node) {
    return !!node.meta?.docsUrl
}
</script>

{#snippet richTooltipContent(node)}
    {#if node._forbidden}
        {#if node.disabled}
            <span class="badge badge-unavailable">Unavailable</span>
        {:else}
            <span class="badge">Access restricted</span>
        {/if}
    {/if}
    <h4>{node.title}</h4>
    {#if node._forbidden}
        <p>
            {#if node.meta?.reason}
                {node.meta.reason}
            {:else if node.meta?.requiredRole}
                Requires the <em>{node.meta.requiredRole}</em> role
            {:else}
                Currently disabled.
            {/if}
            {#if node.permissions?.any}
                — permissions: <code>{node.permissions.any.join(', ')}</code>
            {/if}
        </p>
    {:else}
        <p>You have access. Click anywhere outside to dismiss.</p>
    {/if}
    {#if node.meta?.docsUrl}
        <p>
            <a href={node.meta.docsUrl} target="_blank" rel="noopener">
                Read the docs →
            </a>
        </p>
    {/if}
{/snippet}

<div class="page">
    <nav class="topbar" aria-label="Tree-driven navbar">
        {#each visibleTree as item}
            {#if item.children}
                <div class="topbar-item">
                    {#if hasRichTooltip(item)}
                        <RichTooltip content={richTooltipContent} data={item} placement="top-start">
                            <NavLink
                                href={item.path}
                                subtree={true}
                                className="link-active"
                                subtreeClassName="sublink-active"
                                forbidden={item._forbidden}
                                forbiddenClassName={item._forbiddenClassName}
                                noRoute={item.noRoute}
                            >{item.title} <span class="caret" aria-hidden="true">▾</span></NavLink>
                        </RichTooltip>
                    {:else}
                        <NavLink
                            href={item.path}
                            subtree={true}
                            className="link-active"
                            subtreeClassName="sublink-active"
                            forbidden={item._forbidden}
                            forbiddenClassName={item._forbiddenClassName}
                            tooltip={item._tooltip}
                            noRoute={item.noRoute}
                        >{item.title} <span class="caret" aria-hidden="true">▾</span></NavLink>
                    {/if}

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
                                        tooltip={child._tooltip}
                                        noRoute={child.noRoute}
                                    >{child.title} <span class="caret" aria-hidden="true">▸</span></NavLink>
                                    <div class="dropdown-sub">
                                        {#each child.children as grandchild}
                                            <NavLink
                                                href={grandchild.path}
                                                className="link-active"
                                                forbidden={grandchild._forbidden}
                                                forbiddenClassName={grandchild._forbiddenClassName}
                                                tooltip={grandchild._tooltip}
                                                noRoute={grandchild.noRoute}
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
                                    tooltip={child._tooltip}
                                    noRoute={child.noRoute}
                                >{child.title}</NavLink>
                            {/if}
                        {/each}
                    </div>
                </div>
            {:else}
                {#if hasRichTooltip(item)}
                    <RichTooltip content={richTooltipContent} data={item} placement="top-start">
                        <NavLink
                            href={item.path}
                            className="link-active"
                            forbidden={item._forbidden}
                            forbiddenClassName={item._forbiddenClassName}
                            noRoute={item.noRoute}
                        >{item.title}</NavLink>
                    </RichTooltip>
                {:else}
                    <NavLink
                        href={item.path}
                        className="link-active"
                        forbidden={item._forbidden}
                        forbiddenClassName={item._forbiddenClassName}
                        tooltip={item._tooltip}
                        noRoute={item.noRoute}
                    >{item.title}</NavLink>
                {/if}
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
                        {#if hasRichTooltip(item)}
                            <RichTooltip content={richTooltipContent} data={item} placement="right">
                                <NavLink
                                    href={item.path}
                                    subtree={true}
                                    className="link-active"
                                    subtreeClassName="sublink-active"
                                    forbidden={item._forbidden}
                                    forbiddenClassName={item._forbiddenClassName}
                                    noRoute={item.noRoute}
                                    collapsible={item.noRoute}
                                    expanded={isExpanded(item.path)}
                                    onclick={item.noRoute ? () => toggleCollapsed(item.path) : undefined}
                                >{item.title}{#if item.noRoute}<span class="chev" aria-hidden="true">▾</span>{/if}</NavLink>
                            </RichTooltip>
                        {:else}
                        <NavLink
                            href={item.path}
                            subtree={true}
                            className="link-active"
                            subtreeClassName="sublink-active"
                            forbidden={item._forbidden}
                            forbiddenClassName={item._forbiddenClassName}
                            tooltip={item._tooltip}
                            noRoute={item.noRoute}
                            collapsible={item.noRoute}
                            expanded={isExpanded(item.path)}
                            onclick={item.noRoute ? () => toggleCollapsed(item.path) : undefined}
                        >{item.title}{#if item.noRoute}<span class="chev" aria-hidden="true">▾</span>{/if}</NavLink>
                        {/if}

                        {#if !item.noRoute || isExpanded(item.path)}
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
                                        tooltip={child._tooltip}
                                        noRoute={child.noRoute}
                                    >{child.title}</NavLink>
                                    <div class="submenu">
                                        {#each child.children as grandchild}
                                            <NavLink
                                                href={grandchild.path}
                                                className="link-active"
                                                forbidden={grandchild._forbidden}
                                                forbiddenClassName={grandchild._forbiddenClassName}
                                                tooltip={grandchild._tooltip}
                                                noRoute={grandchild.noRoute}
                                            >{grandchild.title}</NavLink>
                                        {/each}
                                    </div>
                                {:else}
                                    <NavLink
                                        href={child.path}
                                        className="link-active"
                                        forbidden={child._forbidden}
                                        forbiddenClassName={child._forbiddenClassName}
                                        tooltip={child._tooltip}
                                        noRoute={child.noRoute}
                                    >{child.title}</NavLink>
                                {/if}
                            {/each}
                        </div>
                        {/if}
                    </div>
                {:else}
                    {#if hasRichTooltip(item)}
                        <RichTooltip content={richTooltipContent} data={item} placement="right">
                            <NavLink
                                href={item.path}
                                className="link-active"
                                forbidden={item._forbidden}
                                forbiddenClassName={item._forbiddenClassName}
                                noRoute={item.noRoute}
                            >{item.title}</NavLink>
                        </RichTooltip>
                    {:else}
                    <NavLink
                        href={item.path}
                        className="link-active"
                        forbidden={item._forbidden}
                        forbiddenClassName={item._forbiddenClassName}
                        tooltip={item._tooltip}
                        noRoute={item.noRoute}
                    >{item.title}</NavLink>
                    {/if}
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
            <li><strong><code>hidden</code> getter — env-gated</strong> — the Labs section only renders when <code>import.meta.env.DEV</code> is true (i.e. in <code>make dev</code>, not in a production build).</li>
            <li><strong><code>hidden</code> getter — runtime-reactive</strong> — Preview features reads a <code>$state</code> rune. Flip the "show new features" checkbox above and watch the whole section appear or disappear, no page reload. This is the feature-flag pattern: in production you'd hydrate the flag from your feature-flag service.</li>
            <li><strong><code>hidden: true</code></strong> — Secret ops never renders for anyone.</li>
            <li><strong><code>disable</code> mode</strong> — same filter, but forbidden items render as <code>&lt;span class="forbidden"&gt;</code> instead of vanishing.</li>
            <li><strong><code>tooltip</code> callback explains why</strong> — switch to <code>disable</code> mode and hover over <em>Create user</em>, <em>Admin</em>, <em>Settings</em>, or <em>User 123 → Permissions</em>. Each node's <code>tooltip: (_, &#123; forbidden &#125;) =&gt; ...</code> is resolved by the filter and surfaced as a <code>title=</code> attribute via <code>NavLink</code>. Returning <code>null</code> when not forbidden keeps the title off accessible items.</li>
            <li><strong><code>noRoute: true</code> — menu-only section header</strong> — the <em>Users</em> node has no real page. <code>App.svelte</code> filters <code>noRoute</code> nodes out of route registration; <code>NavLink</code> renders them as <code>&lt;span class="nav-header"&gt;</code> instead of <code>&lt;a&gt;</code>. The path stays useful for breadcrumbs, the active cascade, and tooltips. Try navigating to <code>/nav-tree-demo/users</code> directly — you'll get a 404, but clicking its children still works.</li>
            <li><strong>Collapsible noRoute sections</strong> — pair <code>noRoute</code> with the <code>collapsible</code> + <code>expanded</code> + <code>onclick</code> props on <code>NavLink</code> and it renders as a <code>&lt;button aria-expanded&gt;</code> with a rotating chevron. Click <em>Users</em> in the sidebar to expand/collapse its submenu. The state lives in the consumer (a single <code>$state</code> Set), so persistence/animation are the consumer's call.</li>
            <li><strong><code>disabled: true</code> — product-level forbidden flag</strong> — <em>Integrations</em> ("Coming feature..") and <em>Marketplace</em> ("In private beta...") use this. <code>disabled</code> is "permanently forbidden, regardless of user" — a product-level placeholder, not a user-permission check. So unlike <code>permissions</code>, it stays visible in <strong>both</strong> hide and disable modes. Different from <code>hidden</code> (which removes the item entirely). Toggle the hide/disable radio buttons — these two items don't disappear in hide mode the way Admin and Settings do for Donna. The only thing that can hide a disabled item is an ancestor's permission denial (you can't see a placeholder in a section you can't enter).</li>
            <li><strong><code>disabledClassName</code> filter option — distinct visual for disabled vs. permission-denied</strong> — this demo passes <code>disabledClassName: 'unavailable'</code> to <code>filterByPermissions()</code>. Permission-denied items (Admin, Settings for Donna in disable mode) render with <code>class="forbidden"</code> — grey, strike-through, italic. Product-level <code>disabled: true</code> items (Marketplace, Integrations) render with <code>class="unavailable"</code> — amber, no strike-through (the message is "not ready yet", not "you can't have it"). The renderer (<code>NavLink</code>) hasn't changed at all — the filter just resolves <code>_forbiddenClassName</code> to a different value based on what made the node forbidden. Default <code>disabledClassName</code> is undefined, falling back to <code>forbiddenClassName</code> for full backward compatibility.</li>
            <li><strong>Rich (clickable) tooltips via <code>meta</code> + Floating UI</strong> — hover <em>Admin</em> or <em>Settings</em> in the sidebar to see a rich tooltip with a clickable "Read the docs →" link. The <code>meta: &#123; requiredRole, docsUrl &#125;</code> custom-fields convention keeps consumer data off the top level (mirrors the router's <code>routeContext</code> pattern). Custom fields ride through <code>filterByPermissions()</code> untouched, so the tooltip body can use them and the resolved <code>_forbidden</code> flag in one place. The <code>RichTooltip</code> wrapper uses <code>@floating-ui/dom</code> for positioning and survives mouseovers into the tooltip body so links are actually clickable.</li>
        </ul>

        <h3>What each user sees</h3>
        <table>
            <thead>
                <tr><th></th><th>Donna</th><th>Audrey</th></tr>
            </thead>
            <tbody>
                <tr><td>Overview</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users (section header — no page)</td><td>visible, not clickable</td><td>visible, not clickable</td></tr>
                <tr><td>Users → All users</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → Create user</td><td><em>no</em> (needs user:edit)</td><td>yes</td></tr>
                <tr><td>Users → User 123</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → User 123 → Profile</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → User 123 → Activity</td><td>yes</td><td>yes</td></tr>
                <tr><td>Users → User 123 → Permissions</td><td><em>no</em> (needs user:edit)</td><td>yes</td></tr>
                <tr><td>Admin section</td><td><em>no</em> (needs admin)</td><td>yes</td></tr>
                <tr><td>Settings</td><td><em>no</em> (needs settings:manage)</td><td>yes</td></tr>
                <tr><td>Marketplace</td><td><em>disabled for everyone</em> + rich tooltip (no permissions, uses meta.reason)</td><td><em>disabled for everyone</em> + rich tooltip</td></tr>
                <tr><td>Integrations</td><td><em>disabled for everyone</em> (Coming feature..)</td><td><em>disabled for everyone</em> (Coming feature..)</td></tr>
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
    /* ===========================================================
       Topbar
       Every item — <a>, <span>, <button> — gets the same display/padding/
       line-height so baselines match. State classes only touch color,
       background, and decoration — never layout.
       =========================================================== */
    .topbar {
        display: flex;
        gap: 0.25rem;
        align-items: stretch;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.35rem 0.5rem;
        margin-bottom: 1rem;
        position: relative;
        z-index: 5;
    }
    .topbar-item {
        position: relative;
        display: flex;
    }
    .topbar :global(a),
    .topbar :global(span),
    .topbar :global(button) {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.7rem;
        font-size: 0.9rem;
        line-height: 1.4;
        font-weight: 500;
        font-family: inherit;
        color: #1d4ed8;
        background: transparent;
        border: 0;
        border-radius: 4px;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
    }
    .topbar :global(a:hover),
    .topbar :global(button:not([disabled]):hover) {
        background: #f1f5f9;
    }
    .topbar :global(a.link-active) {
        background: #fee2e2;
        color: #b91c1c;
    }
    .topbar :global(a.sublink-active) {
        background: #ffedd5;
        color: #c2410c;
    }
    .topbar :global(span.forbidden),
    .topbar :global(button.forbidden) {
        color: #94a3b8;
        text-decoration: line-through;
        cursor: not-allowed;
        font-style: italic;
    }
    /* Distinct visual for product-level `disabled: true` items — amber, no
       strike-through (it's not "you can't have it", it's "it's not ready
       yet"). Driven by the filter's disabledClassName option. */
    .topbar :global(span.unavailable),
    .topbar :global(button.unavailable) {
        color: #b45309;
        background: #fef3c7;
        cursor: not-allowed;
        font-style: normal;
    }
    .topbar :global(.nav-header) {
        color: #475569;
        cursor: default;
    }
    .topbar :global(.caret) {
        font-size: 0.7em;
        opacity: 0.55;
    }
    /* RichTooltip wraps its trigger in <span class="rich-tooltip-trigger">.
       Strip the topbar's default span styling from it so padding/color/border
       come from the inner NavLink, not the wrapper. The wrapper just sits
       in flex flow and forwards hover/focus events. */
    .topbar :global(.rich-tooltip-trigger) {
        display: inline-flex;
        padding: 0;
        background: transparent;
        color: inherit;
        font-weight: inherit;
        border-radius: 0;
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
    /* Dropdown items override inline-flex → flex (block-level) so they
       fill the dropdown width. justify-content lays out the optional
       caret on the right of has-sub items. */
    .dropdown > :global(a),
    .dropdown > :global(span),
    .dropdown > :global(button),
    .dropdown-sub > :global(a),
    .dropdown-sub > :global(span),
    .dropdown-sub > :global(button) {
        display: flex;
        width: 100%;
        justify-content: space-between;
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

    /* ===========================================================
       Sidebar nav
       Same discipline as the topbar: every <a>, <span>, <button> shares
       one box layout. State classes only adjust color / background /
       decoration. `nav-header` is the one exception that intentionally
       changes typography — but keeps the box dimensions identical.
       =========================================================== */
    .sidebar nav :global(a),
    .sidebar nav :global(span),
    .sidebar nav :global(button) {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.4rem 0.55rem;
        font-size: 0.9rem;
        line-height: 1.4;
        font-weight: 500;
        font-family: inherit;
        color: #1d4ed8;
        background: transparent;
        border: 0;
        border-radius: 4px;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
        box-sizing: border-box;
    }
    .sidebar nav :global(a:hover),
    .sidebar nav :global(button:not([disabled]):hover) {
        background: #f1f5f9;
    }
    .sidebar nav :global(a.link-active) {
        background: #fee2e2;
        color: #b91c1c;
    }
    .sidebar nav :global(a.sublink-active) {
        background: #ffedd5;
        color: #c2410c;
    }
    .sidebar nav :global(span.forbidden),
    .sidebar nav :global(button.forbidden) {
        color: #94a3b8;
        text-decoration: line-through;
        cursor: not-allowed;
        font-style: italic;
    }
    /* Same amber treatment in the sidebar — keeps the two states distinct
       at a glance across both layouts. */
    .sidebar nav :global(span.unavailable),
    .sidebar nav :global(button.unavailable) {
        color: #b45309;
        background: #fef3c7;
        cursor: not-allowed;
        font-style: normal;
    }
    /* noRoute section header — same box dimensions, distinct typography */
    .sidebar nav :global(.nav-header) {
        color: #475569;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.72rem;
        letter-spacing: 0.05em;
    }
    .sidebar nav :global(span.nav-header) { cursor: default; }
    /* Collapsible variant lays out chevron on the right */
    .sidebar nav :global(button.nav-header) {
        justify-content: space-between;
    }
    .sidebar nav :global(button.nav-header) :global(.chev) {
        transition: transform 0.15s ease;
        font-size: 0.95em;
        opacity: 0.6;
    }
    .sidebar nav :global(button.nav-header[aria-expanded="false"]) :global(.chev) {
        transform: rotate(-90deg);
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
