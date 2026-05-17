<script>
    import { link, push, navigationContext, location, routeParams } from '@keenmate/svelte-spa-router'
    import { registerRoutes } from '@keenmate/svelte-spa-router/routes'

    registerRoutes({
        testReferrerFrom: '/test/referrer/from/:source',
        testReferrerTo: '/test/referrer/to/:dest'
    })

    const loc = $derived(location())
    const params = $derived(routeParams())
    const navCtx = $derived(navigationContext())
    const referrer = $derived(navCtx?.referrer)
</script>

<svelte:head>
    <title>Test &mdash; referrer</title>
</svelte:head>

<main>
    <h1>Referrer Test Fixture</h1>
    <p>
        Targeted by <code>e2e/referrer.spec.ts</code>. setIncludeReferrer('always') is enabled in
        main.js, so every navigation populates navigationContext().referrer.
    </p>

    <section data-testid="state">
        <div class="row">location: <b data-testid="location">{loc}</b></div>
        <div class="row">params: <b data-testid="route-params">{JSON.stringify(params)}</b></div>
        <div class="row">referrer.location: <b data-testid="referrer-location">{referrer?.location ?? ''}</b></div>
        <div class="row">referrer.routeName: <b data-testid="referrer-route-name">{referrer?.routeName ?? ''}</b></div>
        <div class="row">referrer.querystring: <b data-testid="referrer-querystring">{referrer?.querystring ?? ''}</b></div>
        <div class="row">referrer.params: <b data-testid="referrer-params">{JSON.stringify(referrer?.params ?? {})}</b></div>
        <div class="row">full referrer JSON: <b data-testid="referrer-json">{JSON.stringify(referrer ?? null)}</b></div>
    </section>

    <section class="actions">
        <button
            data-testid="btn-push-from-named"
            onclick={() => push('testReferrerFrom', { source: 'origin' }, { 'source-q': '1' })}
        >push('testReferrerFrom', &#123; source: 'origin' &#125;, &#123; source-q: '1' &#125;)</button>
        <button
            data-testid="btn-push-to-named"
            onclick={() => push('testReferrerTo', { dest: 'page-b' })}
        >push('testReferrerTo', &#123; dest: 'page-b' &#125;) (named route)</button>
        <button
            data-testid="btn-push-to-path"
            onclick={() => push('/test/referrer/to/raw')}
        >push('/test/referrer/to/raw') (raw path)</button>
    </section>

    <section class="links">
        <a href="/test/referrer/from/origin?source-q=1" data-testid="link-from-origin" use:link>
            /test/referrer/from/origin?source-q=1
        </a>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
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
