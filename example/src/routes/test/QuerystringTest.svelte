<script>
    import { link, push } from '@keenmate/svelte-spa-router'
    import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
    import {
        parseQuerystring,
        stringifyQuerystring
    } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

    const q = $derived(query())

    // parseQuerystring + stringifyQuerystring are pure helpers — no current
    // location dependency. We just show the result of fixed inputs for the spec.
    const parsedSample = $derived(parseQuerystring('name=alice&age=30&tags=a,b,c'))
    const stringifiedSample = $derived(stringifyQuerystring({ name: 'bob', age: 21, tags: ['x', 'y'] }))
</script>

<svelte:head>
    <title>Test &mdash; querystring</title>
</svelte:head>

<main>
    <h1>Querystring Utilities Test Fixture</h1>
    <p>
        Targeted by <code>e2e/querystring.spec.ts</code>. Uses the reactive <code>query()</code>
        helper (configured with <code>arrayFormat: 'auto'</code> in main.js) and the pure
        <code>parseQuerystring</code> / <code>stringifyQuerystring</code> functions.
    </p>

    <section data-testid="state">
        <div class="row">query() JSON: <b data-testid="query-json">{JSON.stringify(q)}</b></div>
        <div class="row">query().name: <b data-testid="query-name">{q?.name ?? ''}</b></div>
        <div class="row">query().tags type: <b data-testid="query-tags-type">{Array.isArray(q?.tags) ? 'array' : typeof q?.tags}</b></div>
        <div class="row">query().tags joined: <b data-testid="query-tags">{Array.isArray(q?.tags) ? q.tags.join('|') : (q?.tags ?? '')}</b></div>
    </section>

    <section>
        <h2>Pure helpers</h2>
        <div class="row">parseQuerystring('name=alice&age=30&tags=a,b,c'): <b data-testid="parse-sample">{JSON.stringify(parsedSample)}</b></div>
        <div class="row">stringifyQuerystring({'{ name: bob, age: 21, tags: [x,y] }'}): <b data-testid="stringify-sample">{stringifiedSample}</b></div>
    </section>

    <section class="links">
        <a href="/test/querystring?name=alice" data-testid="link-simple" use:link>?name=alice (single value)</a>
        <a href="/test/querystring?tags=a,b,c" data-testid="link-tags-comma" use:link>?tags=a,b,c (comma format)</a>
        <a href="/test/querystring?tag=a&tag=b&tag=c" data-testid="link-tags-repeat" use:link>?tag=a&tag=b&tag=c (repeat format)</a>
        <a href="/test/querystring" data-testid="link-empty" use:link>(empty)</a>
        <button
            data-testid="btn-push-multiple"
            onclick={() => push('/test/querystring?name=charlie&page=2&active=true')}
        >
            push with multiple values
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
        word-break: break-all;
    }
    .row b {
        background: white;
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
        margin-left: 0.25rem;
    }
    .links a, .links button {
        display: block;
        font-size: 0.85rem;
        color: #1d4ed8;
        margin: 0.2rem 0;
    }
    button {
        padding: 0.25rem 0.5rem;
        border: 1px solid #94a3b8;
        background: white;
        border-radius: 4px;
        cursor: pointer;
    }
</style>
