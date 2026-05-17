<script>
    import { link, revalidateCurrentRoute } from '@keenmate/svelte-spa-router'
    import { user, toggleUser } from '../../stores/userStore.svelte.js'

    const currentUser = $derived(user())

    function downgradeAndRevalidate() {
        if (currentUser.id !== 1) toggleUser()
        revalidateCurrentRoute()
    }
    function upgradeAndRevalidate() {
        if (currentUser.id !== 2) toggleUser()
        revalidateCurrentRoute()
    }
    function justRevalidate() {
        revalidateCurrentRoute()
    }
</script>

<svelte:head>
    <title>Test &mdash; revalidate / protected</title>
</svelte:head>

<main>
    <h1 data-testid="protected-heading">Admin-only Protected Page</h1>
    <p>Reached only when the current user has the <code>admin</code> permission.</p>

    <section class="actions">
        <a href="/test/revalidate" data-testid="link-back" use:link>← back to fixture</a>
        <button data-testid="btn-downgrade-revalidate" onclick={downgradeAndRevalidate}>Downgrade + revalidate</button>
        <button data-testid="btn-upgrade-revalidate" onclick={upgradeAndRevalidate}>Upgrade + revalidate</button>
        <button data-testid="btn-just-revalidate" onclick={justRevalidate}>Just revalidate (no user change)</button>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .actions { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-start; margin-top: 0.75rem; }
    .actions a { font-size: 0.85rem; color: #1d4ed8; }
    button {
        padding: 0.35rem 0.75rem;
        border: 1px solid #94a3b8;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }
    button:hover { background: #e2e8f0; }
</style>
