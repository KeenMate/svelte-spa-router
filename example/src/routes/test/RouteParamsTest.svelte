<script>
    import { link, location, routeParams, push } from '@keenmate/svelte-spa-router'

    let { routeParams: paramsProp = {} } = $props()

    const loc = $derived(location())
    const params = $derived(routeParams())
    const paramKeysSorted = $derived(Object.keys(params ?? {}).sort().join(','))
</script>

<svelte:head>
    <title>Test &mdash; route params</title>
</svelte:head>

<main>
    <h1>Route Params Test Fixture</h1>
    <p>Targeted by <code>e2e/route-params.spec.ts</code>.</p>

    <section data-testid="state">
        <div class="row">location: <b data-testid="location">{loc}</b></div>
        <div class="row">routeParams() (accessor): <b data-testid="route-params">{JSON.stringify(params)}</b></div>
        <div class="row">routeParams (prop): <b data-testid="route-params-prop">{JSON.stringify(paramsProp)}</b></div>
        <div class="row">param keys (sorted): <b data-testid="param-keys">{paramKeysSorted}</b></div>
        <div class="row">params.id: <b data-testid="param-id">{params?.id ?? ''}</b></div>
        <div class="row">params.first: <b data-testid="param-first">{params?.first ?? ''}</b></div>
        <div class="row">params.last (optional): <b data-testid="param-last">{params?.last ?? ''}</b></div>
        <div class="row">params.wild (wildcard): <b data-testid="param-wild">{params?.wild ?? ''}</b></div>
    </section>

    <section class="links">
        <h2>Links (use:link)</h2>
        <a href="/test/params/123" data-testid="link-id-123" use:link>id = 123</a>
        <a href="/test/params/optional/john" data-testid="link-optional-1" use:link>optional :last omitted (john)</a>
        <a href="/test/params/optional/john/doe" data-testid="link-optional-2" use:link>optional :last present (john/doe)</a>
        <a href="/test/params/wild/some/deep/path" data-testid="link-wild" use:link>wildcard /some/deep/path</a>
        <a href="/test/params" data-testid="link-reset" use:link>reset (no params)</a>
    </section>

    <section class="actions">
        <button data-testid="btn-push-id-7" onclick={() => push('/test/params/7')}>push id=7</button>
        <button data-testid="btn-push-encoded" onclick={() => push('/test/params/a%2Fb')}>push id=a%2Fb (encoded slash)</button>
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
    .links { display: flex; flex-direction: column; gap: 0.25rem; }
    .links a { font-size: 0.85rem; color: #1d4ed8; }
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
