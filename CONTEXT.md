# Project Context: @keenmate/svelte-spa-router

## Overview

**@keenmate/svelte-spa-router** is a modern router for Svelte 5 applications, built from the ground up using Svelte 5's new runes API. It provides a lightweight, flexible routing solution for Single Page Applications with dual-mode routing support and comprehensive permission management.

## Project Status

**Version:** 1.0.0
**Status:** Production Ready
**Svelte Version:** 5.x
**Publisher:** KeenMate (https://keenmate.com)

### Completed Features

1. ✅ **Core Router (Router.svelte)**
   - Converted to Svelte 5 runes (`$state`, `$props`, `$effect`)
   - Route matching with regexparam
   - Dynamic component loading
   - Route conditions/guards
   - Event system via callback props
   - Scroll restoration support
   - Nested router support

2. ✅ **Dual-Mode Routing System (utils.svelte.js)**
   - **Hash Mode** (default): URLs like `#/path`
   - **History Mode**: Clean URLs like `/path`
   - Configuration functions: `setHashRoutingEnabled()`, `setBasePath()`
   - Reactive state with Svelte 5 runes
   - Navigation: `push()`, `pop()`, `replace()`
   - `link` action with modifier key support
   - Location tracking: `location()`, `querystring()`, `params()`

3. ✅ **Permission System (helpers/permissions.svelte.js)**
   - Flexible role-based access control (RBAC)
   - Permission requirements: `any: [...]` (OR logic), `all: [...]` (AND logic)
   - `configurePermissions()` - Setup function for permission checking
   - `createPermissionCondition()` - Route guard creation
   - `createProtectedRoute()` - Helper to create protected routes
   - `hasPermission()` - UI-level permission checking
   - Integration with `wrap()` utility

4. ✅ **Active Link Highlighting (active.svelte.js)**
   - Automatic CSS class application
   - Works with both hash and history modes
   - Pattern matching support

5. ✅ **Route Wrapping (wrap.js)**
   - Async component loading
   - Code splitting support
   - Loading components
   - Route conditions
   - Static props
   - User data attachment

6. ✅ **URL Helpers (helpers/url-helpers.svelte.js)**
   - `joinPaths()` - Intelligent path joining
   - Slash handling and normalization

## Architecture

### Core Components

```
@keenmate/svelte-spa-router/
├── Router.svelte              # Main router component (Svelte 5 runes)
├── utils.svelte.js            # Core routing utilities + dual-mode support
├── active.svelte.js           # Active link highlighting action
├── wrap.js                    # Route wrapping utility
├── constants.js               # Navigation event constants
└── helpers/
    ├── url-helpers.svelte.js  # Path manipulation utilities
    └── permissions.svelte.js  # Permission system (NEW)
```

### State Management

**Svelte 5 Runes Used:**
- `$state()` - Reactive state (location, params, config)
- `$props()` - Component props
- `$effect()` - Side effects (navigation, scroll restoration)
- `$derived()` - Computed values

**Key State:**
- `locationState` - Current location and querystring
- `paramsState` - Current route parameters
- `hashRoutingEnabled` - Routing mode flag
- `basePath` - Base path for history mode

## Key Features

### 1. Dual-Mode Routing

**Hash Mode (Default):**
```javascript
// No configuration needed
<Router {routes}/>
// URLs: http://example.com/#/path
```

**History Mode:**
```javascript
// main.js - before app mount
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'

setHashRoutingEnabled(false)
setBasePath('/')

mount(App, { target: document.body })
// URLs: http://example.com/path
```

### 2. Permission-Based Routing

**Configuration (main.js):**
```javascript
import { configurePermissions } from '@keenmate/svelte-spa-router/helpers/permissions'

configurePermissions({
  checkPermissions: (user, requirements) => {
    // Custom permission logic
    if (requirements.any) {
      return requirements.any.some(perm => user.permissions.includes(perm))
    }
    return true
  },
  getCurrentUser: () => get(currentUser),
  onUnauthorized: (detail) => push('/unauthorized')
})
```

**Protected Routes:**
```javascript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'

const routes = {
  '/admin': wrap(createProtectedRoute({
    component: () => import('./Admin.svelte'),
    permissions: { any: ['admin.read', 'admin.write'] }
  }))
}
```

**UI-Level Checks:**
```svelte
<script>
import { hasPermission } from '@keenmate/svelte-spa-router/helpers/permissions'
</script>

{#if hasPermission({ any: ['admin.read'] })}
  <a href="/admin" use:link>Admin</a>
{/if}
```

### 3. Route Guards

```javascript
wrap({
  asyncComponent: () => import('./Admin.svelte'),
  conditions: [
    async (detail) => {
      const user = await checkAuth()
      return user.isAuthenticated
    }
  ]
})
```

### 4. Code Splitting

```javascript
const routes = {
  '/': Home,
  '/book/:id': wrap({
    asyncComponent: () => import('./Book.svelte'),
    loadingComponent: Loading
  })
}
```

## API Reference

### Router Component Props
- `routes` - Route definitions (object or Map)
- `prefix` - Optional route prefix for nested routers
- `restoreScrollState` - Enable scroll restoration
- `onrouteEvent` - Route event handler
- `onrouteLoading` - Route loading handler
- `onrouteLoaded` - Route loaded handler
- `onconditionsFailed` - Failed conditions handler

### Navigation Functions
- `push(location)` - Navigate to new page
- `pop()` - Go back in history
- `replace(location)` - Replace current page

### State Functions
- `location()` - Get current location path
- `querystring()` - Get current querystring
- `params()` - Get current route parameters
- `loc()` - Get full location object

### Configuration Functions
- `setHashRoutingEnabled(boolean)` - Set routing mode
- `setBasePath(string)` - Set base path
- `getHashRoutingEnabled()` - Get current mode
- `getBasePath()` - Get current base path

### Permission Functions
- `configurePermissions(config)` - Configure permission system
- `createPermissionCondition(requirements)` - Create route guard
- `createProtectedRoute(options)` - Create protected route
- `hasPermission(requirements)` - Check user permissions

### Actions
- `link` - Enable SPA navigation on anchor tags
- `active` - Add active class to matching links

### Utilities
- `wrap(options)` - Wrap routes with conditions/loading
- `joinPaths(...paths)` - Join path segments

## Migration from v4

**Key Changes:**
1. Stores → Functions: `$location` → `location()`
2. Events → Props: `on:routeLoaded` → `onrouteLoaded`
3. Component Props: `export let params` → `let { params } = $props()`
4. Effects: `.subscribe()` → `$effect()`

**What Stays the Same:**
- Route definition syntax
- `push()`, `pop()`, `replace()`
- `link` and `active` actions
- `wrap()` utility
- Route guards

See `MIGRATION.md` for detailed migration guide.

## Package Exports

```javascript
// Main router
import Router from '@keenmate/svelte-spa-router'

// Utilities
import { location, querystring, params, push, pop, replace, link } from '@keenmate/svelte-spa-router'

// Configuration
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'

// Actions and utilities
import active from '@keenmate/svelte-spa-router/active'
import { wrap } from '@keenmate/svelte-spa-router/wrap'

// Permissions
import {
  configurePermissions,
  createPermissionCondition,
  createProtectedRoute,
  hasPermission
} from '@keenmate/svelte-spa-router/helpers/permissions'

// URL helpers
import { joinPaths } from '@keenmate/svelte-spa-router/helpers/url-helpers'

// Constants
import { SvelteSPARouterNavigationEvent } from '@keenmate/svelte-spa-router/constants'
```

## Testing

**Examples:**
- `example/` - Hash mode example
- `example-history/` - History mode example
- `example-permissions/` - Permission system example (to be created)

**Development Commands:**
```bash
make dev              # Run history mode example
make dev-hash         # Run hash mode example
make build            # Build both examples
make lint             # Run ESLint
```

## Browser Compatibility

- **Hash Mode:** All modern browsers + IE10+
- **History Mode:** All browsers supporting History API (IE10+)
- **Permissions:** All modern browsers

## Dependencies

**Runtime:**
- `regexparam@2.0.2` - Route pattern matching

**Peer Dependencies:**
- `svelte@^5.0.0`

**Dev Dependencies:**
- `eslint@^9.0.0`

## Design Decisions

### Why Runes Instead of Stores?

Svelte 5 runes provide:
- Better performance (no subscription overhead)
- Simpler mental model
- Direct reactivity tracking
- Better tree-shaking

### Why Dual-Mode Routing?

- **Hash Mode**: Zero server config, works everywhere
- **History Mode**: Clean URLs, better UX, SEO-friendly
- **Both**: User choice based on requirements

### Why Permission System?

- Common use case in enterprise apps
- Flexible and customizable
- Integrates cleanly with existing route guards
- No opinions about auth implementation

### Why Not Built-in Auth?

- Router should focus on routing
- Auth strategies vary widely
- Permission system is just a helper
- Users maintain full control

## Future Considerations

**Potential Features:**
- Automated testing suite
- SSR/SvelteKit integration examples
- More permission helpers (role-based, etc.)
- Route metadata support
- Animation/transition helpers

**Not Planned:**
- Built-in authentication
- Built-in state management
- Server-side routing
- Mobile-specific features

## Contributing

See `DEVELOPMENT.md` for development workflow.

**Key Guidelines:**
- Use Svelte 5 runes, not stores
- Maintain backward compatibility in hash mode
- Document all public APIs
- Test in both routing modes
- Keep bundle size small

## License

MIT License - See LICENSE.md

## Credits

- **Publisher:** KeenMate (https://keenmate.com)
- **Original svelte-spa-router:** Alessandro Segala (@ItalyPaleAle)
- **Svelte 5 conversion:** KeenMate team
- **Permission system:** KeenMate team
- **Dual-mode routing:** Adapted from svelte-spa-router-hashless
