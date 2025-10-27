<script>
let { routeParams = {} } = $props()
</script>

<div>User: {routeParams.name || 'Guest'} {routeParams.surname || ''}</div>
