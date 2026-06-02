# Permission-based routing

The router includes a flexible permission system for role-based access control.

## 1. Configure the permission system

In `main.js`, before mounting:

```javascript
import {
    configurePermissions,
    setCurrentUser
} from '@keenmate/svelte-spa-router/helpers/permissions'

configurePermissions({
    checkPermissions: (user, requirements) => {
        if (!user) return false
        if (!requirements) return true

        // Check if user has any of the required permissions
        if (requirements.any) {
            return requirements.any.some(perm => user.permissions.includes(perm))
        }

        // Check if user has all required permissions
        if (requirements.all) {
            return requirements.all.every(perm => user.permissions.includes(perm))
        }

        return true
    },
    onUnauthorized: (detail) => {
        push('/unauthorized')
    }
})

// Push the current user into the permission system. The library keeps an
// internal $state-backed user, so every hasPermission() call site in a
// reactive context (templates, $derived, $effect) re-evaluates automatically
// when you call setCurrentUser() again.
setCurrentUser(null) // logged-out at startup

// Later, on login:
//   setCurrentUser({ id: 42, permissions: ['admin.read'] })
// From a websocket permission update:
//   setCurrentUser({ ...getCurrentUser(), permissions: newPerms })
// On logout:
//   setCurrentUser(null)
```

> **Reactivity:** `hasPermission()` re-evaluates automatically when you call
> `setCurrentUser()` — the function reads from an internal `$state` rune, so
> Svelte's tracker registers the dependency in any reactive context (template
> `{#if}`, `$derived`, `$effect`). No subscription wiring needed on your side.
>
> If you maintain your own reactive user store and prefer to read from it
> directly, pass `getCurrentUser` to `configurePermissions`:
>
> ```js
> configurePermissions({ getCurrentUser: () => myUserState.user, ... })
> ```
>
> Watch out for non-tracked reads (`get(store)`, `localStorage.getItem`, etc.) —
> those won't propagate updates, and your `{#if hasPermission(...)}` blocks
> will appear "broken" (only updating on navigation). The default
> `setCurrentUser`-based path avoids this footgun entirely.

### Re-validating the currently mounted route

`hasPermission()` reactivity covers UI element visibility — the user's menu
and buttons update live when permissions change. It does **not** cover the
case where the user is *sitting on a protected page* when their permissions
are revoked. The router checks route conditions only during navigation, so a
user already on `/admin` who loses admin permission stays on `/admin` until
they navigate away.

To handle this case, call `revalidateCurrentRoute()` after the permission
change:

```javascript
import { revalidateCurrentRoute } from '@keenmate/svelte-spa-router'
import { setCurrentUser, getCurrentUser } from '@keenmate/svelte-spa-router/helpers/permissions'

socket.on('permissions:updated', (newPerms) => {
    setCurrentUser({ ...getCurrentUser(), permissions: newPerms })
    revalidateCurrentRoute()
})
```

This re-runs the matched route's guards and conditions against the current
location. On success, nothing visible happens — the component keeps its
state (no flicker, no scroll reset, no in-flight form data lost). On
failure, the same unauthorized handling that runs for fresh navigation
fires here too.

If you want to customize the failure path — e.g. show a confirmation dialog
before redirecting, soft-warn the user, log to an audit trail — provide an
`onRevalidationFailure` handler:

```javascript
configurePermissions({
    // ... checkPermissions, etc.
    onRevalidationFailure: async (detail) => {
        const confirmed = await showConfirmDialog(
            'Your permissions have changed. Return to the home page?'
        )
        if (confirmed) {
            push('/')
        }
        // If the user dismisses the dialog, they stay on the current page.
    }
})
```

When `onRevalidationFailure` is configured, it fires **instead of** the
standard unauthorized handling for revalidation failures. The
`onConditionsFailed` Router event still fires for consistency with normal
navigation. Pass `onRevalidationFailure: null` to clear and fall back to
standard handling.

Calls to `revalidateCurrentRoute()` within a ~50ms window are coalesced into
a single re-validation pass — safe to call on every websocket message.

## 2. Protect routes with permissions

### Using createProtectedRoute() (recommended)

The most convenient way — no `wrap()` needed!

```javascript
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'
import { push } from '@keenmate/svelte-spa-router'

const routes = {
  '/': Home,

  // No wrap() needed! createProtectedRoute() returns ready-to-use wrapped component
  '/admin': createProtectedRoute({
    component: () => import('./Admin.svelte'),
    permissions: { any: ['admin.read', 'admin.write'] },
    loadingComponent: Loading,
    title: 'Admin Panel',
    breadcrumbs: [
      { label: 'Home', path: '/' },
      { label: 'Admin' }
    ]
  }),

  // User needs ALL of these permissions
  '/settings': createProtectedRoute({
    component: () => import('./Settings.svelte'),
    permissions: { all: ['settings.read', 'settings.write'] },
    title: 'Settings'
  }),

  // Combine role-based and resource-based authorization
  '/document/:id': createProtectedRoute({
    component: () => import('./DocumentDetail.svelte'),
    // Role-based: User must have 'read' permission
    permissions: { any: ['read'] },
    // Resource-based: User must have access to THIS specific document
    authorizationCallback: async (detail) => {
      const documentId = detail.routeParams.id
      const hasAccess = await checkDocumentAccess(documentId)

      if (!hasAccess) {
        // push(route, routeParams, queryString, navigationContext)
        await push('/unauthorized', {}, {}, {
          resource: 'document',
          id: documentId
        })
        return false
      }

      return true
    },
    loadingComponent: Loading,
    shouldDisplayLoadingOnRouteLoad: true,
    title: 'Document Detail'
  }),

  '/unauthorized': Unauthorized,
  '*': NotFound
}
```

### Using wrap() with createProtectedRouteDefinition() (advanced)

For more control or when combining with other `wrap` options:

```javascript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import { createProtectedRouteDefinition } from '@keenmate/svelte-spa-router/helpers/permissions'

const routes = {
  '/admin': wrap(createProtectedRouteDefinition({
    component: () => import('./Admin.svelte'),
    permissions: { any: ['admin.read', 'admin.write'] },
    loadingComponent: Loading
  }))
}
```

## 3. Show/hide UI elements based on permissions

```svelte
<script>
import { hasPermission } from '@keenmate/svelte-spa-router/helpers/permissions'
import { link } from '@keenmate/svelte-spa-router'
</script>

<nav>
  <a href="/" use:link>Home</a>

  {#if hasPermission({ any: ['admin.read'] })}
    <a href="/admin" use:link>Admin Panel</a>
  {/if}

  {#if hasPermission({ all: ['settings.read', 'settings.write'] })}
    <a href="/settings" use:link>Settings</a>
  {/if}
</nav>
```

**Permission requirements:**
- `any: [...]` — User needs at least ONE of these permissions (OR logic)
- `all: [...]` — User needs ALL of these permissions (AND logic)

**Authorization execution order:**

When using both `permissions` and `authorizationCallback`:
1. **Permissions check** (fast, synchronous) — checks user roles/permissions
2. **Authorization callback** (slow, can be async) — checks resource-level access (API calls, database queries, etc.)

This order ensures fast checks happen first, preventing unnecessary API calls when user doesn't have basic permissions.

**Resource-based authorization details:**

The `authorizationCallback` receives a detail object with:

```typescript
{
  route: string,
  location: string,
  params: Record<string, string>,
  query: Record<string, any>,
  routeContext: any,
  navigationContext: any
}
```

Perfect for:
- Document access control (check if user can access specific document)
- Resource ownership (check if user owns this resource)
- Dynamic permissions (permissions stored in database)
- API-based authorization (call your backend for access check)

See `example-permissions/` for a complete working example with mock authentication.

## Conditions vs permissions

Both gate access to a route, but they have **different defaults** and **different failure paths**. Reach for the one that matches your situation:

| | `wrap({ conditions: [...] })` | `createProtectedRoute({ permissions: ... })` |
|---|---|---|
| **What it is** | Low-level primitive: any sync/async predicate(s) you want | Opinionated wrapper around conditions, built on the configured permission system |
| **Setup needed** | None — just write the function | Call `configurePermissions({ checkPermissions, getCurrentUser, onUnauthorized })` once at app start |
| **Where the logic lives** | Inline in the condition function | Inside `checkPermissions` (your function), which is reused across every protected route |
| **On failure: UI** | **Empty slot.** The matched component does not mount; nothing renders in its place unless the consumer redirects | The configured `Unauthorized` component mounts (or `onUnauthorized` callback runs, if set), with `unauthorizedBehavior: 'component' \| 'navigate'` controlling which |
| **On failure: event** | `onConditionsFailed` fires with `{ route, location, querystring, params }` | Same event fires (permissions are conditions under the hood); the unauthorized handling runs in addition |
| **When to choose it** | Ad-hoc check that doesn't fit a generic permission model — feature flags, subscription state, ownership of a single resource, custom redirects | Role/permission-based access control where the same `checkPermissions` logic governs many routes and you want a consistent unauthorized UX |

**Common combo:** use `createProtectedRoute` for the role check (gets you the Unauthorized UI) *and* pass extra `conditions` for one-off checks specific to that route. The router runs them in order — permissions first (fast), then your custom conditions.

## Active link highlighting

```svelte
<script>
import {link} from '@keenmate/svelte-spa-router'
import active from '@keenmate/svelte-spa-router/active'
</script>

<style>
:global(a.active) {
    color: red;
    font-weight: bold;
}
</style>

<a href="/books" use:link use:active>Books</a>
```
