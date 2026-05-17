<script>
    import { link, revalidateCurrentRoute } from '@keenmate/svelte-spa-router'
    import { hasPermission } from '@keenmate/svelte-spa-router/helpers/permissions'
    import { user, toggleUser } from '../../stores/userStore.svelte.js'

    // Fixture for e2e/revalidate.spec.ts.
    // The app pre-configures onRevalidationFailure in main.js to push each
    // invocation to window.__revalidationFailureCalls so the spec can assert.

    const currentUser = $derived(user())
    const canAdmin = $derived(hasPermission({ any: ['admin'] }))

    function downgradeAndRevalidate() {
        // Toggle to Donna (no admin), then trigger revalidation.
        if (currentUser.id !== 1) {
            toggleUser()
        }
        revalidateCurrentRoute()
    }

    function upgradeAndRevalidate() {
        if (currentUser.id !== 2) {
            toggleUser()
        }
        revalidateCurrentRoute()
    }

    function justRevalidate() {
        revalidateCurrentRoute()
    }
</script>

<svelte:head>
    <title>Test &mdash; revalidate</title>
</svelte:head>

<main>
    <h1 data-testid="revalidate-fixture-heading">Revalidate Test Fixture</h1>
    <p>
        Targeted by <code>e2e/revalidate.spec.ts</code>. Navigate to the
        protected sub-route, downgrade the user, then call
        <code>revalidateCurrentRoute()</code> to see the revalidation flow.
    </p>

    <section data-testid="user-state">
        <div class="row">user.name: <b data-testid="user-name">{currentUser.name}</b></div>
        <div class="row">hasPermission(admin): <b data-testid="has-admin">{String(canAdmin)}</b></div>
    </section>

    <section class="actions">
        <a href="/test/revalidate/protected" data-testid="link-protected" use:link>Go to /test/revalidate/protected (needs admin)</a>
        <button data-testid="btn-downgrade-revalidate" onclick={downgradeAndRevalidate}>Downgrade to non-admin + revalidate</button>
        <button data-testid="btn-upgrade-revalidate" onclick={upgradeAndRevalidate}>Upgrade to admin + revalidate</button>
        <button data-testid="btn-just-revalidate" onclick={justRevalidate}>Just revalidate (no user change)</button>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    section {
        border: 1px solid #cbd5e1;
        padding: 0.75rem;
        margin: 0.75rem 0;
        border-radius: 4px;
        background: #f8fafc;
    }
    .row { font-size: 0.85rem; margin-bottom: 0.3rem; font-family: monospace; }
    .row b { background: white; padding: 0.05rem 0.35rem; border-radius: 3px; margin-left: 0.25rem; }
    .actions { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-start; }
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
