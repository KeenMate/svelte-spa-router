<script>
    let { routeParams = {} } = $props()
</script>

<main>
    <h1 data-testid="protected-heading">Protected OK</h1>
    {#if routeParams?.id !== undefined}
        <div>doc id: <b data-testid="protected-doc-id">{routeParams.id}</b></div>
    {/if}
</main>

<style>
    main { padding: 1rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    h1 { color: #166534; }
    b { background: #dcfce7; padding: 0.05rem 0.35rem; border-radius: 3px; }
</style>
