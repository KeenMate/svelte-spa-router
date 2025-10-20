<script>
import active from '../../lib/active.svelte.js'
</script>

<a href="/home" use:active data-testid="home-link">Home</a>
<a href="/about" use:active data-testid="about-link">About</a>
<a href="/contact" use:active={{className: 'current'}} data-testid="contact-link">Contact</a>
<a href="/users" use:active={{path: '/users/*'}} data-testid="users-link">Users</a>
