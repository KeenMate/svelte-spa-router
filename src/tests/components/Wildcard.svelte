<script>
let { routeParams = {} } = $props()
</script>

<div>Wildcard: {routeParams.wild || 'none'}</div>
