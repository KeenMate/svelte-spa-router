# Permission-Based Routing Example

This example demonstrates how to use permission-based route guards with @keenmate/svelte-spa-router.

## Features Demonstrated

- ✅ Route-level permission checks
- ✅ Redirect to unauthorized page when access denied
- ✅ Multiple permission types (`any`, `all`)
- ✅ UI elements that show/hide based on permissions
- ✅ Mock authentication system
- ✅ Dynamic user role switching

## How It Works

### 1. Configure Permission System

In `main.js`, configure the permission checker before mounting:

```javascript
import { configurePermissions } from '@keenmate/svelte-spa-router/helpers/permissions'
import { get } from 'svelte/store'
import { currentUser } from './stores/auth'

configurePermissions({
  checkPermissions: (user, requirements) => {
    if (!user) return false
    if (!requirements) return true

    // Check 'any' requirements (user needs at least one)
    if (requirements.any) {
      return requirements.any.some(perm =>
        user.permissions.includes(perm)
      )
    }

    // Check 'all' requirements (user needs all)
    if (requirements.all) {
      return requirements.all.every(perm =>
        user.permissions.includes(perm)
      )
    }

    return true
  },
  getCurrentUser: () => get(currentUser),
  onUnauthorized: (detail) => {
    console.warn('Access denied to:', detail.location)
    push('/unauthorized')
  }
})
```

### 2. Protect Routes

Use `wrap()` with permission conditions:

```javascript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import { createPermissionCondition } from '@keenmate/svelte-spa-router/helpers/permissions'

const routes = {
  '/admin': wrap({
    component: () => import('./Admin.svelte'),
    conditions: [
      createPermissionCondition({
        any: ['admin.read', 'admin.write']
      })
    ]
  }),

  '/settings': wrap({
    component: () => import('./Settings.svelte'),
    conditions: [
      createPermissionCondition({
        all: ['settings.read', 'settings.write']
      })
    ]
  })
}
```

### 3. Use Helper for Cleaner Syntax

```javascript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'

const routes = {
  '/admin': wrap(createProtectedRoute({
    component: () => import('./Admin.svelte'),
    permissions: { any: ['admin.read'] },
    loadingComponent: Loading
  }))
}
```

### 4. Show/Hide UI Based on Permissions

```svelte
<script>
import { hasPermission } from '@keenmate/svelte-spa-router/helpers/permissions'
</script>

{#if hasPermission({ any: ['admin.read'] })}
  <a href="/admin" use:link>Admin Panel</a>
{/if}
```

## Mock Users in Example

The example includes mock users with different permission levels:

**Guest (No login):**
- Can view public pages only
- Redirected when accessing protected routes

**User (user/password):**
- Permissions: `['documents.read', 'profile.read']`
- Can access documents and profile
- Cannot access admin or settings

**Admin (admin/password):**
- Permissions: `['admin.read', 'admin.write', 'settings.read', 'settings.write', 'documents.read']`
- Full access to all routes

## Running the Example

```bash
cd example-permissions
npm install
npm run dev
```

## Permission Patterns

### Any Permission (OR logic)
User needs at least one permission:
```javascript
permissions: {
  any: ['admin.read', 'admin.write']
}
```

### All Permissions (AND logic)
User needs all permissions:
```javascript
permissions: {
  all: ['settings.read', 'settings.write']
}
```

### Combined Requirements
```javascript
permissions: {
  any: ['admin.read', 'moderator.read'],
  all: ['tenant.active']
}
```

## Integration with Real Auth

Replace the mock store with your actual authentication:

```javascript
// stores/auth.js
import { writable } from 'svelte/store'
import { api } from './api'

export const currentUser = writable(null)

export async function login(username, password) {
  const user = await api.login(username, password)
  currentUser.set(user)
}

export function logout() {
  currentUser.set(null)
  push('/login')
}
```

Then configure permissions to use your real auth system:

```javascript
configurePermissions({
  checkPermissions: (user, requirements) => {
    // Your actual permission logic
    return yourPermissionChecker(user, requirements)
  },
  getCurrentUser: () => get(currentUser),
  onUnauthorized: () => push('/unauthorized')
})
```

## Notes

- Permission checks run **before** component loads
- Failed checks prevent component from loading entirely
- Use `hasPermission()` helper for conditional UI
- Configure permissions **before** mounting app
- Combine with `wrap()` conditions for maximum flexibility
