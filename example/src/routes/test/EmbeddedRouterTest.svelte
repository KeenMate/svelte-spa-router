<script>
    import Router, { link } from '@keenmate/svelte-spa-router'
    import NavigationTest from './NavigationTest.svelte'

    // A nested Router with NO catch-all route. Used by router-events.spec.ts
    // to verify that onNotFound fires when no route matches (the app-level
    // Router has a '*' catch-all, so its onNotFound never triggers).
    const innerRoutes = {
        '/known': NavigationTest
    }

    function handleNotFound(event) {
        if (typeof window !== 'undefined') {
            window.__embeddedNotFoundEvents = window.__embeddedNotFoundEvents || []
            window.__embeddedNotFoundEvents.push({
                location: event.detail?.location,
                relativeLocation: event.detail?.relativeLocation,
                querystring: event.detail?.querystring
            })
        }
    }
</script>

<svelte:head>
    <title>Test &mdash; embedded router (404)</title>
</svelte:head>

<main>
    <h1>Embedded Router Fixture</h1>
    <p>
        Targeted by <code>e2e/router-events.spec.ts</code>. Hosts a nested
        <code>Router</code> over the prefix <code>/test/embed</code> with a single
        registered child route. Sub-paths that don't match the child fire
        <code>onNotFound</code> on the nested router.
    </p>

    <section class="links">
        <a href="/test/embed/known" data-testid="link-known" use:link>/test/embed/known (matches)</a>
        <a href="/test/embed/missing" data-testid="link-missing" use:link>/test/embed/missing (no match → onNotFound)</a>
    </section>

    <section data-testid="embedded-output">
        <Router prefix="/test/embed" routes={innerRoutes} onNotFound={handleNotFound} />
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .links { display: flex; flex-direction: column; gap: 0.25rem; }
    .links a { font-size: 0.85rem; color: #1d4ed8; }
    section[data-testid='embedded-output'] {
        border: 1px dashed #94a3b8;
        padding: 0.5rem;
        margin-top: 0.5rem;
    }
</style>
