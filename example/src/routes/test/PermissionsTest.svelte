<script>
    import { link } from '@keenmate/svelte-spa-router'
    import { hasPermission } from '@keenmate/svelte-spa-router/helpers/permissions'
    import { user, toggleUser } from '../../stores/userStore.svelte.js'

    const currentUser = $derived(user())
    const canRead = $derived(hasPermission({ any: ['read'] }))
    const canAdmin = $derived(hasPermission({ any: ['admin'] }))
    const canReadAndAdmin = $derived(hasPermission({ all: ['read', 'admin'] }))
    const canReadAndUserView = $derived(hasPermission({ all: ['read', 'user:view'] }))
</script>

<svelte:head>
    <title>Test &mdash; permissions</title>
</svelte:head>

<main>
    <h1>Permissions Test Fixture</h1>
    <p>Targeted by <code>e2e/permissions.spec.ts</code>. Uses the existing userStore (Donna ↔ Audrey).</p>

    <section data-testid="user-state">
        <div class="row">user.name: <b data-testid="user-name">{currentUser.name}</b></div>
        <div class="row">user.permissions: <b data-testid="user-permissions">{currentUser.permissions.join(',')}</b></div>
        <div class="row">user.accessibleDocuments: <b data-testid="user-docs">{(currentUser.accessibleDocuments ?? []).join(',')}</b></div>
        <button data-testid="btn-toggle-user" onclick={toggleUser}>Toggle user</button>
    </section>

    <section>
        <h2>hasPermission()</h2>
        <div class="row">any:[read]: <b data-testid="has-read">{String(canRead)}</b></div>
        <div class="row">any:[admin]: <b data-testid="has-admin">{String(canAdmin)}</b></div>
        <div class="row">all:[read,admin]: <b data-testid="has-read-and-admin">{String(canReadAndAdmin)}</b></div>
        <div class="row">all:[read,user:view]: <b data-testid="has-read-and-user-view">{String(canReadAndUserView)}</b></div>
    </section>

    <section>
        <h2>Protected routes</h2>
        <a href="/test/perms/needs-read" data-testid="link-needs-read" use:link>/test/perms/needs-read (any:[read])</a>
        <a href="/test/perms/needs-admin" data-testid="link-needs-admin" use:link>/test/perms/needs-admin (any:[admin])</a>
        <a href="/test/perms/document/1" data-testid="link-doc-1" use:link>/test/perms/document/1 (auth: doc 1)</a>
        <a href="/test/perms/document/2" data-testid="link-doc-2" use:link>/test/perms/document/2 (auth: doc 2)</a>
        <a href="/test/perms/document/4" data-testid="link-doc-4" use:link>/test/perms/document/4 (auth: doc 4)</a>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    h1 { margin: 0 0 0.5rem; }
    h2 { margin: 0 0 0.5rem; font-size: 1rem; }
    section {
        border: 1px solid #cbd5e1;
        padding: 0.75rem;
        margin: 0.75rem 0;
        border-radius: 4px;
        background: #f8fafc;
    }
    .row {
        font-size: 0.85rem;
        margin-bottom: 0.3rem;
        font-family: monospace;
    }
    .row b {
        background: white;
        padding: 0.05rem 0.35rem;
        border-radius: 3px;
        margin-left: 0.25rem;
    }
    section a { display: block; font-size: 0.85rem; color: #1d4ed8; padding: 0.1rem 0; }
    button {
        margin-top: 0.4rem;
        padding: 0.35rem 0.75rem;
        border: 1px solid #94a3b8;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }
    button:hover { background: #e2e8f0; }
</style>
