# Migration Guide: Migrating to @keenmate/svelte-spa-router

This guide helps you migrate from other routers to @keenmate/svelte-spa-router (Svelte 5 with runes).

## Prerequisites

- Upgrade to Svelte 5
- Understand [Svelte 5 runes](https://svelte.dev/docs/svelte/what-are-runes)

## Step 1: Update Dependencies

```bash
npm uninstall svelte-spa-router
npm install @keenmate/svelte-spa-router svelte@^5.0.0
```

## Step 2: Update Imports

Change all imports from `svelte-spa-router` to `@keenmate/svelte-spa-router`:

**Before:**
```js
import Router from 'svelte-spa-router'
import {link, location, querystring, params} from 'svelte-spa-router'
import {wrap} from 'svelte-spa-router/wrap'
import active from 'svelte-spa-router/active'
```

**After:**
```js
import Router from '@keenmate/svelte-spa-router'
import {link, location, querystring, routeParams} from '@keenmate/svelte-spa-router'
import {wrap} from '@keenmate/svelte-spa-router/wrap'
import {active} from '@keenmate/svelte-spa-router/active'
```

> **Note:** `params` is now named `routeParams` for clarity.

## Step 3: Convert Store Usage to Function Calls

### Location, Querystring, and Params

**Before (Svelte 4):**
```svelte
<script>
import {location, querystring, params} from 'svelte-spa-router'
</script>

<p>Location: {$location}</p>
<p>Query: {$querystring}</p>
<p>Params: {JSON.stringify($params)}</p>
```

**After (Svelte 5):**
```svelte
<script>
import {location, querystring, routeParams} from '@keenmate/svelte-spa-router'
</script>

<p>Location: {location()}</p>
<p>Query: {querystring()}</p>
<p>Params: {JSON.stringify(routeParams())}</p>
```

> **Important:** Note `params` is now `routeParams` and called as a function.

### Reactive Statements

If you're using stores in reactive statements:

**Before (Svelte 4):**
```svelte
<script>
import {location} from 'svelte-spa-router'

$: currentPath = $location
$: isHomePage = $location === '/'
</script>
```

**After (Svelte 5):**
```svelte
<script>
import {location} from '@keenmate/svelte-spa-router'

$: currentPath = location()
$: isHomePage = location() === '/'
</script>
```

Or use `$derived` rune:
```svelte
<script>
import {location} from '@keenmate/svelte-spa-router'

let currentPath = $derived(location())
let isHomePage = $derived(location() === '/')
</script>
```

## Step 4: Convert Event Handlers

### Router Events

**Before (Svelte 4):**
```svelte
<Router
    {routes}
    on:routeLoading={handleLoading}
    on:routeLoaded={handleLoaded}
    on:conditionsFailed={handleFailed}
    on:routeEvent={handleRouteEvent}
/>
```

**After (Svelte 5):**
```svelte
<Router
    {routes}
    onRouteLoading={handleLoading}
    onRouteLoaded={handleLoaded}
    onConditionsFailed={handleFailed}
    onrouteEvent={handleRouteEvent}
/>
```

> **Note:** Event handler props use camelCase naming (e.g., `onRouteLoading`, not `onrouteLoading`).

## Step 5: Update Route Components

### Component Props

**Before (Svelte 4):**
```svelte
<script>
export let params = {}
</script>

<p>ID: {params.id}</p>
```

**After (Svelte 5):**
```svelte
<script>
let { routeParams = {} } = $props()
</script>

<p>ID: {routeParams.id}</p>
```

> **Note:** The prop name is now `routeParams` (not `params`).

### Static Props from Router

If using `wrap()` with static props:

**Before (Svelte 4):**
```svelte
<script>
export let num
export let title
</script>
```

**After (Svelte 5):**
```svelte
<script>
let { num, title } = $props()
</script>
```

## Step 6: Update Store Subscriptions

If you're subscribing to stores programmatically:

**Before (Svelte 4):**
```js
import {location} from 'svelte-spa-router'

const unsubscribe = location.subscribe(value => {
    console.log('Location changed:', value)
})

// Later
unsubscribe()
```

**After (Svelte 5):**
```js
import {location} from '@keenmate/svelte-spa-router'

$effect(() => {
    console.log('Location changed:', location())
})

// Cleanup happens automatically when component is destroyed
```

## Step 7: Check Actions Compatibility

The `link` and `active` actions work the same way in both versions:

```svelte
<a href="/page" use:link use:active>Link</a>
```

No changes needed here!

## Step 8: Verify Route Guards

Pre-conditions (route guards) work identically:

```js
wrap({
    asyncComponent: () => import('./Admin.svelte'),
    conditions: [
        async (detail) => {
            // Your auth logic
            return true
        }
    ]
})
```

No changes needed!

## Common Patterns

### Pattern 1: Conditional Rendering Based on Location

**Before (Svelte 4):**
```svelte
<script>
import {location} from 'svelte-spa-router'
</script>

{#if $location === '/'}
    <HomeHeader />
{:else}
    <StandardHeader />
{/if}
```

**After (Svelte 5):**
```svelte
<script>
import {location} from '@keenmate/svelte-spa-router'
</script>

{#if location() === '/'}
    <HomeHeader />
{:else}
    <StandardHeader />
{/if}
```

### Pattern 2: Navigation Based on Conditions

**Before (Svelte 4):**
```svelte
<script>
import {push} from 'svelte-spa-router'
import {userStore} from './stores'

$: if (!$userStore.isAuthenticated) {
    push('/login')
}
</script>
```

**After (Svelte 5):**
```svelte
<script>
import {push} from '@keenmate/svelte-spa-router'
import {userStore} from './stores'

$effect(() => {
    if (!$userStore.isAuthenticated) {
        push('/login')
    }
})
</script>
```

### Pattern 3: Tracking Location Changes

**Before (Svelte 4):**
```svelte
<script>
import {location} from 'svelte-spa-router'

$: {
    console.log('Route changed to:', $location)
    // Analytics tracking
    trackPageView($location)
}
</script>
```

**After (Svelte 5):**
```svelte
<script>
import {location} from '@keenmate/svelte-spa-router'

$effect(() => {
    console.log('Route changed to:', location())
    // Analytics tracking
    trackPageView(location())
})
</script>
```

## Breaking Changes Summary

1. **Stores → Functions**: `$location` becomes `location()`
2. **Param Name Changed**: `params` is now `routeParams`
3. **Events → Props**: `on:routeLoaded` becomes `onRouteLoaded` (camelCase)
4. **Component Props**: `export let params` becomes `let { routeParams } = $props()`
5. **Subscriptions → Effects**: Use `$effect` instead of `.subscribe()`

## What Stays the Same

- ✅ Route definition syntax
- ✅ `push()`, `pop()`, `replace()` functions
- ✅ `link` and `active` actions
- ✅ `wrap()` utility and options
- ✅ Route guards/pre-conditions
- ✅ Hash-based routing behavior
- ✅ Dynamic imports and code-splitting
- ✅ Nested routers
- ✅ Scroll restoration

## Testing Your Migration

1. Start your dev server and check for errors
2. Test all routes navigate correctly
3. Verify params are passed to components
4. Check that route guards work
5. Test dynamic imports
6. Verify scroll restoration (if enabled)
7. Test `active` link highlighting

## Common Migration Errors

### Error: "Missing './stores' specifier"

```
Missing "./stores" specifier in "@keenmate/svelte-spa-router" package
```

**Cause:** You're trying to use the old v3/v4 API that used Svelte stores.

**❌ Wrong:**
```javascript
import { routeParams } from '@keenmate/svelte-spa-router/stores'
```

**✅ Fix:**
```javascript
// Import from main module or /utils
import { routeParams } from '@keenmate/svelte-spa-router'
// OR
import { routeParams } from '@keenmate/svelte-spa-router'

// Use as a function, not a store
const params = $derived(routeParams())
```

### Error: "routeParams is not a function"

**Cause:** You're using the old store syntax.

**❌ Wrong:**
```svelte
<p>ID: {$routeParams.id}</p>
```

**✅ Fix:**
```svelte
<p>ID: {routeParams().id}</p>
```

Or better yet, use props in route components:
```svelte
<script>
let { routeParams = {} } = $props()
</script>
<p>ID: {routeParams.id}</p>
```

### Error: "params is undefined"

**Cause:** The prop name changed from `params` to `routeParams`.

**❌ Wrong:**
```javascript
import { params } from '@keenmate/svelte-spa-router'
```

**✅ Fix:**
```javascript
import { routeParams } from '@keenmate/svelte-spa-router'
```

### Error: Event handlers not firing

**Cause:** Event handler prop names changed to camelCase.

**❌ Wrong:**
```svelte
<Router {routes} onrouteLoaded={handler} />
```

**✅ Fix:**
```svelte
<Router {routes} onRouteLoaded={handler} />
```

### Import Path Quick Reference

| Import | Path |
|--------|------|
| Router component | `'@keenmate/svelte-spa-router'` |
| Navigation (push, replace, etc.) | `'@keenmate/svelte-spa-router'` or `/utils` |
| Route data (location, routeParams) | `'@keenmate/svelte-spa-router'` or `/utils` |
| Route wrapping | `'@keenmate/svelte-spa-router/wrap'` |
| Active link highlighting | `'@keenmate/svelte-spa-router/active'` |
| Permissions | `'@keenmate/svelte-spa-router/helpers/permissions'` |
| Navigation guards | `'@keenmate/svelte-spa-router/helpers/navigation-guard'` |
| ❌ Stores (doesn't exist!) | None - use functions instead |

## Need Help?

If you encounter issues during migration:

1. Check the [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide)
2. Review [Svelte 5 runes documentation](https://svelte.dev/docs/svelte/what-are-runes)
3. Open an issue on GitHub

## Example Migration

Here's a complete before/after example:

**Before (Svelte 4):**
```svelte
<script>
import Router from 'svelte-spa-router'
import {location, link} from 'svelte-spa-router'
import active from 'svelte-spa-router/active'
import routes from './routes'

export let params = {}

$: isHomePage = $location === '/'
</script>

<nav>
    <a href="/" use:link use:active>Home</a>
    <a href="/about" use:link use:active>About</a>
</nav>

{#if isHomePage}
    <h1>Welcome Home!</h1>
{/if}

<Router
    {routes}
    on:routeLoaded={(e) => console.log(e.detail)}
/>

<footer>Current page: {$location}</footer>
```

**After (Svelte 5):**
```svelte
<script>
import Router from '@keenmate/svelte-spa-router'
import {location, link} from '@keenmate/svelte-spa-router'
import {active} from '@keenmate/svelte-spa-router/active'
import routes from './routes'

let { routeParams = {} } = $props()

let isHomePage = $derived(location() === '/')
</script>

<nav>
    <a href="/" use:link use:active>Home</a>
    <a href="/about" use:link use:active>About</a>
</nav>

{#if isHomePage}
    <h1>Welcome Home!</h1>
{/if}

<Router
    {routes}
    onRouteLoaded={(e) => console.log(e.detail)}
/>

<footer>Current page: {location()}</footer>
```
