<script>
import {link, location, querystring} from '@keenmate/svelte-spa-router/utils'
</script>

<h1>About</h1>
<p>This is a Svelte 5 router using runes!</p>

<div class="info">
    <p><strong>Current Location:</strong> {location()}</p>
    <p><strong>Querystring:</strong> {querystring() || '(none)'}</p>
</div>

<p><a href="/" use:link>← Back to Home</a></p>

<style>
.info {
    background: #f0f0f0;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}
</style>
