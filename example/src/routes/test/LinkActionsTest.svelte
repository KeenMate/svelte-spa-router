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
</style>
