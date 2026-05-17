<script>
    import { link, location } from '@keenmate/svelte-spa-router'
    import { routeContext } from '@keenmate/svelte-spa-router/helpers/route-metadata'

    let { staticGreeting = '' } = $props()

    const loc = $derived(location())
    const ctx = $derived(routeContext())
</script>

<svelte:head>
    <title>Test &mdash; wrap / routeContext / loading</title>
</svelte:head>

<main>
    <h1 data-testid="wrap-heading">Wrap Test Fixture</h1>
    <p>Targeted by <code>e2e/wrap.spec.ts</code>.</p>

    <section data-testid="state">
        <div class="row">location: <b data-testid="location">{loc}</b></div>
        <div class="row">routeContext(): <b data-testid="route-context">{JSON.stringify(ctx ?? null)}</b></div>
        <div class="row">routeContext.section: <b data-testid="ctx-section">{ctx?.section ?? ''}</b></div>
        <div class="row">routeContext.title: <b data-testid="ctx-title">{ctx?.title ?? ''}</b></div>
        <div class="row">staticGreeting (prop): <b data-testid="static-greeting">{staticGreeting}</b></div>
    </section>

    <section class="links">
        <a href="/test/wrap" data-testid="link-root" use:link>/test/wrap (routeContext)</a>
        <a href="/test/wrap/async" data-testid="link-async" use:link>/test/wrap/async (asyncComponent)</a>
        <a href="/test/wrap/with-props" data-testid="link-with-props" use:link>/test/wrap/with-props (static props)</a>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    h1 { margin: 0 0 0.5rem; }
    section {
        border: 1px solid #cbd5e1;
        padding: 0.75rem;
        margin: 0.75rem 0;
        border-radius: 4px;
        background: #f8fafc;
    }
    .row {
        font-size: 0.85rem;
        margin-bottom: 0.3rem;
        font-family: monospace;
    }
    .row b {
        background: white;
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
        margin-left: 0.25rem;
    }
    .links a { display: block; font-size: 0.85rem; color: #1d4ed8; }
</style>
