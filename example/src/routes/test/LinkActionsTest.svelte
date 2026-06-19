<script>
    import { link, location } from '@keenmate/svelte-spa-router'
    import active from '@keenmate/svelte-spa-router/active'

    const loc = $derived(location())
</script>

<svelte:head>
    <title>Test &mdash; link & active actions</title>
</svelte:head>

<main>
    <h1>Link / Active Actions Test Fixture</h1>
    <p>Targeted by <code>e2e/link-actions.spec.ts</code>.</p>

    <section data-testid="state">
        <div class="row">location: <b data-testid="location">{loc}</b></div>
    </section>

    <section>
        <h2>use:link (history-mode SPA navigation)</h2>
        <a href="/test/links/target" data-testid="link-plain" use:link>plain link → /test/links/target</a>
        <a href="/test/links/target" data-testid="link-blank" target="_blank" use:link>target=_blank → /test/links/target</a>
        <a href="/test/links" data-testid="link-self" use:link>self → /test/links</a>
    </section>

    <section>
        <h2>use:active (default className "active")</h2>
        <a href="/test/links" data-testid="active-self" use:link use:active>self (active on /test/links)</a>
        <a href="/test/links/target" data-testid="active-target" use:link use:active>target (active on /test/links/target)</a>
    </section>

    <section>
        <h2>use:active with custom className</h2>
        <a
            href="/test/links/target"
            data-testid="active-custom-class"
            use:link
            use:active={{ className: 'nav-current' }}
        >
            target (className=nav-current)
        </a>
    </section>

    <section>
        <h2>use:active with explicit path (prefix / regex)</h2>
        <a
            href="/test/links"
            data-testid="active-prefix"
            use:link
            use:active={'/test/links/*'}
        >
            prefix path /test/links/* (active on any sub-path)
        </a>
        <a
            href="/test/links"
            data-testid="active-regex"
            use:link
            use:active={/^\/test\/links/}
        >
            regex /^\/test\/links/ (active anywhere under /test/links)
        </a>
    </section>

    <!--
        SIDEBAR WITH SUBMENU — exercises the four "parent stays active"
        variants side-by-side so the e2e spec can codify the regexparam
        wildcard quirk: `/users/*` does NOT match bare `/users`.

        Targeted by e2e/link-actions.spec.ts under
        `test.describe('use:active — sidebar with submenu')`.
    -->
    <section data-testid="sidebar-section">
        <h2>Sidebar with submenu — parent-active patterns</h2>
        <p class="hint">
            Visit each URL and watch which parent variants highlight.
            <code>/users/*</code> is descendants-only; the regex and
            double-<code>use:active</code> forms also cover the bare path.
        </p>

        <div class="sidebar-row">
            <nav class="sidebar" aria-label="Sidebar fixture">
                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-parent-users-exact"
                    use:link
                    use:active
                >
                    Users (exact — no path arg)
                </a>
                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-parent-users-prefix"
                    use:link
                    use:active={'/test/links/sidebar/users/*'}
                >
                    Users (prefix <code>/users/*</code> — descendants only)
                </a>
                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-parent-users-regex"
                    use:link
                    use:active={/^\/test\/links\/sidebar\/users(\/|$)/}
                >
                    Users (regex <code>^/users(/|$)</code> — branch active)
                </a>
                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-parent-users-double"
                    use:link
                    use:active
                    use:active={'/test/links/sidebar/users/*'}
                >
                    Users (two <code>use:active</code> — branch active)
                </a>
                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-parent-users-branch-only"
                    use:link
                    use:active={{ path: /^\/test\/links\/sidebar\/users(\/|$)/, className: 'branch-active' }}
                >
                    Users (className=branch-active via options)
                </a>

                <div class="submenu">
                    <a
                        href="/test/links/sidebar/users/list"
                        data-testid="sb-child-users-list"
                        use:link
                        use:active
                    >
                        All users
                    </a>
                    <a
                        href="/test/links/sidebar/users/123"
                        data-testid="sb-child-users-detail"
                        use:link
                        use:active
                    >
                        User #123
                    </a>
                    <a
                        href="/test/links/sidebar/users/123/edit"
                        data-testid="sb-child-users-edit"
                        use:link
                        use:active
                    >
                        Edit #123
                    </a>
                </div>

                <a
                    href="/test/links/sidebar"
                    data-testid="sb-link-root"
                    use:link
                    use:active
                >
                    ← back to sidebar root
                </a>
            </nav>

            <div class="urls">
                <strong>Jump to:</strong>
                <a href="/test/links/sidebar" data-testid="sb-goto-root" use:link>/sidebar</a>
                <a href="/test/links/sidebar/users" data-testid="sb-goto-users" use:link>/users</a>
                <a href="/test/links/sidebar/users/list" data-testid="sb-goto-users-list" use:link>/users/list</a>
                <a href="/test/links/sidebar/users/123" data-testid="sb-goto-users-123" use:link>/users/123</a>
                <a href="/test/links/sidebar/users/123/edit" data-testid="sb-goto-users-123-edit" use:link>/users/123/edit</a>
            </div>
        </div>
    </section>

    <!--
        TWO-CLASS PARENT/CHILD PATTERN — the exact-match link gets `link-active`
        and an ancestor whose descendant is active gets `sublink-active`. Lets
        the user style the "really active" link and the "parent of active" link
        differently (e.g. red bold vs orange).

        Each parent stacks TWO use:active calls:
          1) options form { className: 'link-active' } — default path = href,
             matches exact URL only
          2) options form { path: '/<parent>/*', className: 'sublink-active' }
             — descendants only

        Children use a single use:active with className: 'link-active'.

        Targeted by e2e/link-actions.spec.ts under
        `test.describe('use:active — two-class parent/child pattern')`.
    -->
    <section data-testid="sidebar-two-class-section">
        <h2>Sidebar with submenu — two-class parent/child pattern</h2>
        <p class="hint">
            Distinguish "really active" (<code>link-active</code>, red) from
            "parent of an active child" (<code>sublink-active</code>, orange).
            The parent stacks two <code>use:active</code> calls; children use
            just one.
        </p>

        <div class="sidebar-row">
            <nav class="sidebar two-class" aria-label="Two-class sidebar fixture">
                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-tc-parent-users"
                    use:link
                    use:active={{ className: 'link-active' }}
                    use:active={{ path: '/test/links/sidebar/users/*', className: 'sublink-active' }}
                >
                    Users
                </a>

                <div class="submenu">
                    <a
                        href="/test/links/sidebar/users/list"
                        data-testid="sb-tc-child-list"
                        use:link
                        use:active={{ className: 'link-active' }}
                    >
                        All users
                    </a>
                    <a
                        href="/test/links/sidebar/users/123"
                        data-testid="sb-tc-child-detail"
                        use:link
                        use:active={{ className: 'link-active' }}
                    >
                        User #123
                    </a>
                    <a
                        href="/test/links/sidebar/users/123/edit"
                        data-testid="sb-tc-child-edit"
                        use:link
                        use:active={{ className: 'link-active' }}
                    >
                        Edit #123
                    </a>
                </div>
            </nav>

            <div class="urls">
                <strong>Expected behavior:</strong>
                <ul>
                    <li><code>/users</code> → parent <code>.link-active</code></li>
                    <li><code>/users/list</code> → parent <code>.sublink-active</code> + child <code>.link-active</code></li>
                    <li><code>/users/123</code> → parent <code>.sublink-active</code> + detail <code>.link-active</code></li>
                    <li><code>/users/123/edit</code> → parent <code>.sublink-active</code> + edit <code>.link-active</code></li>
                </ul>
            </div>
        </div>
    </section>

    <!--
        SUBTREE OPTION — `use:active={{ subtree: true }}` registers both an
        exact match for the link's href AND a `/href/*` descendants pattern
        internally. No regex literal, no stacked actions.

        Pairing `subtreeClassName` with `className` covers the two-class
        parent/child case in a single action call.

        Targeted by e2e/link-actions.spec.ts under
        `test.describe('use:active — subtree option')`.
    -->
    <section data-testid="sidebar-subtree-section">
        <h2>Sidebar with submenu — subtree option (no regex)</h2>
        <p class="hint">
            <code>use:active=&#123;&#123; subtree: true &#125;&#125;</code> derives the
            descendants pattern from the link's <code>href</code>. Equivalent to
            stacking two <code>use:active</code> calls — without the boilerplate.
            With <code>subtreeClassName</code> you also get the red/orange two-class
            split in a single action call.
        </p>

        <div class="sidebar-row">
            <nav class="sidebar two-class" aria-label="Subtree sidebar fixture">
                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-st-parent-single"
                    use:link
                    use:active={{ subtree: true }}
                >
                    Users (subtree: true — single class "active")
                </a>

                <a
                    href="/test/links/sidebar/users"
                    data-testid="sb-st-parent-two-class"
                    use:link
                    use:active={{
                        subtree: true,
                        className: 'link-active',
                        subtreeClassName: 'sublink-active'
                    }}
                >
                    Users (subtree + subtreeClassName)
                </a>

                <div class="submenu">
                    <a
                        href="/test/links/sidebar/users/list"
                        data-testid="sb-st-child-list"
                        use:link
                        use:active={{ className: 'link-active' }}
                    >
                        All users
                    </a>
                    <a
                        href="/test/links/sidebar/users/123"
                        data-testid="sb-st-child-detail"
                        use:link
                        use:active={{ className: 'link-active' }}
                    >
                        User #123
                    </a>
                </div>
            </nav>

            <div class="urls">
                <strong>Expected behavior:</strong>
                <ul>
                    <li><code>/users</code> → both parents <code>.link-active</code> / <code>.active</code></li>
                    <li><code>/users/list</code> → single-class parent <code>.active</code>; two-class parent <code>.sublink-active</code></li>
                    <li><code>/users/123</code> → same as <code>/users/list</code></li>
                </ul>
            </div>
        </div>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    h1 { margin: 0 0 0.5rem; }
    h2 { margin: 0 0 0.5rem; font-size: 1rem; }
    section {
        border: 1px solid #cbd5e1;
        padding: 0.75rem;
        margin: 0.75rem 0;
        border-radius: 4px;
        background: #f8fafc;
    }
    .row { font-size: 0.85rem; font-family: monospace; }
    .row b {
        background: white;
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
        margin-left: 0.25rem;
    }
    section a { display: block; font-size: 0.85rem; color: #1d4ed8; padding: 0.15rem 0; }
    /* highlights so a passing test is visually obvious in the browser */
    section a:global(.active) { background: #fef3c7; color: #92400e; }
    section a:global(.nav-current) { background: #dbeafe; color: #1e40af; }
    section a:global(.branch-active) { outline: 2px solid #10b981; outline-offset: -2px; }
    /* two-class pattern */
    section .two-class a:global(.link-active) {
        background: #fee2e2;
        color: #b91c1c;
        font-weight: bold;
    }
    section .two-class a:global(.sublink-active) {
        background: #ffedd5;
        color: #c2410c;
    }
    .urls ul { margin: 0.25rem 0 0; padding-left: 1.1rem; font-size: 0.8rem; }
    .urls li { margin: 0.1rem 0; }

    .hint { font-size: 0.8rem; color: #475569; margin: 0 0 0.5rem; }
    .sidebar-row {
        display: grid;
        grid-template-columns: minmax(280px, 360px) 1fr;
        gap: 1rem;
    }
    .sidebar {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 0.5rem;
    }
    .sidebar .submenu {
        margin: 0.25rem 0 0.25rem 1rem;
        padding-left: 0.5rem;
        border-left: 2px solid #cbd5e1;
    }
    .urls {
        font-size: 0.85rem;
        padding: 0.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        align-self: start;
    }
    .urls strong { display: block; margin-bottom: 0.25rem; }
    .urls a { display: block; font-family: monospace; }
</style>
