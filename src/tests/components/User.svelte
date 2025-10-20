<script>
let { params = {} } = $props()
</script>

<div>User: {params.id || 'unknown'}</div>
