# @keenmate/svelte-spa-router

[![npm](https://img.shields.io/npm/v/@keenmate/svelte-spa-router.svg)](https://www.npmjs.com/package/@keenmate/svelte-spa-router)
[![GitHub](https://img.shields.io/github/license/keenmate/svelte-spa-router.svg)](https://github.com/keenmate/svelte-spa-router/blob/master/LICENSE.md)

A modern router for [Svelte 5](https://github.com/sveltejs/svelte) applications, built from the ground up using the new runes API (`$props`, `$state`, `$effect`).

This module is specifically optimized for Single Page Applications (SPA) with dual-mode routing and comprehensive permission management.

Main features:

- **Dual-mode routing**: Supports both hash-based (`#/path`) and history API (`/path`) routing
- Built with **Svelte 5 runes** for better reactivity and performance
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
import {location, querystring} from '@keenmate/svelte-spa-router'
</script>

<p>Current page: {location()}</p>
<p>Query: {querystring()}</p>
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

## Documentation

For full documentation, see:
- [CONTEXT.md](./CONTEXT.md) - Complete project overview
- [MIGRATION.md](./MIGRATION.md) - Migration guide from other routers
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow

## License

MIT License - see [LICENSE](./LICENSE.md) for details.
