<script>
let { params = {} } = $props()
</script>

<div>User: {params.name || 'Guest'} {params.surname || ''}</div>
