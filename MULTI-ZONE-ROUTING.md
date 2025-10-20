# Multi-Zone Routing

Multi-zone routing allows you to load different components into multiple named areas (zones) of your layout based on the current route. This is useful for complex layouts where different parts of the UI need to change independently.

## Basic Concept

Instead of loading a single component for a route, you can load multiple components into different "zones":

```
┌─────────────────────────────────────┐
│           Header (zone)             │
├──────────┬──────────────────────────┤
│ Sidebar  │    Main Content          │
│ (zone)   │    (zone)                │
│          │                          │
│          │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

## Usage

### 1. Define Zone-Based Routes

Use the `wrap()` function with a `zones` property:

```javascript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import Home from './routes/Home.svelte'
import UserMenu from './routes/UserMenu.svelte'
import UserDetail from './routes/UserDetail.svelte'
import UserStats from './routes/UserStats.svelte'

const routes = {
    // Single-component route (traditional)
    '/': Home,

    // Multi-zone route
    '/user/:id': wrap({
        zones: {
            'sidebar': UserMenu,
            'main': UserDetail,
            'panel': UserStats
        }
    }),

    // Multi-zone with async components
    '/admin/:id': wrap({
        zones: {
            'sidebar': () => import('./routes/AdminMenu.svelte'),
            'main': () => import('./routes/AdminPanel.svelte'),
            'panel': () => import('./routes/AdminStats.svelte')
        },
        conditions: [checkAuth],
        userData: { title: 'Admin' }
    })
}
```

### 2. Setup Multiple Router Instances

In your main app layout, create multiple `<Router>` instances with the `zone` prop:

```svelte
<script>
import Router from '@keenmate/svelte-spa-router'

const routes = {
    // ... your routes
}
</script>

<div class="layout">
    <aside class="sidebar">
        <Router {routes} zone="sidebar" />
    </aside>

    <main class="main-content">
        <Router {routes} zone="main" />
    </main>

    <div class="side-panel">
        <Router {routes} zone="panel" />
    </div>
</div>

<style>
.layout {
    display: grid;
    grid-template-columns: 200px 1fr 300px;
    gap: 1rem;
    height: 100vh;
}
</style>
```

### 3. How It Works

1. **Route Matching**: When you navigate to `/user/123`, the router matches the route
2. **Component Loading**: All zone components are loaded in parallel
3. **Zone Rendering**: Each `<Router zone="...">` instance renders its corresponding component
4. **Shared State**: All zones share the same route params, querystring, and navigation state

## Features

### Props Available in Zone Components

Zone components receive the same props as regular routed components:

```svelte
<script>
// UserMenu.svelte (sidebar zone)
let { params, userData } = $props()
</script>

<nav>
    <h3>User {params.id}</h3>
    <!-- ... menu items ... -->
</nav>
```

### Mixing Single and Multi-Zone Routes

You can have both types of routes in the same app:

```javascript
const routes = {
    '/': Home,                    // Single component
    '/about': About,              // Single component
    '/user/:id': wrap({          // Multi-zone
        zones: {
            'sidebar': UserMenu,
            'main': UserDetail
        }
    }),
    '/product/:id': ProductView  // Single component
}
```

When navigating from a multi-zone route to a single-component route, only the Router instance without a `zone` prop will render.

### Route Guards/Conditions

Guards work with zone-based routes:

```javascript
'/admin/:id': wrap({
    zones: {
        'sidebar': () => import('./AdminMenu.svelte'),
        'main': () => import('./AdminPanel.svelte')
    },
    conditions: [
        async (detail) => {
            const user = await checkAuth()
            return user.isAdmin
        }
    ]
})
```

If conditions fail, **no zones** are rendered.

### Static Props

Props are passed to all zone components:

```javascript
'/user/:id': wrap({
    zones: {
        'sidebar': UserMenu,
        'main': UserDetail
    },
    props: {
        theme: 'dark',
        compact: true
    }
})
```

### User Data (Metadata)

User data is available to all zones:

```javascript
'/user/:id': wrap({
    zones: {
        'sidebar': UserMenu,
        'main': UserDetail
    },
    userData: {
        title: 'User Profile',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Users', path: '/users' },
            { label: 'Profile' }
        ]
    }
})
```

## TypeScript Support

Full TypeScript support is included:

```typescript
import { wrap } from '@keenmate/svelte-spa-router/wrap'
import type { WrapOptions } from '@keenmate/svelte-spa-router/wrap'

const userRoute: WrapOptions = {
    zones: {
        'sidebar': () => import('./UserMenu.svelte'),
        'main': () => import('./UserDetail.svelte'),
        'panel': () => import('./UserStats.svelte')
    }
}

const routes = {
    '/user/:id': wrap(userRoute)
}
```

## Advanced Examples

### Dynamic Zones Based on Route

```javascript
const routes = {
    '/simple': wrap({
        zones: {
            'main': SimplePage
        }
    }),

    '/complex': wrap({
        zones: {
            'sidebar': Sidebar,
            'main': MainContent,
            'panel': SidePanel,
            'footer': Footer
        }
    })
}
```

### Zone with Loading Component

Note: Loading components are not yet supported for zone-based routes in this version.

## Best Practices

1. **Consistent Zone Names**: Use the same zone names across all routes for predictable layouts
2. **Fallback Content**: Consider providing default content when a zone isn't defined for a route
3. **Performance**: Use async imports (`() => import()`) for code-splitting
4. **Layout Flexibility**: Design your layout grid to handle missing zones gracefully

## Limitations

- Loading components (`loadingComponent`) are not currently supported for zone-based routes
- The `shouldDisplayLoadingOnRouteLoad` option is not supported for zone routes
- All zone components are loaded in parallel; there's no sequential loading option

## Migration from Single-Component Routes

To convert a single-component route to multi-zone:

**Before:**
```javascript
'/user/:id': UserProfile
```

**After:**
```javascript
'/user/:id': wrap({
    zones: {
        'main': UserProfile  // Put existing component in 'main' zone
    }
})
```

Then update your layout to use `<Router {routes} zone="main" />` instead of `<Router {routes} />`.
