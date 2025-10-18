<script>
import {link, location} from '@keenmate/svelte-spa-router/utils'
</script>

<h1>404 - Not Found</h1>

<p>The page <strong>{location()}</strong> could not be found.</p>

<p><a href="/" use:link>← Go to Home</a></p>

<style>
h1 {
    color: #d32f2f;
}
</style>
