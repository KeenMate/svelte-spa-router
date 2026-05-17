<script>
    import { location, routeParams, querystring, push, replace } from '@keenmate/svelte-spa-router'
    import {
        registerRoutes,
        hasRoute,
        getRouteByName,
        getRoutes,
        buildUrl
    } from '@keenmate/svelte-spa-router/routes'

    // Register fixture-specific named routes. registerRoutes() merges into the
    // global registry, so the names registered in main.js are not affected.
    registerRoutes({
        testNamedHome: '/test/named',
        testNamedItem: '/test/named/:id',
        testNamedItemEdit: '/test/named/:id/edit'
    })

    const loc = $derived(location())
    const qs = $derived(querystring())
    const params = $derived(routeParams())

    const builtSimple = $derived(buildUrl('testNamedItem', { id: 42 }))
    const builtWithQuery = $derived(buildUrl('testNamedItem', { id: 42 }, { tab: 'info', mode: 'edit' }))
    const builtMissingParam = $derived(buildUrl('testNamedItem', {}))
    const builtUnknown = $derived(buildUrl('thisRouteDoesNotExist', { id: 1 }))

    const registryHasItem = $derived(hasRoute('testNamedItem'))
    const registryHasFake = $derived(hasRoute('thisRouteDoesNotExist'))
    const itemPattern = $derived(getRouteByName('testNamedItem') ?? '')
    const allKeysSorted = $derived(Object.keys(getRoutes()).sort().join(','))

    let lastAction = $state('none')

    async function pushByName() {
        await push('testNamedItem', { id: 99 })
        lastAction = 'push:testNamedItem'
    }

    async function pushByNameWithQuery() {
        await push('testNamedItem', { id: 7 }, { tab: 'info' })
        lastAction = 'push:testNamedItem+query'
    }

    async function replaceByName() {
        await replace('testNamedItemEdit', { id: 55 })
        lastAction = 'replace:testNamedItemEdit'
    }

    async function pushMissingParam() {
        // No id — should fall back to the param replacement placeholder.
        await push('testNamedItem', {})
        lastAction = 'push:missing-param'
    }
</script>

<svelte:head>
    <title>Test &mdash; named routes</title>
</svelte:head>

<main>
    <h1>Named Routes Test Fixture</h1>
    <p>Targeted by <code>e2e/named-routes.spec.ts</code>.</p>

    <section data-testid="state">
        <div class="row">location: <b data-testid="location">{loc}</b></div>
        <div class="row">querystring: <b data-testid="querystring">{qs}</b></div>
        <div class="row">routeParams: <b data-testid="route-params">{JSON.stringify(params)}</b></div>
        <div class="row">lastAction: <b data-testid="last-action">{lastAction}</b></div>
    </section>

    <section>
        <h2>Registry introspection</h2>
        <div class="row">hasRoute('testNamedItem'): <b data-testid="has-item">{String(registryHasItem)}</b></div>
        <div class="row">hasRoute('thisRouteDoesNotExist'): <b data-testid="has-fake">{String(registryHasFake)}</b></div>
        <div class="row">getRouteByName('testNamedItem'): <b data-testid="item-pattern">{itemPattern}</b></div>
        <div class="row">getRoutes() (keys, sorted, comma-joined): <b data-testid="all-keys">{allKeysSorted}</b></div>
    </section>

    <section>
        <h2>buildUrl()</h2>
        <div class="row">buildUrl('testNamedItem', {'{ id: 42 }'}): <b data-testid="built-simple">{builtSimple}</b></div>
        <div class="row">buildUrl(..., {'{ tab: info, mode: edit }'}): <b data-testid="built-with-query">{builtWithQuery}</b></div>
        <div class="row">buildUrl(..., {'{}'}) (missing id): <b data-testid="built-missing-param">{builtMissingParam}</b></div>
        <div class="row">buildUrl('thisRouteDoesNotExist', ...): <b data-testid="built-unknown">{builtUnknown}</b></div>
    </section>

    <section class="actions">
        <button data-testid="btn-push-by-name" onclick={pushByName}>push('testNamedItem', {'{ id: 99 }'})</button>
        <button data-testid="btn-push-by-name-with-query" onclick={pushByNameWithQuery}>push with query</button>
        <button data-testid="btn-replace-by-name" onclick={replaceByName}>replace('testNamedItemEdit', {'{ id: 55 }'})</button>
        <button data-testid="btn-push-missing-param" onclick={pushMissingParam}>push missing param</button>
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
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    button {
        padding: 0.35rem 0.75rem;
        border: 1px solid #94a3b8;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }
    button:hover { background: #e2e8f0; }
</style>
