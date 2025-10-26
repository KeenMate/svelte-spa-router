<script>
let { routeParams = {} } = $props()
</script>

<div>User: {routeParams.id || 'unknown'}</div>
