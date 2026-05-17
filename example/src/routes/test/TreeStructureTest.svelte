<script>
    import { link, location, routeParams, push } from '@keenmate/svelte-spa-router'
    import { routeTitle, routeBreadcrumbs } from '@keenmate/svelte-spa-router/helpers/route-metadata'

    const loc = $derived(location())
    const params = $derived(routeParams())
    const title = $derived(routeTitle())
    const breadcrumbs = $derived(routeBreadcrumbs())
    const breadcrumbLabels = $derived((breadcrumbs ?? []).map((b) => b.label).join(' > '))

    async function pushItem() {
        await push('testTreeItem', { id: 'xyz' })
    }
    async function pushItemLogs() {
        await push('testTreeItemLogs', { id: 'xyz' })
    }
</script>

<svelte:head>
    <title>Test &mdash; tree structure</title>
</svelte:head>

<main>
    <h1>Tree Structure Test Fixture</h1>
    <p>
        Targeted by <code>e2e/tree-structure.spec.ts</code>. Routes for this fixture are built via
        <code>createHierarchy()</code> in App.svelte and rendered at <code>/test/tree</code>,
        <code>/test/tree/:id</code>, and <code>/test/tree/:id/logs</code>. Named routes (via the tree's
        <code>name</code> property) are auto-registered.
    </p>

    <section data-testid="state">
        <div class="row">location: <b data-testid="location">{loc}</b></div>
        <div class="row">routeParams: <b data-testid="route-params">{JSON.stringify(params)}</b></div>
        <div class="row">routeTitle: <b data-testid="title">{title}</b></div>
        <div class="row">breadcrumbs count: <b data-testid="breadcrumbs-count">{breadcrumbs?.length ?? 0}</b></div>
        <div class="row">breadcrumbs labels: <b data-testid="breadcrumbs-labels">{breadcrumbLabels}</b></div>
    </section>

    <section class="links">
        <a href="/test/tree" data-testid="link-root" use:link>/test/tree (root)</a>
        <a href="/test/tree/abc" data-testid="link-item" use:link>/test/tree/abc (item)</a>
        <a href="/test/tree/abc/logs" data-testid="link-item-logs" use:link>/test/tree/abc/logs (logs)</a>
    </section>

    <section class="actions">
        <button data-testid="btn-push-item" onclick={pushItem}>push('testTreeItem', &#123; id: 'xyz' &#125;)</button>
        <button data-testid="btn-push-item-logs" onclick={pushItemLogs}>push('testTreeItemLogs', &#123; id: 'xyz' &#125;)</button>
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
    button {
        padding: 0.35rem 0.75rem;
        border: 1px solid #94a3b8;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }
</style>
