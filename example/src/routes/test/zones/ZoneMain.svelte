<script>
    let { routeParams = {} } = $props()
</script>

<div data-testid="zone-main-content">
    <h2 data-testid="zone-main-heading">Main zone</h2>
    <div>id: <b data-testid="zone-main-id">{routeParams?.id ?? ''}</b></div>
</div>

<style>
    div[data-testid='zone-main-content'] {
        background: #ecfccb;
        padding: 0.5rem;
        border-radius: 4px;
    }
    h2 { margin: 0 0 0.25rem; font-size: 1rem; color: #3f6212; }
</style>
