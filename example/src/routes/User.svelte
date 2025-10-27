<script>
import {link} from '@keenmate/svelte-spa-router/utils'

// Get route params using $props
let { routeParams = {} } = $props()
</script>

<h1>User Profile</h1>

<div class="profile">
    <p><strong>First Name:</strong> {routeParams.first || 'Unknown'}</p>
    {#if routeParams.last}
        <p><strong>Last Name:</strong> {routeParams.last}</p>
    {:else}
        <p><em>No last name provided</em></p>
    {/if}
</div>

<h2>All Params:</h2>
<pre>{JSON.stringify(routeParams, null, 2)}</pre>

<p><a href="/" use:link>← Back to Home</a></p>

<style>
.profile {
    background: #e3f2fd;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}
pre {
    background: #263238;
    color: #aed581;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
}
</style>
