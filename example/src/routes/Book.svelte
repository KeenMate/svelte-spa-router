<script>
import {link} from '@keenmate/svelte-spa-router/utils'

let { params = {} } = $props()
</script>

<h1>Book Details</h1>

<p>Book path: <code>{params.wild || '(empty)'}</code></p>

<p>This route uses a wildcard (*) pattern to match any path after /book/</p>

<p><a href="/" use:link>← Back to Home</a></p>

<style>
code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
}
</style>
