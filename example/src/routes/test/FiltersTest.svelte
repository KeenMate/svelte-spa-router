<script>
    import { link, push } from '@keenmate/svelte-spa-router'
    import { filters, updateFilters } from '@keenmate/svelte-spa-router/helpers/filters'

    const f = $derived(filters())
    const filterCount = $derived(Object.keys(f ?? {}).length)
</script>

<svelte:head>
    <title>Test &mdash; filters</title>
</svelte:head>

<main>
    <h1>Filters Test Fixture</h1>
    <p>
        Targeted by <code>e2e/filters.spec.ts</code>. Uses the structured filters mode configured in
        main.js (<code>paramName: '$filter'</code>, OData-style parser:
        <code>search eq 'java' AND category eq 'books'</code>).
    </p>

    <section data-testid="state">
        <div class="row">filters() JSON: <b data-testid="filters-json">{JSON.stringify(f)}</b></div>
        <div class="row">filter count: <b data-testid="filters-count">{filterCount}</b></div>
        <div class="row">filters.search: <b data-testid="filter-search">{f?.search ?? ''}</b></div>
        <div class="row">filters.category: <b data-testid="filter-category">{f?.category ?? ''}</b></div>
    </section>

    <section class="links">
        <a
            href={"/test/filters?$filter=" + encodeURIComponent("search eq 'java'")}
            data-testid="link-single"
            use:link
        >single eq filter (search='java')</a>
        <a
            href={"/test/filters?$filter=" + encodeURIComponent("search eq 'java' AND category eq 'books'")}
            data-testid="link-and"
            use:link
        >AND filter (search='java' AND category='books')</a>
        <a href="/test/filters" data-testid="link-clear" use:link>clear</a>
    </section>

    <section class="actions">
        <button
            data-testid="btn-update-search"
            onclick={() => updateFilters({ search: 'python' })}
        >updateFilters({'{ search: python }'})</button>
        <button
            data-testid="btn-update-multi"
            onclick={() => updateFilters({ search: 'go', category: 'tools' })}
        >updateFilters({'{ search: go, category: tools }'})</button>
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
    .row { font-size: 0.85rem; margin-bottom: 0.3rem; font-family: monospace; word-break: break-all; }
    .row b {
        background: white;
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
        margin-left: 0.25rem;
    }
    .links a { display: block; font-size: 0.85rem; color: #1d4ed8; }
    button {
        margin: 0.25rem 0.25rem 0 0;
        padding: 0.35rem 0.75rem;
        border: 1px solid #94a3b8;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }
</style>
