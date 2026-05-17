<script>
    let { routeParams = {} } = $props()
</script>

<div data-testid="zone-aside-content">
    <h2 data-testid="zone-aside-heading">Aside zone</h2>
    <div>id: <b data-testid="zone-aside-id">{routeParams?.id ?? ''}</b></div>
</div>

<style>
    div[data-testid='zone-aside-content'] {
        background: #fef3c7;
        padding: 0.5rem;
        border-radius: 4px;
    }
    h2 { margin: 0 0 0.25rem; font-size: 1rem; color: #854d0e; }
</style>
