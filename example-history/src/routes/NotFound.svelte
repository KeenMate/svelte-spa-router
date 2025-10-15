<script>
import {link, location} from '../../../src/lib/utils.svelte.js'
</script>

<h1>404 - Not Found</h1>

<p>The page <strong>{location()}</strong> could not be found.</p>

<p><a href="/" use:link>← Go to Home</a></p>

<style>
h1 {
    color: #d32f2f;
}
</style>
