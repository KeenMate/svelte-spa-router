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
   - Fixed: Location state now reactive to config changes
   - Navigation: `push()`, `pop()`, `replace()`
   - `link` action with modifier key support
   - Location tracking: `location()`, `querystring()`, `params()`
   - TypeScript generic support: `params<T>()`

3. ✅ **Querystring Helpers (helpers/querystring.svelte.js & querystring-helpers.svelte.js)**
   - **Shared Reactive State**: `configureQuerystring()`, `query<T>()`
   - **Array Format Auto-Detection**: Supports repeat (`?tags=a&tags=b`) and comma (`?tags=a,b,c`)
   - **Parsing & Stringifying**: `parseQuerystring()`, `stringifyQuerystring()`
   - **URL Updates**: `updateQuerystring()` with partial merge support
   - **Custom Parsers**: `createQuerystringHelpers()` for custom formats
   - **TypeScript Support**: Full generics for type-safe access
   - **Configure Once, Use Everywhere**: Single config in main.js

4. ✅ **Filter System (helpers/filters.svelte.js)**
   - **Dual Mode Support**:
     - Flat mode: `?search=java&category=books` (default)
     - Structured mode: `?$filter=search eq 'java' AND category eq 'books'`
   - **Flexible Parsing**: Custom parse/stringify functions for OData, Microsoft Graph API, etc.
   - **Reactive State**: `filters<T>()` with TypeScript generics
   - **Type-Safe Updates**: `updateFilters<T>()` with partial merge
   - **Configurable**: `configureFilters()` in main.js
   - **Value Handling**: Clear null vs undefined semantics

5. ✅ **Permission System (helpers/permissions.svelte.js)**
   - Flexible role-based access control (RBAC)
   - Permission requirements: `any: [...]` (OR logic), `all: [...]` (AND logic)
   - `configurePermissions()` - Setup function for permission checking
   - `createPermissionCondition()` - Route guard creation
   - `createProtectedRoute()` - Helper to create protected routes
   - `hasPermission()` - UI-level permission checking
   - Integration with `wrap()` utility

6. ✅ **Active Link Highlighting (active.svelte.js)**
   - Automatic CSS class application
   - Works with both hash and history modes
   - Pattern matching support

7. ✅ **Route Wrapping (wrap.js)**
   - Async component loading
   - Code splitting support
   - Loading components
   - Route conditions
   - Static props
   - User data attachment

8. ✅ **URL Helpers (helpers/url-helpers.svelte.js)**
   - `joinPaths()` - Intelligent path joining
   - Slash handling and normalization

9. ✅ **TypeScript Support**
   - Full generic support: `params<T>()`, `query<T>()`, `filters<T>()`
   - Type-safe updates: `updateFilters<T>()`
   - Complete .d.ts files with JSDoc examples
   - Intellisense for all public APIs

## Architecture

### Core Components

```
@keenmate/svelte-spa-router/
├── Router.svelte                      # Main router component (Svelte 5 runes)
├── utils.svelte.js                    # Core routing utilities + dual-mode support
├── active.svelte.js                   # Active link highlighting action
├── wrap.js                            # Route wrapping utility
├── constants.js                       # Navigation event constants
└── helpers/
    ├── url-helpers.svelte.js          # Path manipulation utilities
    ├── permissions.svelte.js          # Permission system
    ├── querystring.svelte.js          # Shared reactive querystring state
    ├── querystring-helpers.svelte.js  # Querystring parsing/updating utilities
    └── filters.svelte.js              # Flexible filter system (flat & structured)
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

### 4. Querystring Helpers

**Configuration (main.js):**
```javascript
import { configureQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

configureQuerystring({
  arrayFormat: 'auto'  // 'auto', 'repeat', or 'comma'
})
```

**Usage in components:**
```svelte
<script>
import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
import { updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Define type for intellisense
interface SearchQuery {
  search?: string
  page?: number
  tags?: string[]
}

// Access reactively
const q = $derived(query<SearchQuery>())
const search = $derived(q.search || '')
const page = $derived(q.page ? Number(q.page) : 1)
const tags = $derived(q.tags || [])

// Update querystring (partial merge)
async function handleSearch(value: string) {
  await updateQuerystring({ search: value || undefined, page: 1 })
}
</script>

<input type="text" value={search} oninput={(e) => handleSearch(e.target.value)} />
```

**Array Format Support:**
- `'auto'` (default): Auto-detects `?tags=a&tags=b` or `?tags=a,b,c`
- `'repeat'`: `?tags=foo&tags=bar`
- `'comma'`: `?tags=foo,bar,baz`

### 5. Filter System

**Flat Mode (default):**
```javascript
// main.js
import { configureFilters } from '@keenmate/svelte-spa-router/helpers/filters'

configureFilters({ mode: 'flat' })
// URL: ?search=java&category=books&status=active
```

**Structured Mode (OData-style):**
```javascript
// main.js
configureFilters({
  mode: 'structured',
  paramName: '$filter',
  parse: (str) => {
    // Parse "search eq 'java' AND category eq 'books'"
    const parts = str.split(' AND ')
    const result = {}
    parts.forEach(part => {
      const [field, , value] = part.split(' ')
      result[field] = value.replace(/'/g, '')
    })
    return result
  },
  stringify: (filters) => {
    // Convert to OData format
    return Object.entries(filters)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k} eq '${v}'`)
      .join(' AND ')
  }
})
// URL: ?$filter=search eq 'java' AND category eq 'books'
```

**Usage (same API for both modes):**
```svelte
<script>
import { filters, updateFilters } from '@keenmate/svelte-spa-router/helpers/filters'

interface ProductFilters {
  search?: string
  category?: string
  status?: 'active' | 'discontinued'
}

const f = $derived(filters<ProductFilters>())
const search = $derived(f.search || '')

// Partial update (merge mode)
await updateFilters<ProductFilters>({ search: 'java' })

// Full replacement
await updateFilters<ProductFilters>({ search: 'java' }, { merge: false })

// Remove filter
await updateFilters<ProductFilters>({ category: undefined })

// Keep as empty
await updateFilters<ProductFilters>({ search: null })
</script>
```

### 6. Code Splitting

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
- `querystring()` - Get current querystring (raw string)
- `params<T>()` - Get current route parameters (with optional TypeScript generic)
- `loc()` - Get full location object

### Configuration Functions
- `setHashRoutingEnabled(boolean)` - Set routing mode
- `setBasePath(string)` - Set base path
- `getHashRoutingEnabled()` - Get current mode
- `getBasePath()` - Get current base path

### Querystring Functions
- `configureQuerystring(options)` - Configure querystring parsing globally
- `query<T>()` - Get reactive parsed querystring (with optional TypeScript generic)
- `parseQuerystring(qs, options)` - Parse querystring manually
- `stringifyQuerystring(obj, options)` - Convert object to querystring
- `getParsedQuerystring(options)` - Get parsed querystring (non-reactive)
- `updateQuerystring(updates, options)` - Update URL querystring
- `createQuerystringHelpers(parser, stringifier)` - Create custom helpers

### Filter Functions
- `configureFilters(options)` - Configure filter mode and parsing
- `filters<T>()` - Get reactive parsed filters (with optional TypeScript generic)
- `updateFilters<T>(updates, options)` - Update filters (type-safe with generic)
- `getFiltersConfig()` - Get current filter configuration

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

// Querystring helpers (shared reactive state - recommended)
import { configureQuerystring, query } from '@keenmate/svelte-spa-router/helpers/querystring'

// Querystring helpers (individual functions)
import {
  parseQuerystring,
  stringifyQuerystring,
  getParsedQuerystring,
  updateQuerystring,
  createQuerystringHelpers
} from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Filter helpers
import {
  configureFilters,
  filters,
  updateFilters,
  getFiltersConfig
} from '@keenmate/svelte-spa-router/helpers/filters'

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
- `example-history/` - History mode example with querystring & filter demos
  - `/querystring-demo` - Interactive querystring demo with array format switching
  - `/filters-demo` - Filter system demo with product filtering
  - `/route-data-demo` - Route data extraction examples
- `example-permissions/` - Permission system example

**Development Commands:**
```bash
make dev              # Run history mode example (port 5050)
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

## Design Rationale

### Querystring & Filters - Why Separate Systems?

**Querystring System:**
- General-purpose URL parameter management
- Auto-detection of array formats
- Flexible parsing/stringifying
- Use case: Pagination, search, tabs, sorting, etc.

**Filter System:**
- Specialized for data filtering scenarios
- Supports flat (standard) and structured (OData, Microsoft Graph) modes
- Custom parsers for backend API compatibility
- Use case: Product filters, advanced search, data grids, etc.

**Why Both?**
- Different use cases require different approaches
- Filters often need to match backend API format
- Querystring is simpler for most common cases
- Same underlying principles, specialized for different needs

### Value Handling (null vs undefined)

**Filters:**
- `undefined` → Remove parameter (clean URL)
- `null` → Keep as empty string (preserve filter presence)

**Querystring:**
- `undefined` → Always remove
- `null` → Configurable via `dropNull` option (default: remove)
- Empty string → Configurable via `dropEmpty` option (default: keep)

**Rationale:** Filters are user-facing and need clear empty state, querystring needs flexibility for different API patterns.

## Future Considerations

**Potential Features:**
- Automated testing suite
- SSR/SvelteKit integration examples
- More permission helpers (role-based, etc.)
- Route metadata support
- Animation/transition helpers
- Query builder UI for structured filters

**Not Planned:**
- Built-in authentication
- Built-in state management
- Server-side routing
- Mobile-specific features
- Opinionated filter UI components

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
