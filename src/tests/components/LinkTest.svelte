<script>
import { link } from '../../lib/utils.svelte.js'
</script>

<a href="/test" use:link data-testid="basic-link">Basic Link</a>
<a href="/external" target="_blank" use:link data-testid="external-link">External</a>
<a href="https://example.com" use:link data-testid="absolute-link">Absolute</a>
