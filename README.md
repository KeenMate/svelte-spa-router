# @keenmate/svelte-spa-router

[![npm](https://img.shields.io/npm/v/@keenmate/svelte-spa-router.svg)](https://www.npmjs.com/package/@keenmate/svelte-spa-router)
[![GitHub](https://img.shields.io/github/license/keenmate/svelte-spa-router.svg)](https://github.com/keenmate/svelte-spa-router/blob/master/LICENSE.md)

A modern router for [Svelte 5](https://github.com/sveltejs/svelte) applications, built from the ground up using the new runes API (`$props`, `$state`, `$effect`).

This module is specifically optimized for Single Page Applications (SPA) with dual-mode routing and comprehensive permission management.

Main features:

- **Dual-mode routing**: Supports both hash-based (`#/path`) and history API (`/path`) routing
- Built with **Svelte 5 runes** for better reactivity and performance
- **TypeScript-first**: Full generic support for `params()`, `query()`, and `filters()` with intellisense
- **Querystring & Filter helpers**: Flexible, reactive helpers for URL-driven UIs with auto-detection of array formats
- **Permission system**: Built-in role-based access control with route guards
- Insanely simple to use, and has a minimal footprint
- Uses the tiny [regexparam](https://github.com/lukeed/regexparam) for parsing routes, with support for parameters (e.g. `/book/:id?`) and more
- No server configuration needed for hash mode; clean URLs with history mode

This module is released under MIT license.

## Installation

```sh
npm install @keenmate/svelte-spa-router
```

## Key Features

This router leverages Svelte 5's runes and provides:

### 1. Stores are now functions

In Svelte 5 version, location stores are accessed as functions instead of Svelte stores:

**Example:**
```svelte
<script>
import {location, querystring, params} from '@keenmate/svelte-spa-router'
</script>
<p>Current location: {location()}</p>
<p>Querystring: {querystring()}</p>
<p>Params: {JSON.stringify(params())}</p>
```

### 2. Event handlers use props instead of `on:` directives

**Example:**
```svelte
<Router {routes}
  onrouteLoading={handleLoading}
  onrouteLoaded={handleLoaded}
  onconditionsFailed={handleFailed}
/>
```

### 3. Internal implementation uses runes

The router now uses:
- `$state` for reactive state management
- `$props` for component props
- `$effect` for side effects (location tracking, scroll restoration)
- `$derived` for computed values

This provides better performance and follows Svelte 5 best practices.

## Routing Modes

svelte-spa-router-5 supports two routing modes:

### Hash Mode (Default)

Uses hash-based routing with URLs like `http://example.com/#/path`.

**Pros:**
- No server configuration needed
- Works everywhere, including `file://` protocol
- Perfect for static hosting (GitHub Pages, Netlify, etc.)

**Cons:**
- URLs have `#` in them
- Less SEO-friendly (though modern search engines handle it)

**Usage:** No configuration needed - this is the default!

```svelte
<!-- App.svelte -->
<Router {routes}/>
```

### History Mode

Uses the History API with clean URLs like `http://example.com/path`.

**Pros:**
- Clean URLs without `#`
- More SEO-friendly
- Better user experience
- Supports modifier keys (Ctrl+Click to open in new tab)
- Respects `target` attribute on links

**Cons:**
- Requires server configuration to serve `index.html` for all routes
- Won't work with `file://` protocol

**Usage:** Configure before mounting your app

```javascript
// main.js
import { mount } from 'svelte'
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'
import App from './App.svelte'

// Enable history mode
setHashRoutingEnabled(false)
setBasePath(import.meta.env.BASE_URL || '/')

// Mount app
mount(App, { target: document.body })
```

**Server Configuration:**

For production, configure your server to serve `index.html` for all routes:

```nginx
# Nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

```apache
# Apache .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

```javascript
// Express.js
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
```

**Base Path Configuration:**

If your app is served from a subdirectory (e.g., `http://example.com/app/`):

```javascript
setBasePath('/app')
```

Make sure to also set it in your build tool:

```javascript
// vite.config.js
export default {
  base: '/app/'
}
```

**Examples:**
- See `example/` for hash mode (default)
- See `example-history/` for history mode with clean URLs

## Usage

### Define your routes

Each route is a normal Svelte component. The route definition is a JavaScript dictionary (object) where the key is the path and the value is the component.

```js
import Home from './routes/Home.svelte'
import Author from './routes/Author.svelte'
import Book from './routes/Book.svelte'
import NotFound from './routes/NotFound.svelte'

const routes = {
    // Exact path
    '/': Home,

    // Using named parameters, with last being optional
    '/author/:first/:last?': Author,

    // Wildcard parameter
    '/book/*': Book,

    // Catch-all (must be last)
    '*': NotFound,
}
```

### Include the router

In your main component (usually `App.svelte`):

```svelte
<script>
import Router from '@keenmate/svelte-spa-router'
import routes from './routes'
</script>

<Router {routes}/>
```

### Navigating between pages

Using links with the `use:link` action:

```svelte
<script>
import {link} from '@keenmate/svelte-spa-router'
</script>

<a href="/book/123" use:link>View Book</a>
```

Programmatically:

```js
import {push, pop, replace} from '@keenmate/svelte-spa-router'

// Navigate to a new page
push('/book/42')

// Go back
pop()

// Replace current page
replace('/book/3')
```

### Accessing route parameters

In your route components:

```svelte
<script>
let { params = {} } = $props()
</script>

<p>Book ID: {params.id}</p>
```

### Accessing location and querystring

```svelte
<script>
import {location, querystring, params} from '@keenmate/svelte-spa-router'

// Access current location and querystring
const currentPath = $derived(location())
const query = $derived(querystring())
const routeParams = $derived(params())
</script>

<p>Current page: {currentPath}</p>
<p>Query: {query}</p>
<p>Params: {JSON.stringify(routeParams)}</p>
```

### TypeScript Support with Generics

All helper functions support TypeScript generics for full intellisense:

```typescript
// Define your types
interface UserParams {
  userId: string
  tab?: string
}

interface UserQuery {
  search?: string
  page?: number
  tags?: string[]
}

// Use with type parameters for full intellisense
const p = $derived(params<UserParams>())
const q = $derived(query<UserQuery>())

if (p) {
  const userId = p.userId        // ✅ TypeScript knows this exists
  const tab = p.tab || 'profile' // ✅ TypeScript knows this is optional
}

const search = $derived(q.search || '')
const page = $derived(q.page ? Number(q.page) : 1)
const tags = $derived(q.tags || [])  // ✅ TypeScript knows this is string[]
```

### Dynamic imports and code-splitting

```js
import {wrap} from '@keenmate/svelte-spa-router/wrap'
import Home from './routes/Home.svelte'
import NotFound from './routes/NotFound.svelte'

const routes = {
    '/': Home,

    // Dynamically imported component
    '/author/:first/:last?': wrap({
        asyncComponent: () => import('./routes/Author.svelte')
    }),

    // With loading component
    '/book/*': wrap({
        asyncComponent: () => import('./routes/Book.svelte'),
        loadingComponent: LoadingPlaceholder,
        loadingParams: {message: 'Loading book...'}
    }),

    '*': NotFound,
}
```

### Route guards (pre-conditions)

Basic condition example:

```js
const routes = {
    '/admin': wrap({
        asyncComponent: () => import('./routes/Admin.svelte'),
        conditions: [
            // Can be sync or async
            async (detail) => {
                const user = await checkAuth()
                return user.isAdmin
            }
        ]
    })
}
```

### Permission-based routing

svelte-spa-router-5 includes a flexible permission system for role-based access control:

**1. Configure the permission system (in main.js before mounting):**

```javascript
import { configurePermissions } from '@keenmate/svelte-spa-router/helpers/permissions'
import { get } from 'svelte/store'
import { currentUser } from './stores/auth'

configurePermissions({
  checkPermissions: (user, requirements) => {
    if (!user) return false
    if (!requirements) return true

    // Check if user has any of the required permissions
    if (requirements.any) {
      return requirements.any.some(perm =>
        user.permissions.includes(perm)
      )
    }

    // Check if user has all required permissions
    if (requirements.all) {
      return requirements.all.every(perm =>
        user.permissions.includes(perm)
      )
    }

    return true
  },
  getCurrentUser: () => get(currentUser),
  onUnauthorized: (detail) => {
    push('/unauthorized')
  }
})
```

**2. Protect routes with permissions:**

```javascript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import { createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'

const routes = {
  '/': Home,

  // User needs at least one of these permissions
  '/admin': wrap(createProtectedRoute({
    component: () => import('./Admin.svelte'),
    permissions: { any: ['admin.read', 'admin.write'] },
    loadingComponent: Loading
  })),

  // User needs ALL of these permissions
  '/settings': wrap(createProtectedRoute({
    component: () => import('./Settings.svelte'),
    permissions: { all: ['settings.read', 'settings.write'] }
  })),

  '/unauthorized': Unauthorized,
  '*': NotFound
}
```

**3. Show/hide UI elements based on permissions:**

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
- `any: [...]` - User needs at least ONE of these permissions (OR logic)
- `all: [...]` - User needs ALL of these permissions (AND logic)

See `example-permissions/` for a complete working example with mock authentication.

### Active link highlighting

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

## Querystring & Filter Helpers

svelte-spa-router-5 includes powerful helpers for working with querystrings and filters in a reactive, type-safe way.

### Querystring Helpers

#### Basic Setup

Configure once in `main.js`:

```javascript
import { configureQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

configureQuerystring({
  arrayFormat: 'auto'  // 'auto', 'repeat', or 'comma'
})
```

#### Using Shared Reactive Querystring

```svelte
<script>
import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
import { updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Define your query type for intellisense
interface SearchQuery {
  search?: string
  page?: number
  category?: string
  tags?: string[]
}

// Access query parameters reactively
const q = $derived(query<SearchQuery>())
const search = $derived(q.search || '')
const page = $derived(q.page ? Number(q.page) : 1)
const category = $derived(q.category || 'all')
const tags = $derived(q.tags || [])

// Update querystring (merges with existing params)
async function handleSearch(value: string) {
  await updateQuerystring({ search: value || undefined, page: 1 })
}

async function changePage(newPage: number) {
  await updateQuerystring({ page: newPage })
}

// Remove parameter completely
await updateQuerystring({ category: undefined })

// Keep parameter with empty value
await updateQuerystring({ search: null })
</script>

<input
  type="text"
  value={search}
  oninput={(e) => handleSearch(e.target.value)}
/>
```

#### Array Format Support

The router automatically detects array formats:

```javascript
// Auto-detect (default) - handles both formats
// ?tags=foo&tags=bar → { tags: ['foo', 'bar'] }
// ?tags=foo,bar,baz → { tags: ['foo', 'bar', 'baz'] }

// Explicit repeat format
configureQuerystring({ arrayFormat: 'repeat' })
// ?tags=foo&tags=bar

// Explicit comma format
configureQuerystring({ arrayFormat: 'comma' })
// ?tags=foo,bar,baz
```

#### Manual Parsing (without configuration)

```javascript
import { parseQuerystring, stringifyQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Parse
const parsed = parseQuerystring('search=foo&tags=a,b,c', { arrayFormat: 'auto' })
// { search: 'foo', tags: ['a', 'b', 'c'] }

// Stringify
const qs = stringifyQuerystring({ search: 'foo', tags: ['a', 'b'] }, { arrayFormat: 'repeat' })
// 'search=foo&tags=a&tags=b'
```

### Filter Helpers

The filter system supports both flat and structured filter modes for different API requirements.

#### Flat Mode (Default)

Each filter is a separate query parameter:

```javascript
// main.js
import { configureFilters } from '@keenmate/svelte-spa-router/helpers/filters'

configureFilters({ mode: 'flat' })
```

```svelte
<script>
import { filters, updateFilters } from '@keenmate/svelte-spa-router/helpers/filters'

// Define filter type for intellisense
interface ProductFilters {
  search?: string
  category?: string
  status?: 'active' | 'discontinued'
  minPrice?: number
  maxPrice?: number
}

// Access filters reactively
const f = $derived(filters<ProductFilters>())
const search = $derived(f.search || '')
const category = $derived(f.category || 'all')
const status = $derived(f.status || 'active')

// Update filters (partial updates by default)
async function handleSearchChange(value: string) {
  await updateFilters<ProductFilters>({ search: value || undefined })
}

async function clearAllFilters() {
  await updateFilters<ProductFilters>({
    search: undefined,
    category: undefined,
    status: undefined
  }, { merge: false })  // Replace instead of merge
}
</script>

<!-- Result URL: ?search=java&category=books&status=active -->
```

#### Structured Mode (OData-style)

Single filter parameter with custom syntax:

```javascript
// main.js
import { configureFilters } from '@keenmate/svelte-spa-router/helpers/filters'

configureFilters({
  mode: 'structured',
  paramName: '$filter',
  parse: (filterString) => {
    // Parse "displayName eq 'john' AND status eq 'active'"
    const parts = filterString.split(' AND ')
    const result = {}
    parts.forEach(part => {
      const [field, , value] = part.split(' ')
      result[field] = value.replace(/'/g, '')
    })
    return result
  },
  stringify: (filters) => {
    // Convert object to OData filter string
    return Object.entries(filters)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => `${k} eq '${v}'`)
      .join(' AND ')
  }
})
```

```svelte
<script>
import { filters, updateFilters } from '@keenmate/svelte-spa-router/helpers/filters'

// Same API regardless of mode!
const f = $derived(filters())
const search = $derived(f.search || '')

await updateFilters({ search: 'java', status: 'active' })
// Result URL: ?$filter=search eq 'java' AND status eq 'active'
</script>
```

#### null vs undefined in Filters

```javascript
// undefined: Always removes the parameter
await updateFilters({ search: undefined })
// Result: parameter removed from URL

// null: Keeps parameter with empty value
await updateFilters({ search: null })
// Result: ?search=

// For querystring helpers, behavior is configurable:
await updateQuerystring({ search: null }, { dropNull: true })  // Removes it (default)
await updateQuerystring({ search: null }, { dropNull: false }) // Keeps as ?search=null
```

## Advanced Features

### Scroll restoration

```svelte
<Router {routes} restoreScrollState={true} />
```

### Nested routers

```svelte
<!-- Parent router -->
<script>
import Router from '@keenmate/svelte-spa-router'
const routes = {
    '/hello': Hello,
    '/hello/*': Hello,
}
</script>

<!-- In Hello.svelte (child router) -->
<script>
import Router from '@keenmate/svelte-spa-router'
const prefix = '/hello'
const routes = {
    '/:name': NameView
}
</script>

<h2>Hello!</h2>
<Router {routes} {prefix} />
```

### Event handling

```svelte
<Router
    {routes}
    onrouteLoading={(e) => console.log('Loading:', e.detail)}
    onrouteLoaded={(e) => console.log('Loaded:', e.detail)}
    onconditionsFailed={(e) => console.log('Failed:', e.detail)}
/>
```

## Quick Reference

### All Available Imports

```javascript
// Core router
import Router from '@keenmate/svelte-spa-router'

// Navigation utilities
import { link, push, pop, replace, location, querystring, params } from '@keenmate/svelte-spa-router'

// Route wrapping (async, conditions, loading)
import { wrap } from '@keenmate/svelte-spa-router/wrap'

// Active link highlighting
import active from '@keenmate/svelte-spa-router/active'

// Configuration
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'

// Querystring helpers (shared reactive state)
import { configureQuerystring, query } from '@keenmate/svelte-spa-router/helpers/querystring'

// Querystring helpers (individual functions)
import {
  parseQuerystring,
  stringifyQuerystring,
  updateQuerystring
} from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Filter helpers
import {
  configureFilters,
  filters,
  updateFilters
} from '@keenmate/svelte-spa-router/helpers/filters'

// Permission system
import {
  configurePermissions,
  createPermissionCondition,
  createProtectedRoute,
  hasPermission
} from '@keenmate/svelte-spa-router/helpers/permissions'
```

### Common Patterns

```svelte
<script>
import { link, location, params } from '@keenmate/svelte-spa-router'
import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
import { filters } from '@keenmate/svelte-spa-router/helpers/filters'
import active from '@keenmate/svelte-spa-router/active'

// Define types for intellisense
interface RouteParams {
  id: string
}

interface QueryParams {
  tab?: string
  search?: string
}

// Get route data reactively
const routeParams = $derived(params<RouteParams>())
const queryParams = $derived(query<QueryParams>())
const currentFilters = $derived(filters())

// Use in your component
const id = $derived(routeParams?.id)
const tab = $derived(queryParams.tab || 'overview')
const search = $derived(queryParams.search || '')
</script>

<!-- Navigation with active highlighting -->
<nav>
  <a href="/" use:link use:active>Home</a>
  <a href="/about" use:link use:active>About</a>
</nav>

<!-- Display current route -->
<p>Current: {location()}</p>
```

## Examples

This repository includes three complete example applications:

- **`example/`** - Hash mode routing with basic features
- **`example-history/`** - History mode with clean URLs, querystring demos, and filter demos
- **`example-permissions/`** - Permission-based routing with role management

Run examples:
```bash
cd example-history
npm install
npm run dev
```

## Documentation

For full documentation, see:
- [CONTEXT.md](./CONTEXT.md) - Complete project overview
- [MIGRATION.md](./MIGRATION.md) - Migration guide from other routers
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow

## License

MIT License - see [LICENSE](./LICENSE.md) for details.
