# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@keenmate/svelte-spa-router** is a modern router for Svelte 5 SPAs built with runes (`$state`, `$props`, `$effect`, `$derived`). It supports dual-mode routing (hash-based `#/path` and history API `/path`) with comprehensive permission management for both role-based and resource-based access control.

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
- Event system via callback props (onrouteLoading, onrouteLoaded, onconditionsFailed, onNotFound)

**utils.svelte.js** - Core routing utilities and state management
- Contains all reactive state using `$state()` (locationState, paramsState, navigationContextState)
- Dual-mode routing: hash-based (default) or history API
- Configuration: `setHashRoutingEnabled()`, `setBasePath()`, `setParamReplacementPlaceholder()`
- Navigation functions: `push()`, `pop()`, `replace()` with multi-parameter signatures
- State accessors: `location()`, `querystring()`, `params()`, `navigationContext()`, `loc()`
- `link` action for SPA navigation with modifier key support and 4-element array format

**wrap.js** - Route wrapping utility
- Enables async component loading and code splitting
- Supports loading components while routes load
- Adds route conditions/guards
- Attaches static props and user data to routes

**active.svelte.js** - Active link highlighting
- Svelte action that adds CSS class to active links
- Works with both routing modes

**helpers/permissions.svelte.js** - Permission system
- Flexible RBAC (role-based access control) and resource-based authorization
- `configurePermissions()` - Setup function called in main.js
- `createProtectedRoute()` - Helper to create routes with permission and authorization checks
- `createProtectedRouteDefinition()` - Returns route definition for use with wrap()
- `hasPermission()` - UI-level permission checking
- Permission requirements: `any: [...]` (OR), `all: [...]` (AND)
- `authorizationCallback` parameter for resource-based authorization (API calls, database checks)
- Conditions execute in order: permissions (fast) → authorizationCallback (slow)

**helpers/error-handler.svelte.js** - Global error handling system
- `configureGlobalErrorHandler()` - Configure error handling behavior
- SessionStorage-based restart loop prevention
- Recovery strategies: navigateSafe, restart, showError, custom
- Helper functions: `restart()`, `navigate()`, `showError()`, `canRestart()`, `getRestartCount()`
- Error filtering with regex or string patterns

**helpers/GlobalErrorHandler.svelte** - Error handler component
- Catches all unhandled errors via `window.addEventListener('error')`
- Executes configured recovery strategy
- Shows toast notifications or full-page error UI
- Supports custom error components

**helpers/ErrorDisplay.svelte** - Default error UI
- Beautiful full-page error display
- Shows error message, stack trace (dev mode), and error context
- Recovery actions: Go Home, Reload, Continue
- Warning when multiple errors detected

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

### Navigation Patterns

**Multi-parameter Navigation:**
```javascript
import { push, replace } from '@keenmate/svelte-spa-router'

// Multi-parameter signature: push(route, routeParams, queryString, navigationContext)
await push('userProfile', { userId: 123 }, { tab: 'settings' })
// Route resolution: starts with / = exact path, otherwise = named route lookup
await push('/about', {}, { source: 'nav' })

// Array format (4 elements): [route, params, query, navigationContext]
await push(['bookDetail', { bookId: 456 }, { tab: 'reviews' }, { source: 'menu' }])

// Object format
await push({
    route: 'userProfile',
    params: { userId: 123 },
    query: { tab: 'settings' },
    navigationContext: { source: 'toolbar' }
})
```

**Navigation Context:**
- Pass data during navigation without showing it in URL (WinForms-like)
- Access via `navigationContext()` in target component
- Cleared when user manually navigates (types URL, refreshes)

**Strict Parameter Replacement:**
```javascript
import { setParamReplacementPlaceholder } from '@keenmate/svelte-spa-router/utils'

// Configure placeholder for missing route parameters (default: 'N-A')
setParamReplacementPlaceholder('N-A')

// Route pattern: /users/:userId/:section
// Missing section parameter:
push('userProfile', { userId: 123 })
// Result: /users/123/N-A

// Missing parameters trigger onNotFound callback for error tracking
```

**Why strict replacement?**
- Predictable URLs - no silent parameter removal
- Easy to spot missing data in development
- `onNotFound` callback tracks issues for debugging

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

**Basic Permission-based Route:**
```javascript
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'

const routes = {
    // createProtectedRoute() returns ready-to-use wrapped component (no wrap() needed!)
    '/admin': createProtectedRoute({
        component: () => import('./Admin.svelte'),
        permissions: { any: ['admin.read', 'admin.write'] },
        loadingComponent: Loading
    })
}
```

**Combining Role-based and Resource-based Authorization:**
```javascript
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'
import { push } from '@keenmate/svelte-spa-router'

const routes = {
    '/document/:id': createProtectedRoute({
        component: () => import('./DocumentDetail.svelte'),
        // Role-based: Check user has 'read' permission (fast check)
        permissions: { any: ['read'] },
        // Resource-based: Check user can access THIS document (slow API call)
        authorizationCallback: async (detail) => {
            const documentId = detail.params.id
            const hasAccess = await checkDocumentAccess(documentId)

            if (!hasAccess) {
                await push('/unauthorized', {
                    resource: 'document',
                    id: documentId
                })
                return false
            }

            return true
        },
        loadingComponent: Loading
    })
}
```

**Key Points:**
- `createProtectedRoute()` returns a wrapped component (no additional `wrap()` needed)
- `createProtectedRouteDefinition()` returns a definition for use with `wrap()` (advanced usage)
- Conditions execute in order: permissions first (fast), then authorizationCallback (slow)
- This prevents unnecessary API calls when user doesn't have basic permissions

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

**Important:** The package.json includes `"sideEffects": ["**/*.svelte", "**/*.svelte.js"]` to prevent bundlers like Vite from incorrectly tree-shaking files containing Svelte 5 runes. The `.svelte.js` files have module-level reactive state (`$state`, `$derived`, `$effect`) which are side effects that must be preserved during production builds.

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
