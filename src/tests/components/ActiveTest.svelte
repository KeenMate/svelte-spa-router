<script>
import active from '../../lib/active.svelte.js'
</script>

<a href="/home" use:active data-testid="home-link">Home</a>
<a href="/about" use:active data-testid="about-link">About</a>
<a href="/contact" use:active={{className: 'current'}} data-testid="contact-link">Contact</a>
<a href="/users" use:active={{path: '/users/*'}} data-testid="users-link">Users</a>

<!-- subtree mode: branch active without writing a regex -->
<a href="/docs" use:active={{subtree: true}} data-testid="subtree-link">Docs</a>
<a
    href="/admin"
    use:active={{subtree: true, className: 'link-active', subtreeClassName: 'sublink-active'}}
    data-testid="subtree-two-class-link"
>Admin</a>
