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
 *   hidden    — boolean | (node) => boolean. Always-destructive in both
 *                 filter modes. The getter form makes the node reactive to
 *                 anything it reads inside (env vars, $state, feature flags).
 *   disabled    — boolean | (node) => boolean. Always-forbidden flag —
 *                 doesn't depend on the current user. Use for coming-soon
 *                 placeholders, deprecated features, etc. Renders as
 *                 forbidden in BOTH modes (it's a product-level signal,
 *                 not a user-permission one). An ancestor's permission
 *                 denial can still hide a disabled descendant (you can't
 *                 reach the menu section to see the placeholder). Self-only
 *                 — doesn't cascade to children.
 *   tooltip     — string | (node, { forbidden }) => string | null. Resolved by
 *                 the filter and exposed as `_tooltip` for NavLink to render
 *                 as a title= attribute. Primary use case: explain why a
 *                 forbidden item is disabled in disable mode.
 *   children    — recursive
 *   keepIfEmpty — force a parent to render even when all its children are
 *                 filtered out (rare; useful for pure section headers)
 *   noRoute     — non-navigable section header. Filter it out when
 *                 registering routes; <NavLink noRoute> renders a span
 *                 instead of an anchor. Path is still useful for breadcrumbs,
 *                 tooltips, and the forbidden cascade.
 *   meta        — convention (not enforced by the library) for arbitrary
 *                 consumer data: `meta: { requiredRole, docsUrl, owner, ... }`.
 *                 Keeps custom fields off the top level where they'd compete
 *                 with library-defined props. Mirrors the router's
 *                 `routeContext` pattern. Rides through filterByPermissions()
 *                 untouched on the output node.
 *
 * The two users in `userStore.svelte.js`:
 *   donna   — permissions: read, write, user:view
 *   audrey  — permissions: read, admin, user:view, user:edit, settings:manage
 */

/**
 * Reactive feature-flags. Read inside `hidden` getters below — toggling
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
        // Always-on tooltip — both demo users have user:view, so this node
        // is never forbidden. Useful for plain section descriptions.
        tooltip: 'Manage users in this workspace',
        // Section header — no page lives at /users. App.svelte filters
        // noRoute nodes out of route registration; NavLink renders them as
        // <span class="nav-header"> instead of a link.
        noRoute: true,
        children: [
            {
                path: '/nav-tree-demo/users/list',
                title: 'All users',
                permissions: { any: ['user:view'] }
            },
            {
                path: '/nav-tree-demo/users/new',
                title: 'Create user',
                permissions: { any: ['user:edit'] },   // Audrey only
                // Callback form — only emit copy when the item is actually
                // disabled. Returning null skips the title= attribute.
                tooltip: (_node, { forbidden }) =>
                    forbidden ? 'Requires the user:edit permission' : null
            },
            {
                path: '/nav-tree-demo/users/123',
                title: 'User 123',
                permissions: { any: ['user:view'] },
                children: [
                    {
                        path: '/nav-tree-demo/users/123/profile',
                        title: 'Profile'
                        // Inherits parent's user:view requirement.
                    },
                    {
                        path: '/nav-tree-demo/users/123/activity',
                        title: 'Activity'
                    },
                    {
                        path: '/nav-tree-demo/users/123/permissions',
                        title: 'Permissions',
                        permissions: { any: ['user:edit'] },   // Audrey only
                        tooltip: (_node, { forbidden }) =>
                            forbidden ? 'Editing user permissions needs user:edit' : null
                    }
                ]
            }
        ]
    },
    {
        path: '/nav-tree-demo/admin',
        title: 'Admin',
        permissions: { any: ['admin'] },               // Audrey only
        // Convention: stash arbitrary consumer data under `meta` so it
        // doesn't collide with library-defined fields. Mirrors the router's
        // `routeContext` pattern (formerly `userData`) for route definitions.
        // Survives filterByPermissions() untouched.
        meta: {
            requiredRole: 'Workspace Administrator',
            docsUrl: 'https://example.com/docs/admin'
        },
        tooltip: (_node, { forbidden }) =>
            forbidden ? 'Admin section — requires the admin role' : null,
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
        permissions: { any: ['settings:manage'] },     // Audrey only
        meta: {
            requiredRole: 'Workspace Administrator',
            docsUrl: 'https://example.com/docs/settings'
        },
        // Static string — shown unconditionally. In hide mode this never
        // surfaces because the node is dropped; in disable mode it explains
        // the disabled state.
        tooltip: 'Workspace settings are owned by admins (settings:manage)'
    },
    {
        // Disabled with meta + rich tooltip, but NO permissions. Lets you
        // see the rich tooltip's "permanently disabled" branch (uses
        // meta.reason instead of "Requires the X role") without switching
        // users. Dropped in hide mode, visible as forbidden in disable mode.
        path: '/nav-tree-demo/marketplace',
        title: 'Marketplace',
        disabled: true,
        meta: {
            reason: 'In private beta — public launch Q3',
            docsUrl: 'https://example.com/docs/marketplace'
        }
    },
    {
        path: '/nav-tree-demo/labs',
        title: 'Labs',
        // Dev-only: the getter reads import.meta.env.DEV at filter time.
        // Compile-time constant in prod, so the whole branch is gone in
        // production builds. Visible in `make dev`.
        hidden: () => !import.meta.env.DEV,
        children: [
            {
                path: '/nav-tree-demo/labs/beta-feature',
                title: 'Beta feature'
            }
        ]
    },
    {
        // Product-level disabled item — `disabled: true` makes this node
        // always forbidden regardless of who's logged in. Common pattern for
        // "coming soon" placeholders. Dropped in hide mode, shown as
        // forbidden in disable mode (with the tooltip explaining why).
        path: '/nav-tree-demo/integrations',
        title: 'Integrations',
        disabled: true,
        tooltip: 'Coming feature..'
    },
    {
        path: '/nav-tree-demo/preview',
        title: 'Preview features',
        // Runtime feature flag — the getter reads a `$state` rune at filter
        // time, so the demo UI can flip the section on/off at runtime
        // without a page reload. Hidden by default; toggle from the demo
        // sidebar to reveal.
        hidden: () => !flags.showNewFeatures,
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
        hidden: true
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
