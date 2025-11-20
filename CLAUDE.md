# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@keenmate/svelte-spa-router** is a modern router for Svelte 5 SPAs built with runes (`$state`, `$props`, `$effect`, `$derived`). It supports dual-mode routing (hash-based `#/path` and history API `/path`) with comprehensive permission management for both role-based and resource-based access control.

**Key Technologies:**
- Svelte 5 with runes (NOT Svelte stores)
- regexparam for route pattern matching
- Vitest + Testing Library for tests
- No build step required (distributed as source)

## Critical: Import Patterns

**⚠️ IMPORTANT:** This is a Svelte 5 router using runes, NOT Svelte stores. There is **NO `/stores` export path**.

### Correct Import Patterns

```javascript
// ✅ CORRECT - Main module or /utils
import Router from '@keenmate/svelte-spa-router'
import { push, replace, location, querystring, routeParams } from '@keenmate/svelte-spa-router'
// OR
import { location, routeParams } from '@keenmate/svelte-spa-router'

// ✅ CORRECT - Use as functions (not stores!)
const path = $derived(location())        // Call as function
const params = $derived(routeParams())   // Call as function

// ✅ CORRECT - Receive as props in route components (preferred)
let { routeParams = {} } = $props()
```

```javascript
// ❌ WRONG - /stores path doesn't exist!
import { routeParams } from '@keenmate/svelte-spa-router/stores'  // ERROR!

// ❌ WRONG - Store syntax doesn't work
const path = $location  // ERROR! location is not a store
const params = $routeParams  // ERROR! routeParams is not a store

// ❌ WRONG - Old v3/v4 name
import { params } from '@keenmate/svelte-spa-router'  // Should be routeParams
```

### Common Import Errors

1. **"Missing './stores' specifier"** - Users trying to use old v3/v4 API
   - Fix: Import from main module or `/utils`, not `/stores`
   - Use `routeParams()` as a function, not `$params` as a store

2. **"params is undefined"** - Name changed in v5
   - Old: `params`
   - New: `routeParams`

3. **Event handlers not working** - Naming changed to camelCase
   - Old: `onrouteLoaded`, `onconditionsFailed`
   - New: `onRouteLoaded`, `onConditionsFailed`

### All Available Import Paths

```
@keenmate/svelte-spa-router                        // Main (Router, push, location, etc.)
@keenmate/svelte-spa-router/utils                  // Alternative for utils
@keenmate/svelte-spa-router/wrap                   // Route wrapping
@keenmate/svelte-spa-router/active                 // Active link action
@keenmate/svelte-spa-router/routes                 // Named routes
@keenmate/svelte-spa-router/helpers/permissions    // Permission system
@keenmate/svelte-spa-router/helpers/navigation-guard  // Navigation guards
@keenmate/svelte-spa-router/helpers/hierarchy      // Hierarchical routes
@keenmate/svelte-spa-router/helpers/error-handler  // Error handling
@keenmate/svelte-spa-router/helpers/*              // Other helpers
```

**NO `/stores` path exists - this router uses functions, not stores!**

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
- Event system via callback props (onRouteLoading, onRouteLoaded, onConditionsFailed, onNotFound)

**utils.svelte.js** - Core routing utilities and state management
- Contains all reactive state using `$state()` (locationState, paramsState, navigationContextState)
- Dual-mode routing: hash-based (default) or history API
- Configuration: `setHashRoutingEnabled()`, `setBasePath()`, `setParamReplacementPlaceholder()`
- Navigation functions: `push()`, `pop()`, `replace()`, `goBack()` with multi-parameter signatures
- `goBack()` - Navigate to referrer with automatic scroll position restoration (requires referrer tracking)
- State accessors: `location()`, `querystring()`, `routeParams()`, `navigationContext()`, `loc()`
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

**helpers/hierarchy.svelte.js** - Tree/nested route structure
- `createHierarchy()` - Transforms hierarchical route definitions into flat routes
- Automatic path concatenation for child routes
- Optional route names for programmatic navigation
- Coexists with flat route definitions

**logger.ts** - Debug logging system using loglevel
- Based on loglevel library (~1KB) with loglevel-plugin-prefix for timestamps
- 12 hierarchical categories: ROUTER, ROUTER:NAVIGATION, ROUTER:SCROLL, ROUTER:GUARDS, ROUTER:CONDITIONS, ROUTER:HIERARCHY, ROUTER:PERMISSIONS, ROUTER:ROUTES, ROUTER:ZONES, ROUTER:METADATA, ROUTER:ERROR_HANDLER, ROUTER:FILTERS
- Color-coded console output with timestamps: `[HH:MM:SS.mmm] [LEVEL] [CATEGORY]`
- Public API: `enableLogging()`, `disableLogging()`, `setLogLevel()`, `setCategoryLevel()`
- Zero overhead when disabled (logs are no-ops at silent level)
- Vendored dependencies in `src/lib/vendor/loglevel/` (consistent with @keenmate/web-multiselect)

### Debug Logging System

The router uses loglevel for category-based debug logging to help troubleshoot routing issues.

**Architecture:**
- **Hierarchical categories**: ROUTER, ROUTER:NAVIGATION, ROUTER:SCROLL, etc.
- **Color-coded output**: Blue (debug), Green (info), Orange (warn), Red (error)
- **Timestamps**: Format `[HH:MM:SS.mmm] [LEVEL] [CATEGORY] message`
- **Global + per-category control**: Set all loggers to same level or enable specific categories

**Usage:**
```javascript
// main.js - Enable all debug logging
import { enableLogging } from '@keenmate/svelte-spa-router/logger'

if (import.meta.env.DEV) {
  enableLogging()  // Sets all categories to debug level
}

// Or enable specific categories only
import { disableLogging, setCategoryLevel } from '@keenmate/svelte-spa-router/logger'

disableLogging()  // Disable all
setCategoryLevel('ROUTER:SCROLL', 'debug')  // Enable only scroll logs
setCategoryLevel('ROUTER:NAVIGATION', 'info')  // Enable navigation at info level

// Or set global level
import { setLogLevel } from '@keenmate/svelte-spa-router/logger'
setLogLevel('warn')  // Only show warnings and errors
```

**Available Categories:**
- **ROUTER** - Core routing pipeline, route matching (Router.svelte)
- **ROUTER:NAVIGATION** - push, pop, replace, goBack (utils.svelte.js)
- **ROUTER:SCROLL** - Scroll restoration (Router.svelte, utils.svelte.js)
- **ROUTER:GUARDS** - Navigation guards (Router.svelte)
- **ROUTER:CONDITIONS** - Route condition checks (Router.svelte)
- **ROUTER:HIERARCHY** - Hierarchical route inheritance (Router.svelte)
- **ROUTER:PERMISSIONS** - Permission checking (permissions.svelte.js)
- **ROUTER:ROUTES** - Named routes and URL building (routes.svelte.js)
- **ROUTER:ZONES** - Multi-zone routing (Router.svelte)
- **ROUTER:METADATA** - Breadcrumbs and route metadata (route-metadata.svelte.js)
- **ROUTER:ERROR_HANDLER** - Global error handling (error-handler.svelte.js, GlobalErrorHandler.svelte)
- **ROUTER:FILTERS** - Filter parsing (filters.svelte.js)

**Implementation Details:**
- Logger instances exported from `src/lib/logger.ts`
- Configuration warnings (console.warn/console.error) remain always visible
- No build step required - distributed as TypeScript source

**When NOT to use debug logging:**
- Configuration warnings/errors should always show (use console.warn/console.error directly)
- Critical errors that need immediate attention
- Production-only telemetry (use proper logging service instead)

### Global Window API

The router exposes a global API at `window.components['svelte-spa-router']` for runtime debugging and introspection.

**Available in browser console:**
```javascript
// Check version
window.components['svelte-spa-router'].version()  // "5.0.0"

// View package metadata
window.components['svelte-spa-router'].config
// { name, version, author, license, repository, homepage }

// Enable all debug logging
window.components['svelte-spa-router'].logging.enableLogging()

// Disable all logging
window.components['svelte-spa-router'].logging.disableLogging()

// Set global log level
window.components['svelte-spa-router'].logging.setLogLevel('debug')

// Enable specific category
window.components['svelte-spa-router'].logging.setCategoryLevel('ROUTER:NAVIGATION', 'debug')

// List all logging categories
window.components['svelte-spa-router'].logging.getCategories()
// ["ROUTER", "ROUTER:NAVIGATION", "ROUTER:SCROLL", ...]
```

**Benefits:**
- Runtime debugging without code changes
- Version checking in production
- Toggle logging from browser console
- TypeScript autocompletion support
- SSR-safe (only initializes in browser)

**Implementation:** Global API is initialized in `src/lib/index.js` using namespace-safe pattern (`window.components` shared across all component libraries).

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
  import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router'
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
- `src/tests/named-routes.test.js` - Named route navigation (push/replace with route names)
- `src/tests/routing-modes.test.js` - Hash vs history mode
- `src/tests/permissions.test.js` - Permission system
- `src/tests/wrap.test.js` - Route wrapping
- `src/tests/url-helpers.test.js` - URL utilities
- `src/tests/querystring-helpers.test.js` - Query string parsing
- `src/tests/hierarchy.test.js` - Tree/nested route structure
- `src/tests/hierarchical-routes.test.js` - Hierarchical route inheritance

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

// Single-argument named route (no params)
await push('about')          // Navigates to registered 'about' route
await replace('home')        // Replaces with registered 'home' route

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

**Named Route Registration:**
```javascript
import { registerRoutes } from '@keenmate/svelte-spa-router/routes'

// Register named routes for programmatic navigation
registerRoutes({
    'home': '/',
    'about': '/about',
    'userProfile': '/user/:userId',
    'documentDetail': '/documents/:docId'
})

// Now you can use: push('userProfile', { userId: 123 })
```

**Navigation Context:**
- Pass data during navigation without showing it in URL (WinForms-like)
- Access via `navigationContext()` in target component
- Cleared when user manually navigates (types URL, refreshes)

**Referrer Tracking:**
```javascript
import { setIncludeReferrer, goBack } from '@keenmate/svelte-spa-router'

// Configure referrer tracking mode
setIncludeReferrer('always')  // Options: 'never', 'notfound', 'always'

// Access referrer in component
const navContext = $derived(navigationContext())
const referrer = $derived(navContext?.referrer)
// referrer: { location, querystring, params, routeName }

// Use goBack() helper for automatic scroll restoration
function handleGoBack() {
    goBack()  // Navigates to referrer with scroll position restoration
}
```

**Benefits:**
- Automatic previous route tracking
- **Automatic scroll position restoration** via `goBack()` helper
- Safe "Go Back" implementation (works with replace())
- Access to full previous route context
- Route name tracking for named routes

**Important:** Use `goBack()` instead of manual `push(referrer.location)` to get automatic scroll restoration. Manual `push()` does NOT restore scroll position.

**Strict Parameter Replacement:**
```javascript
import { setParamReplacementPlaceholder } from '@keenmate/svelte-spa-router'

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
            const documentId = detail.routeParams.id
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
let { routeParams = {} } = $props()
</script>

<p>User ID: {routeParams.id}</p>
```

### Events via Callback Props
```svelte
<Router
    {routes}
    onRouteLoading={(e) => console.log('Loading:', e.detail)}
    onRouteLoaded={(e) => console.log('Loaded:', e.detail)}
    onConditionsFailed={(e) => push('/unauthorized')}
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
- `@keenmate/svelte-spa-router/helpers/hierarchy` - Tree/nested route structure helper
- `@keenmate/svelte-spa-router/helpers/url-helpers` - URL utilities
- `@keenmate/svelte-spa-router/helpers/querystring` - Query string helpers
- `@keenmate/svelte-spa-router/constants` - Navigation event constants

**Important:** The package.json includes `"sideEffects": ["**/*.svelte", "**/*.svelte.js"]` to prevent bundlers like Vite from incorrectly tree-shaking files containing Svelte 5 runes. The `.svelte.js` files have module-level reactive state (`$state`, `$derived`, `$effect`) which are side effects that must be preserved during production builds.

## Hierarchical Routes (Optional)

The router supports hierarchical route inheritance for apps with deep route structures. This feature is **opt-in** and disabled by default.

### Enabling Hierarchical Mode

```javascript
// main.js - before app mount
import { setHierarchicalRoutesEnabled } from '@keenmate/svelte-spa-router'

setHierarchicalRoutesEnabled(true)
```

### How It Works

In hierarchical mode, child routes automatically inherit from parent routes:

- **Breadcrumbs** - Concatenated (parent breadcrumbs + child breadcrumbs)
- **Permissions** - Sequential execution (parent check AND child check must pass)
- **Conditions** - Parent conditions run before child conditions
- **Authorization** - Parent callbacks execute before child callbacks

### Example

```javascript
import { createRoute } from '@keenmate/svelte-spa-router/wrap'
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'

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
    }),

    // Grandchild route - inherits from entire chain
    '/documents/:id/logs': createRoute({
        component: DocumentLogs,
        breadcrumbs: [
            { label: 'Access Logs' }
        ],
        permissions: { any: ['logs.view'] }
        // Inherits all ancestor breadcrumbs and permissions
    })
}
```

### Opting Out of Inheritance

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

### Permission Inheritance Behavior

Permissions work like filesystem security - all ancestor checks must pass:

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

### When to Use Hierarchical Mode

**Use hierarchical mode when:**
- You have deep route structures with shared metadata
- Routes naturally form parent-child relationships
- You want DRY breadcrumb and permission definitions
- Your security model has nested restrictions

**Use flat mode (default) when:**
- Routes are independent with no hierarchy
- You prefer explicit, visible definitions
- Route relationships are not strictly hierarchical

See `HIERARCHICAL_ROUTES_DESIGN.md` for detailed design decisions and implementation details.

## Tree/Nested Route Structure (Alternative API)

The router provides a `createHierarchy()` helper as an alternative to flat route definitions. This is especially useful for deeply nested route structures.

### Basic Usage

```javascript
import { createHierarchy } from '@keenmate/svelte-spa-router/helpers/hierarchy'

const routes = createHierarchy({
    '/documents': {
        component: DocumentsLayout,
        breadcrumbs: [{ label: 'Documents' }],
        children: {
            ':id': {
                name: 'documentDetail',
                component: DocumentDetail,
                breadcrumbs: [{ label: 'Detail' }],
                children: {
                    'logs': {
                        component: DocumentLogs,
                        breadcrumbs: [{ label: 'Logs' }]
                    }
                }
            }
        }
    }
})

// Transforms to flat routes:
// {
//     '/documents': (wrapped component),
//     '/documents/:id': (wrapped component),
//     '/documents/:id/logs': (wrapped component)
// }
```

### Key Features

**1. Relative Child Paths**
- Child paths are automatically concatenated to parent paths
- No need to repeat parent segments
- Leading slashes in child paths are stripped

**2. Automatic Inheritance**
- In tree mode, routes ALWAYS inherit from parents
- No `inheritX: false` flags available (simplified API)
- Breadcrumbs, permissions, conditions, and authorization all inherit

**3. Optional Route Names**
- Add `name` property only when you need programmatic navigation
- Routes without names are still created, just can't be navigated to via `push(name, params)`

**4. Coexists with Flat Routes**
- Tree and flat route definitions can be combined seamlessly

### Complete Example

```javascript
import { createHierarchy } from '@keenmate/svelte-spa-router/helpers/hierarchy'
import { push } from '@keenmate/svelte-spa-router'

// Tree structure
const hierarchicalRoutes = createHierarchy({
    '/admin': {
        name: 'admin',
        component: AdminLayout,
        breadcrumbs: [{ label: 'Admin' }],
        permissions: { any: ['admin'] },
        children: {
            'users': {
                name: 'adminUsers',
                component: AdminUsers,
                breadcrumbs: [{ label: 'Users' }],
                children: {
                    ':id': {
                        name: 'adminUserDetail',
                        component: AdminUserDetail,
                        breadcrumbs: [{ label: 'User Detail' }],
                        authorizationCallback: async (detail) => {
                            return await checkUserAccess(detail.routeParams.id)
                        },
                        children: {
                            'permissions': {
                                // No name - accessed via tabs/UI only
                                component: UserPermissions,
                                breadcrumbs: [{ label: 'Permissions' }]
                            },
                            'activity': {
                                component: UserActivity,
                                breadcrumbs: [{ label: 'Activity' }]
                            }
                        }
                    }
                }
            }
        }
    }
})

// Flat routes
const flatRoutes = {
    '/': Home,
    '/about': About
}

// Combine both
const routes = {
    ...hierarchicalRoutes,
    ...flatRoutes
}

// Navigate using names
await push('adminUserDetail', { id: 123 })
// Results in: /admin/users/123
```

### Path Concatenation Rules

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

### When to Use Tree Structure

**Use `createHierarchy()` when:**
- You have deeply nested routes (3+ levels)
- Child routes always inherit from parents
- You want concise, readable route definitions
- Route structure mirrors UI hierarchy

**Use flat route definitions when:**
- Routes are mostly shallow (1-2 levels)
- You need fine-grained control over inheritance (opt-out flags)
- Route structure doesn't match visual hierarchy
- You prefer explicit path definitions

### Enabling Hierarchical Inheritance

```javascript
// main.js - enable hierarchical mode for inheritance to work
import { setHierarchicalRoutesEnabled } from '@keenmate/svelte-spa-router'

setHierarchicalRoutesEnabled(true)

// createHierarchy() automatically sets inheritance flags to true
```

**Note:** You can use `createHierarchy()` without enabling hierarchical mode globally, but routes won't inherit metadata from parents.

## Important Notes

### What NOT to Do
- ❌ Don't use Svelte stores (`writable()`, `readable()`, `derived()`)
- ❌ Don't use `$:` reactive declarations (use `$derived()` instead)
- ❌ Don't use `export let` for props (use `let { prop } = $props()`)
- ❌ Don't use `.subscribe()` or `$store` syntax
- ❌ Don't add a build step for the library (it's distributed as source)
- ❌ Don't use manual `push(referrer.location)` for "Go Back" (use `goBack()` helper for scroll restoration)

### Critical Implementation Details
- **Race Conditions:** Router.svelte tracks `lastLoc` to prevent race conditions when async routes resolve out of order
- **Scroll Restoration:** Uses `history.scrollRestoration = 'manual'` and stores scroll positions in history state. The `goBack()` helper automatically restores scroll position when navigating to referrer. Manual `push()` does NOT restore scroll.
- **Route Matching:** Uses regexparam which creates RegExp patterns with parameter extraction
- **Nested Routers:** Support via `prefix` prop - parent router must have wildcard route for child paths

## Examples

Example applications and documentation showcase:

- `example/` - Hash mode (traditional #/path)
- `example-history/` - History mode (clean URLs)
- `svelte-spa-router-showcase/` - Comprehensive documentation site with interactive examples
  - Built with SvelteKit + @keenmate/svelte-docs
  - Features detailed guides for all router capabilities
  - Live at: https://svelte-spa-router.keenmate.dev
  - Demo apps: https://history.svelte-spa-router.keenmate.dev and https://hash.svelte-spa-router.keenmate.dev

When testing features, always test in both routing modes to ensure compatibility.
