<script>
    import { onMount } from 'svelte'
    import { hideLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'

    // shouldDisplayLoadingOnRouteLoad keeps the loadingComponent visible until
    // we explicitly call hideLoading() — the manual-control pattern documented
    // in the router README. We delay hideLoading() so the loading state is
    // long enough for the e2e spec to observe it.
    onMount(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        hideLoading()
    })
</script>

<main>
    <h1 data-testid="wrap-async-heading">Async Loaded</h1>
    <p>This component was lazy-imported via wrap()'s asyncComponent.</p>
</main>

<style>
    main { padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    h1 { color: #166534; }
</style>
