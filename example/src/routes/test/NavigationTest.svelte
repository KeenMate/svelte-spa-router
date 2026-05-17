<script>
    import {
        location,
        querystring,
        routeParams,
        navigationContext,
        push,
        replace,
        pop,
        goBack
    } from '@keenmate/svelte-spa-router'
    import { registerRoutes } from '@keenmate/svelte-spa-router/routes'

    // Register named routes for the array/object push-signature tests.
    registerRoutes({
        testNav: '/test/navigation',
        testNavItem: '/test/navigation/:id'
    })

    // Receive params via props as well, so the spec can assert that the prop
    // and the routeParams() accessor agree.
    let { routeParams: paramsProp = {} } = $props()

    const loc = $derived(location())
    const qs = $derived(querystring())
    const params = $derived(routeParams())
    const navCtx = $derived(navigationContext())
    const referrer = $derived(navCtx?.referrer)

    let lastAction = $state('none')

    async function pushWithId() {
        await push('/test/navigation/42')
        lastAction = 'push:/test/navigation/42'
    }

    async function pushWithQuery() {
        // For path-based pushes the querystring must be embedded in the URL.
        // The third-arg query object is only used when pushing via a named route
        // (where buildUrl assembles the final URL). Matches the convention in
        // src/tests/navigation.test.js.
        await push('/test/navigation?foo=bar&baz=qux')
        lastAction = 'push:query'
    }

    async function pushWithContext() {
        await push('/test/navigation/7', {}, {}, { source: 'fixture', purpose: 'e2e' })
        lastAction = 'push:context'
    }

    async function replaceTo() {
        await replace('/test/navigation/99')
        lastAction = 'replace:/test/navigation/99'
    }

    async function back() {
        lastAction = 'goBack'
        await goBack()
    }

    async function popAction() {
        lastAction = 'pop'
        await pop()
    }

    async function pushArray() {
        // Array form: [routeName, params, query, navigationContext]
        await push(['testNavItem', { id: 77 }, { src: 'array' }, { source: 'array-form' }])
        lastAction = 'push:array'
    }

    async function pushObject() {
        // Object form: { route, params, query, navigationContext }
        await push({
            route: 'testNavItem',
            params: { id: 88 },
            query: { src: 'object' },
            navigationContext: { source: 'object-form' }
        })
        lastAction = 'push:object'
    }
</script>

<svelte:head>
    <title>Test &mdash; navigation</title>
</svelte:head>

<main>
    <h1>Navigation Test Fixture</h1>
    <p>Targeted by <code>e2e/navigation.spec.ts</code>. Reload resets <code>lastAction</code>.</p>

    <section class="state" data-testid="state">
        <div class="row">location: <b data-testid="location">{loc}</b></div>
        <div class="row">querystring: <b data-testid="querystring">{qs}</b></div>
        <div class="row">routeParams: <b data-testid="route-params">{JSON.stringify(params)}</b></div>
        <div class="row">routeParams (prop): <b data-testid="route-params-prop">{JSON.stringify(paramsProp)}</b></div>
        <div class="row">navigationContext: <b data-testid="nav-context">{JSON.stringify(navCtx ?? null)}</b></div>
        <div class="row">referrer.location: <b data-testid="referrer-location">{referrer?.location ?? ''}</b></div>
        <div class="row">lastAction: <b data-testid="last-action">{lastAction}</b></div>
    </section>

    <section class="actions">
        <button data-testid="btn-push-with-id" onclick={pushWithId}>push /test/navigation/42</button>
        <button data-testid="btn-push-with-query" onclick={pushWithQuery}>push with query</button>
        <button data-testid="btn-push-with-context" onclick={pushWithContext}>push with context</button>
        <button data-testid="btn-replace" onclick={replaceTo}>replace /test/navigation/99</button>
        <button data-testid="btn-go-back" onclick={back}>goBack()</button>
        <button data-testid="btn-pop" onclick={popAction}>pop()</button>
        <button data-testid="btn-push-array" onclick={pushArray}>push (array form)</button>
        <button data-testid="btn-push-object" onclick={pushObject}>push (object form)</button>
    </section>
</main>

<style>
    main {
        max-width: 720px;
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
        margin-bottom: 0.35rem;
        font-family: monospace;
    }
    .row b {
        color: #1e293b;
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
