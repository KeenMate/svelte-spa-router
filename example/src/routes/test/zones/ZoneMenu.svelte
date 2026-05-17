<script>
    let { routeParams = {} } = $props()
</script>

<div data-testid="zone-menu-content">
    <h2 data-testid="zone-menu-heading">Menu zone</h2>
    <div>id: <b data-testid="zone-menu-id">{routeParams?.id ?? ''}</b></div>
</div>

<style>
    div[data-testid='zone-menu-content'] {
        background: #e0f2fe;
        padding: 0.5rem;
        border-radius: 4px;
    }
    h2 { margin: 0 0 0.25rem; font-size: 1rem; color: #075985; }
</style>
