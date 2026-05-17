<script>
    import Router, { link } from '@keenmate/svelte-spa-router'
    import wrap from '@keenmate/svelte-spa-router/wrap'
    import ZoneMenu from './zones/ZoneMenu.svelte'
    import ZoneMain from './zones/ZoneMain.svelte'
    import ZoneAside from './zones/ZoneAside.svelte'

    // Multi-zone route: a single route registers three zone-specific components.
    // Each nested Router below extracts its zone via the `zone` prop.
    const innerRoutes = {
        '/show/:id': wrap({
            zones: {
                'menu': ZoneMenu,
                'main': ZoneMain,
                'aside': ZoneAside
            }
        })
    }
</script>

<svelte:head>
    <title>Test &mdash; multi-zone</title>
</svelte:head>

<main>
    <h1>Multi-Zone Test Fixture</h1>
    <p>
        Targeted by <code>e2e/multi-zone.spec.ts</code>. Inner route
        <code>/show/:id</code> is a multi-zone route — the three nested Routers
        below each render the zone matching their <code>zone</code> prop.
    </p>

    <section class="links">
        <a href="/test/zones/show/42" data-testid="link-show-42" use:link>/test/zones/show/42</a>
        <a href="/test/zones/show/abc" data-testid="link-show-abc" use:link>/test/zones/show/abc</a>
    </section>

    <div class="layout" data-testid="zones-layout">
        <aside data-testid="zone-menu">
            <Router prefix="/test/zones" routes={innerRoutes} zone="menu" />
        </aside>
        <section data-testid="zone-main">
            <Router prefix="/test/zones" routes={innerRoutes} zone="main" />
        </section>
        <aside data-testid="zone-aside">
            <Router prefix="/test/zones" routes={innerRoutes} zone="aside" />
        </aside>
    </div>
</main>

<style>
    main {
        max-width: 1000px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .links a { display: inline-block; font-size: 0.85rem; color: #1d4ed8; margin-right: 0.5rem; }
    .layout {
        display: grid;
        grid-template-columns: 220px 1fr 220px;
        gap: 0.75rem;
        margin-top: 1rem;
    }
    aside, section {
        border: 1px solid #cbd5e1;
        padding: 0.5rem;
        border-radius: 4px;
        min-height: 100px;
    }
</style>
