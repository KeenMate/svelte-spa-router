<script>
    import { link } from '@keenmate/svelte-spa-router'
    import {
        routeTitle,
        routeBreadcrumbs,
        updateBreadcrumb
    } from '@keenmate/svelte-spa-router/helpers/route-metadata'

    const title = $derived(routeTitle())
    const breadcrumbs = $derived(routeBreadcrumbs())
    const labels = $derived((breadcrumbs ?? []).map((b) => b.label).join(' > '))
    const labelsCount = $derived((breadcrumbs ?? []).length)
</script>

<svelte:head>
    <title>Test &mdash; metadata / hierarchy</title>
</svelte:head>

<main>
    <h1>Metadata + Hierarchy Test Fixture</h1>
    <p>Targeted by <code>e2e/hierarchy-breadcrumbs.spec.ts</code>. Hierarchical mode is enabled globally in main.js.</p>

    <section data-testid="state">
        <div class="row">routeTitle(): <b data-testid="title">{title}</b></div>
        <div class="row">routeBreadcrumbs() count: <b data-testid="breadcrumbs-count">{labelsCount}</b></div>
        <div class="row">routeBreadcrumbs() labels: <b data-testid="breadcrumbs-labels">{labels}</b></div>
        <div class="row" data-testid="breadcrumbs-json">{JSON.stringify(breadcrumbs)}</div>
    </section>

    <section class="links">
        <a href="/test/meta" data-testid="link-root" use:link>/test/meta</a>
        <a href="/test/meta/items" data-testid="link-items" use:link>/test/meta/items</a>
        <a href="/test/meta/items/abc" data-testid="link-item-detail" use:link>/test/meta/items/abc</a>
    </section>

    <section class="actions">
        <button
            data-testid="btn-update-breadcrumb"
            onclick={() => updateBreadcrumb('itemDetail', { label: 'Real Item', path: '/test/meta/items/abc' })}
        >
            updateBreadcrumb('itemDetail', &lbrace; label: 'Real Item', … &rbrace;)
        </button>
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
        word-break: break-all;
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
