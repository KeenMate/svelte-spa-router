/**
 * Single source of truth for the tree-driven nav demo.
 *
 * Consumed by:
 *   - NavTreeDemo.svelte  — filters via filterByPermissions(), then walks the
 *                            result to render the sidebar.
 *   - App.svelte          — walks the unfiltered tree to register routes
 *                            (registration is permission-independent — guards
 *                            still enforce access at activation time even if
 *                            the user typed the URL).
 *
 * Schema per node:
 *   path        — absolute route path
 *   title       — label shown in the menu
 *   permissions — { any?: string[], all?: string[] } — same shape as router
 *                 guards. Inherits from ancestors when the filter is run with
 *                 inheritPermissions: true (default).
 *   isHidden    — boolean | (node) => boolean. Always-destructive in both
 *                 filter modes. The getter form makes the node reactive to
 *                 anything it reads inside (env vars, $state, feature flags).
 *   children    — recursive
 *   keepIfEmpty — force a parent to render even when all its children are
 *                 filtered out (rare; useful for pure section headers)
 *
 * The two users in `userStore.svelte.js`:
 *   donna   — permissions: read, write, user:view
 *   audrey  — permissions: read, admin, user:view, user:edit, settings:manage
 */

/**
 * Reactive feature-flags. Read inside `isHidden` getters below — toggling
 * any property here propagates through `$derived(filterByPermissions(...))`
 * in the demo, so the sidebar updates live with no extra plumbing.
 *
 * The demo UI binds a checkbox to `flags.showNewFeatures`. In a real app
 * this would be hydrated from your feature-flag service / SSE / websocket.
 */
export const flags = $state({
    showNewFeatures: false
})

export const navTree = [
    {
        path: '/nav-tree-demo',
        title: 'Overview'
        // No permissions — visible to everyone.
    },
    {
        path: '/nav-tree-demo/users',
        title: 'Users',
        permissions: { any: ['user:view'] },
        children: [
            {
                path: '/nav-tree-demo/users/list',
                title: 'All users',
                permissions: { any: ['user:view'] }
            },
            {
                path: '/nav-tree-demo/users/new',
                title: 'Create user',
                permissions: { any: ['user:edit'] }   // Audrey only
            },
            {
                path: '/nav-tree-demo/users/123',
                title: 'User 123',
                permissions: { any: ['user:view'] }
            }
        ]
    },
    {
        path: '/nav-tree-demo/admin',
        title: 'Admin',
        permissions: { any: ['admin'] },               // Audrey only
        children: [
            {
                path: '/nav-tree-demo/admin/dashboard',
                title: 'Dashboard'
                // Inherits parent's admin requirement.
            },
            {
                path: '/nav-tree-demo/admin/audit',
                title: 'Audit log'
            }
        ]
    },
    {
        path: '/nav-tree-demo/settings',
        title: 'Settings',
        permissions: { any: ['settings:manage'] }      // Audrey only
    },
    {
        path: '/nav-tree-demo/labs',
        title: 'Labs',
        // Dev-only: the getter reads import.meta.env.DEV at filter time.
        // Compile-time constant in prod, so the whole branch is gone in
        // production builds. Visible in `make dev`.
        isHidden: () => !import.meta.env.DEV,
        children: [
            {
                path: '/nav-tree-demo/labs/beta-feature',
                title: 'Beta feature'
            }
        ]
    },
    {
        path: '/nav-tree-demo/preview',
        title: 'Preview features',
        // Runtime feature flag — the getter reads a `$state` rune at filter
        // time, so the demo UI can flip the section on/off at runtime
        // without a page reload. Hidden by default; toggle from the demo
        // sidebar to reveal.
        isHidden: () => !flags.showNewFeatures,
        children: [
            {
                path: '/nav-tree-demo/preview/ai-assistant',
                title: 'AI Assistant'
            },
            {
                path: '/nav-tree-demo/preview/dashboard-v2',
                title: 'Dashboard v2'
            }
        ]
    },
    {
        path: '/nav-tree-demo/secret',
        title: 'Secret ops',
        // Always hidden — example of the unconditional flag.
        isHidden: true
    }
]

export function* walkTree(tree) {
    for (const item of tree) {
        yield item
        if (item.children) yield* walkTree(item.children)
    }
}

export function findNodeByPath(tree, path) {
    for (const item of walkTree(tree)) {
        if (item.path === path) return item
    }
    return null
}
