# Hierarchical routes

Define routes in a hierarchical tree structure as an alternative to flat definitions. Child paths are automatically concatenated to parent paths, and routes inherit metadata from parents.

## Enable hierarchical mode

Disabled by default — routes are flat with no inheritance:

```javascript
// main.js - before mounting app
import { setHierarchicalRoutesEnabled } from '@keenmate/svelte-spa-router'

setHierarchicalRoutesEnabled(true)  // default: false
```

## Define routes using tree structure

```javascript
import { createHierarchy } from '@keenmate/svelte-spa-router/helpers/hierarchy'

const routes = createHierarchy({
    '/admin': {
        name: 'admin',
        component: AdminLayout,
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Admin' }
        ],
        permissions: { any: ['admin'] },
        children: {
            'users': {
                name: 'adminUsers',
                component: AdminUsers,
                breadcrumbs: [{ label: 'Users' }],
                // Inherits 'admin' permission from parent
                // Effective path: /admin/users
                // Effective breadcrumbs: [Home, Admin, Users]
                children: {
                    ':id': {
                        name: 'adminUserDetail',
                        component: AdminUserDetail,
                        breadcrumbs: [{ label: 'User Detail' }]
                        // Inherits 'admin' permission from ancestors
                        // Effective path: /admin/users/:id
                        // Effective breadcrumbs: [Home, Admin, Users, User Detail]
                    }
                }
            },
            'settings': {
                component: AdminSettings,
                breadcrumbs: [{ label: 'Settings' }],
                permissions: { any: ['settings:manage'] }
                // Requires BOTH 'admin' AND 'settings:manage'
            }
        }
    }
})

// Navigate using names
await push('adminUserDetail', { id: 123 })
// Results in: /admin/users/123
```

## Key features

- **Relative child paths** — no need to repeat parent segments
- **Automatic inheritance** — breadcrumbs, permissions, conditions, authorization
- **Optional names** — only add when needed for `push(name, params)`
- **Coexists with flat routes** — mix and match both APIs

## Combine with flat routes

```javascript
const hierarchicalRoutes = createHierarchy({ /* ... */ })
const flatRoutes = { '/': Home, '/about': About }

const routes = {
    ...hierarchicalRoutes,
    ...flatRoutes
}
```

## Path concatenation rules

```javascript
// Parent: '/users'
// Child: ':id' → '/users/:id'
// Child: '/settings' → '/users/settings' (leading slash stripped)
// Child: '*' → '/users/*' (catch-all)

// Multi-level nesting
'/documents'           // /documents
  ':id'                // /documents/:id
    'logs'             // /documents/:id/logs
    'permissions'      // /documents/:id/permissions
```

## Inheritance behavior in flat mode

You can also use hierarchical inheritance with flat route definitions (without `createHierarchy()`). Use `createRoute()` and the router automatically infers parent-child relationships from path prefixes.

```javascript
import { createRoute } from '@keenmate/svelte-spa-router/wrap'

const routes = {
    // Parent route
    '/documents': createRoute({
        component: Documents,
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents' }
        ],
        permissions: { any: ['read'] }
    }),

    // Child route - automatically inherits parent breadcrumbs and permissions
    '/documents/:id': createRoute({
        component: DocumentDetail,
        breadcrumbs: [
            { label: 'Document Detail' }
        ],
        permissions: { any: ['documents.view'] }
        // Effective breadcrumbs: [Home, Documents, Document Detail]
        // Effective permissions: Must have 'read' AND 'documents.view'
    })
}
```

### Opting out of inheritance (flat mode only)

Use `inheritX: false` flags to break the inheritance chain:

```javascript
'/documents/public/:id': createRoute({
    component: PublicDocument,
    breadcrumbs: [{ label: 'Public Document' }],
    permissions: { any: ['guest'] },
    inheritBreadcrumbs: false,  // Start fresh breadcrumbs
    inheritPermissions: false,  // Independent permission check
    inheritConditions: false    // Skip parent conditions
})
```

> **Note:** Tree mode (`createHierarchy()`) always inherits — there is no opt-out. If you need to break inheritance for a single route, use flat mode for that route instead.

## Permission inheritance behavior

Permissions work like filesystem security — all ancestor checks must pass:

```javascript
// Parent requires 'read'
// Child requires 'documents.view'
// Grandchild requires 'logs.view'

// To access /documents/123/logs:
// 1. Check 'read' (parent) → must pass
// 2. Check 'documents.view' (child) → must pass
// 3. Check 'logs.view' (grandchild) → must pass
//
// If ANY check fails, access is denied (fail-fast)
```

This matches Linux/Windows filesystem permissions where you need access to all parent directories to reach a nested file.

## When to use which API

**Use `createHierarchy()` (tree mode) when:**
- You have deeply nested routes (3+ levels)
- Child routes always inherit from parents
- You want concise, readable route definitions
- Route structure mirrors UI hierarchy

**Use flat route definitions when:**
- Routes are mostly shallow (1-2 levels)
- You need fine-grained control over inheritance (opt-out flags)
- Route structure doesn't match visual hierarchy
- You prefer explicit path definitions

See `HIERARCHICAL_ROUTES_DESIGN.md` for detailed design decisions and implementation details.
