# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@keenmate/svelte-spa-router** is a modern router for Svelte 5 SPAs built with runes (`$state`, `$props`, `$effect`, `$derived`). It supports dual-mode routing (hash-based `#/path` and history API `/path`) with comprehensive permission management for role-based access control.

**Key Technologies:**
- Svelte 5 with runes (NOT Svelte stores)
- regexparam for route pattern matching
- Vitest + Testing Library for tests
- No build step required (distributed as source)

## Common Commands

```bash
# Testing
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report

# Development (Examples)
make dev              # Run history mode example (clean URLs)
make dev-hash         # Run hash mode example (#/path URLs)

# Linting
npm run lint          # Run ESLint

# Building examples
make build-examples   # Build both example apps
make build-hash       # Build hash mode example only
make build-history    # Build history mode example only
```

**Note:** There is no build step for the library itself. The package is distributed as source files.

## Architecture Overview

### Core Module Structure

The router is organized into several key modules:

**Router.svelte** - Main router component
- Uses `$effect()` to watch location changes and match routes
- Handles async component loading with race condition protection
- Manages route conditions/guards evaluation
- Implements scroll restoration with browser History API
- Event system via callback props (onrouteLoading, onrouteLoaded, onconditionsFailed)

**utils.svelte.js** - Core routing utilities and state management
- Contains all reactive state using `$state()` (locationState, paramsState)
- Dual-mode routing: hash-based (default) or history API
- Configuration: `setHashRoutingEnabled()`, `setBasePath()`
- Navigation functions: `push()`, `pop()`, `replace()`
- State accessors: `location()`, `querystring()`, `params()`, `loc()`
- `link` action for SPA navigation with modifier key support

**wrap.js** - Route wrapping utility
- Enables async component loading and code splitting
- Supports loading components while routes load
- Adds route conditions/guards
- Attaches static props and user data to routes

**active.svelte.js** - Active link highlighting
- Svelte action that adds CSS class to active links
- Works with both routing modes

**helpers/permissions.svelte.js** - Permission system
- Flexible RBAC (role-based access control)
- `configurePermissions()` - Setup function called in main.js
- `createProtectedRoute()` - Helper to create routes with permission checks
- `hasPermission()` - UI-level permission checking
- Permission requirements: `any: [...]` (OR), `all: [...]` (AND)

**helpers/url-helpers.svelte.js** - URL utilities
- `joinPaths()` - Intelligent path joining with slash normalization

### State Management with Runes

**Critical:** This project uses Svelte 5 runes, NOT Svelte stores. Never use `writable()`, `readable()`, `derived()`, or `$subscribe()`.

**Reactive State Pattern:**
```javascript
// Define state with $state()
let locationState = $state({ location: '/', querystring: '' })

// Export accessor function (NOT a store)
export function location() {
    return locationState.location
}

// Use $effect() for side effects
$effect(() => {
    // React to state changes
    console.log('Location changed:', location())
})
```

### Dual-Mode Routing

The router supports two distinct modes configured before app mount:

**Hash Mode (default):**
- URLs: `http://example.com/#/path`
- No server configuration needed
- Works with file:// protocol
- Location tracking via `hashchange` event

**History Mode:**
- URLs: `http://example.com/path`
- Requires server configuration (fallback to index.html)
- Configured in main.js:
  ```javascript
  import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'
  setHashRoutingEnabled(false)
  setBasePath('/')
  ```
- Location tracking via `popstate` event and intercepts clicks
- Supports modifier keys (Ctrl+Click) and target attributes

**Implementation Details:**
- Mode switching logic in `utils.svelte.js` functions: `getLocation()`, `pushState()`, `updateLocation()`
- Link action behavior differs: hash mode modifies hash, history mode uses `pushState()`

## Testing Approach

**Framework:** Vitest + @testing-library/svelte
**Environment:** happy-dom

**Test Organization:**
- `src/tests/Router.test.js` - Core router functionality
- `src/tests/link-action.test.js` - Link action behavior
- `src/tests/active-action.test.js` - Active link highlighting
- `src/tests/navigation.test.js` - Navigation functions
- `src/tests/routing-modes.test.js` - Hash vs history mode
- `src/tests/permissions.test.js` - Permission system
- `src/tests/wrap.test.js` - Route wrapping
- `src/tests/url-helpers.test.js` - URL utilities
- `src/tests/querystring-helpers.test.js` - Query string parsing

**Test Patterns:**
```javascript
import { render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'

// Always await tick() after navigation to let effects run
await push('/new-route')
await tick()

// Mock navigation for testing
const mockPush = vi.fn()
```

## Key Implementation Patterns

### Route Definition
Routes are defined as plain objects or Maps:
```javascript
const routes = {
    '/': Home,
    '/user/:id': User,
    '/book/*': Book,
    '*': NotFound  // Catch-all (must be last)
}
```

### Route Guards/Conditions
Use `wrap()` to add async conditions:
```javascript
'/admin': wrap({
    asyncComponent: () => import('./Admin.svelte'),
    conditions: [
        async (detail) => {
            // detail: { route, location, querystring, userData, params }
            const user = await checkAuth()
            return user.isAdmin  // Return false to block route
        }
    ]
})
```

### Protected Routes with Permissions
```javascript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'

const routes = {
    '/admin': wrap(createProtectedRoute({
        component: () => import('./Admin.svelte'),
        permissions: { any: ['admin.read', 'admin.write'] },
        loadingComponent: Loading
    }))
}
```

### Component Props in Svelte 5
Route components receive params via props:
```svelte
<script>
let { params = {} } = $props()
</script>

<p>User ID: {params.id}</p>
```

### Events via Callback Props
```svelte
<Router
    {routes}
    onrouteLoading={(e) => console.log('Loading:', e.detail)}
    onrouteLoaded={(e) => console.log('Loaded:', e.detail)}
    onconditionsFailed={(e) => push('/unauthorized')}
/>
```

## Package Exports

The package uses explicit exports in package.json:

- `@keenmate/svelte-spa-router` - Main router + utilities
- `@keenmate/svelte-spa-router/active` - Active link action
- `@keenmate/svelte-spa-router/wrap` - Route wrapping
- `@keenmate/svelte-spa-router/utils` - Configuration functions
- `@keenmate/svelte-spa-router/routes` - Named routes system
- `@keenmate/svelte-spa-router/helpers/permissions` - Permission system
- `@keenmate/svelte-spa-router/helpers/url-helpers` - URL utilities
- `@keenmate/svelte-spa-router/helpers/querystring` - Query string helpers
- `@keenmate/svelte-spa-router/constants` - Navigation event constants

## Important Notes

### What NOT to Do
- ❌ Don't use Svelte stores (`writable()`, `readable()`, `derived()`)
- ❌ Don't use `$:` reactive declarations (use `$derived()` instead)
- ❌ Don't use `export let` for props (use `let { prop } = $props()`)
- ❌ Don't use `.subscribe()` or `$store` syntax
- ❌ Don't add a build step for the library (it's distributed as source)

### Critical Implementation Details
- **Race Conditions:** Router.svelte tracks `lastLoc` to prevent race conditions when async routes resolve out of order
- **Scroll Restoration:** Uses `history.scrollRestoration = 'manual'` and stores scroll positions in history state
- **Route Matching:** Uses regexparam which creates RegExp patterns with parameter extraction
- **Nested Routers:** Support via `prefix` prop - parent router must have wildcard route for child paths

## Examples

Three example applications demonstrate usage:

- `example/` - Hash mode (traditional #/path)
- `example-history/` - History mode (clean URLs)
- `example-permissions/` - Permission system demo (if created)

When testing features, always test in both routing modes to ensure compatibility.
