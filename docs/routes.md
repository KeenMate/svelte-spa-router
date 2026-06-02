# Defining routes

## Basic route definitions

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

## defineRoutes() — type-safe routes (recommended)

Use `defineRoutes()` for a single source of truth that gives you IDE autocomplete on route names and parameters, preventing typos at compile time:

```javascript
// src/routes.js (or routes.ts for TypeScript)
import { defineRoutes } from '@keenmate/svelte-spa-router/routes'
import Home from './routes/Home.svelte'

const { routes, nav, paths } = defineRoutes({
  home: {
    path: '/',
    component: Home
  },
  about: {
    path: '/about',
    component: () => import('./routes/About.svelte')
  },
  user: {
    path: '/user/:id',
    component: () => import('./routes/User.svelte'),
    conditions: [checkAuth],
    breadcrumbs: [{ label: 'Users' }, { id: 'user', label: 'User' }]
  },
  settings: {
    path: '/settings',
    component: () => import('./routes/Settings.svelte'),
    permissions: { any: ['settings.read'] }
  }
})

export { routes, nav, paths }
```

**Use in App.svelte:**

```svelte
<script>
import Router from '@keenmate/svelte-spa-router'
import { link } from '@keenmate/svelte-spa-router'
import { routes, nav, paths } from './routes'
</script>

<!-- Pass routes to Router -->
<Router {routes} />

<!-- Links with autocomplete on route names + params -->
<a href={paths.user({ id: 123 })} use:link>User 123</a>
<a href={paths.about()} use:link>About</a>

<!-- Programmatic navigation -->
<button onclick={() => nav.user.push({ id: 42 })}>Go to User 42</button>
<button onclick={() => nav.settings.replace()}>Settings</button>

<!-- For use:link action -->
<a use:link={nav.user.link({ id: 99 })}>User 99</a>
```

**What `defineRoutes()` returns:**

| Property | Description |
|----------|-------------|
| `routes` | Standard routes object for `<Router {routes} />` |
| `nav.X.push(params?, query?, ctx?)` | Navigate to route X (calls `push()` internally) |
| `nav.X.replace(params?, query?, ctx?)` | Replace with route X (calls `replace()` internally) |
| `nav.X.link(params?, query?)` | Returns object for `use:link` action |
| `nav.X.path` | Raw path pattern (e.g. `'/user/:id'`) |
| `paths.X(params?, query?)` | Build URL string for `href` attributes |

**TypeScript support:**

In TypeScript, `defineRoutes()` extracts `:param` names from path patterns at the type level:

```typescript
const { nav, paths } = defineRoutes({
  user: { path: '/user/:id', component: UserPage }
})

nav.user.push({ id: 123 })       // ✅ TypeScript knows 'id' is required
nav.user.push({ userId: 123 })   // ❌ Type error — 'userId' doesn't exist
nav.user.push()                   // ✅ OK — params are optional at runtime
paths.user({ id: 123 })          // ✅ Returns '/user/123'
```

**Supported route options:**

Each route in `defineRoutes()` accepts `path`, `component`, and all existing `createRoute()` / `wrap()` options: `loadingComponent`, `loadingParams`, `conditions`, `props`, `routeContext`, `title`, `breadcrumbs`, `shouldDisplayLoadingOnRouteLoad`, `permissions`, `authorizationCallback`, and inheritance flags (`inheritBreadcrumbs`, `inheritPermissions`, etc.).

> **Note:** `defineRoutes()` automatically calls `registerRoutes()` internally — no separate registration step is needed. Named routes work immediately with `push()`, `replace()`, and `buildUrl()`.

## Include the router

In your main component (usually `App.svelte`):

```svelte
<script>
import Router from '@keenmate/svelte-spa-router'
import routes from './routes'
</script>

<Router {routes}/>
```

## Dynamic imports and code-splitting

### Using createRoute() (recommended)

The most convenient way to create routes with async loading, metadata, and conditions:

```js
import { createRoute } from '@keenmate/svelte-spa-router/wrap'
import Home from './routes/Home.svelte'
import NotFound from './routes/NotFound.svelte'

const routes = {
    '/': Home,

    // No wrap() needed! createRoute() handles it for you
    '/author/:first/:last?': createRoute({
        component: () => import('./routes/Author.svelte'),
        title: 'Author Profile',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Authors' }
        ]
    }),

    // With loading component
    '/book/*': createRoute({
        component: () => import('./routes/Book.svelte'),
        title: 'Book Details',
        loadingComponent: LoadingPlaceholder,
        loadingParams: { message: 'Loading book...' }
    }),

    '*': NotFound,
}
```

### Using wrap() directly (advanced)

For more control, use `wrap()` directly or with `createRouteDefinition()`:

```js
import { wrap, createRouteDefinition } from '@keenmate/svelte-spa-router/wrap'
import Home from './routes/Home.svelte'
import NotFound from './routes/NotFound.svelte'

const routes = {
    '/': Home,

    // Direct wrap() syntax
    '/author/:first/:last?': wrap({
        asyncComponent: () => import('./routes/Author.svelte')
    }),

    // Using createRouteDefinition() for consistency
    '/book/*': wrap(createRouteDefinition({
        component: () => import('./routes/Book.svelte'),
        loadingComponent: LoadingPlaceholder,
        loadingParams: { message: 'Loading book...' }
    })),

    '*': NotFound,
}
```

### Metadata access

Title and breadcrumbs are stored in `userData` and accessible in route events:

```svelte
<script>
let { routeParams = {}, userData = {} } = $props()

// Access metadata
const title = userData.title
const breadcrumbs = userData.breadcrumbs || []
</script>

<h1>{title || 'Default Title'}</h1>

{#if breadcrumbs.length > 0}
<nav>
  {#each breadcrumbs as crumb}
    {#if crumb.path}
      <a href={crumb.path} use:link>{crumb.label}</a>
    {:else}
      <span>{crumb.label}</span>
    {/if}
  {/each}
</nav>
{/if}
```
