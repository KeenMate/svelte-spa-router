# Loading states & dynamic metadata

The router provides flexible loading control with support for three distinct patterns, allowing you to choose the approach that best fits your application architecture.

## Pattern 1: Router-managed loading (zone-specific)

Use `loadingComponent` with `shouldDisplayLoadingOnRouteLoad: true` for multi-zone layouts where the Router manages the loading state:

> **⚠️ You must call `hideLoading()` from the route component.** When
> `shouldDisplayLoadingOnRouteLoad: true` is set, the router mounts the route
> component immediately but keeps it hidden under `loadingComponent` and waits
> for an explicit `hideLoading()` signal before revealing it. If the component
> never calls `hideLoading()` (forgotten, thrown before reaching it, conditional
> code path that didn't run), the loading screen stays up forever and the real
> component never appears — the route is effectively bricked until the user
> navigates away. In development, a `console.warn` fires after 10 seconds to
> surface this; production has no automatic recovery.

```javascript
import { createRoute } from '@keenmate/svelte-spa-router/wrap'
import { hideLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import Loading from './components/Loading.svelte'

const routes = {
    '/document/:id': createRoute({
        component: () => import('./routes/DocumentDetail.svelte'),
        loadingComponent: Loading,
        shouldDisplayLoadingOnRouteLoad: true,  // Keep loading visible until component signals ready
        title: 'Document Detail',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents', path: '/metadata-demo' },
            { id: 'documentDetail', label: 'Loading...', path: '/document/:id' }
        ]
    })
}
```

In your component, signal when data is loaded:

```svelte
<script>
import { onMount } from 'svelte'
import { hideLoading, updateTitle, updateBreadcrumb } from '@keenmate/svelte-spa-router/helpers/route-metadata'

let { routeParams } = $props()
let document = $state(null)

onMount(async () => {
    // Fetch data
    document = await fetchDocument(routeParams.id)

    // Update metadata with loaded data
    updateTitle(document.name)
    updateBreadcrumb('documentDetail', {
        label: document.name,
        path: `/document/${routeParams.id}`
    })

    // Signal that loading is complete
    hideLoading()
})
</script>

<h1>{document?.name || 'Loading...'}</h1>
```

**Perfect for:**
- Multi-zone layouts (toolpanel + content areas)
- Apps where each zone needs its own loading UI
- When you want the Router to manage loading component visibility

## Pattern 2: Component-managed loading (default)

Components handle their own loading state with no special configuration:

```javascript
const routes = {
    '/product/:id': createRoute({
        component: () => import('./routes/ProductDetail.svelte'),
        title: 'Product Detail'
    })
}
```

```svelte
<script>
let { routeParams } = $props()
let product = $state(null)
let loading = $state(true)

onMount(async () => {
    product = await fetchProduct(routeParams.id)
    loading = false
})
</script>

{#if loading}
    <div class="loading">Loading product...</div>
{:else}
    <h1>{product.name}</h1>
    <p>{product.description}</p>
{/if}
```

**Perfect for:**
- Simple apps with straightforward loading needs
- Components that manage their own UI states
- When you want full control over loading presentation

## Pattern 3: Global loading overlay (user-defined)

Define a global loading overlay in your `App.svelte` that reacts to route loading state:

```svelte
<!-- App.svelte -->
<script>
import { routeIsLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import Router from '@keenmate/svelte-spa-router'

const isLoading = $derived(routeIsLoading())
</script>

<div class="app">
    {#if isLoading}
    <div class="global-loading-overlay">
        <div class="spinner"></div>
        <p>Loading...</p>
    </div>
    {/if}

    <Router {routes} />
</div>

<style>
.global-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}
</style>
```

Then manually control loading in your components:

```svelte
<script>
import { showLoading, hideLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'

let { routeParams } = $props()
let data = $state(null)

async function loadData() {
    showLoading()  // Show global overlay
    try {
        data = await fetchData(routeParams.id)
    } finally {
        hideLoading()  // Hide global overlay
    }
}

onMount(loadData)
</script>
```

**Perfect for:**
- Consistent loading UI across entire app
- Apps with complex async operations beyond route loading
- When you want a single global loading indicator

## Combining patterns

You can combine Pattern 1 and Pattern 3 for comprehensive loading feedback:

```javascript
// Route uses both loadingComponent and triggers global overlay
'/document/:id': createRoute({
    component: () => import('./routes/DocumentDetail.svelte'),
    loadingComponent: Loading,  // Zone-specific loading
    shouldDisplayLoadingOnRouteLoad: true,  // Also triggers global overlay
    title: 'Document Detail'
})
```

This shows both:
- The `Loading` component in the content area (zone-specific)
- The global overlay (if defined in App.svelte)

## Dynamic metadata helpers

Update page metadata after data loads:

```javascript
import {
    updateTitle,           // Update just the title
    updateBreadcrumb,      // Update specific breadcrumb by ID
    updateRouteMetadata    // Update full metadata object
} from '@keenmate/svelte-spa-router/helpers/route-metadata'

// Update title only
updateTitle('Invoice.pdf')

// Update specific breadcrumb by ID (partial update)
updateBreadcrumb('documentDetail', {
    label: 'Invoice.pdf',
    path: '/document/123'
})

// Update full metadata
updateRouteMetadata({
    title: 'Invoice.pdf',
    breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: 'Documents', path: '/documents' },
        { label: 'Invoice.pdf', path: '/document/123' }
    ]
})
```

## Reactive metadata access

Access current route metadata reactively:

```svelte
<script>
import { routeTitle, routeBreadcrumbs, routeContext } from '@keenmate/svelte-spa-router/helpers/route-metadata'

const title = $derived(routeTitle())
const breadcrumbs = $derived(routeBreadcrumbs())
const context = $derived(routeContext())
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

**Available helpers:**
```javascript
import {
    // Loading state control
    showLoading,           // Manually show loading state
    hideLoading,           // Hide loading state (signal component is ready)
    routeIsLoading,        // Check if currently loading (reactive)

    // Metadata updates
    updateTitle,           // Update just the title
    updateBreadcrumb,      // Update specific breadcrumb by ID
    updateRouteMetadata,   // Update full metadata object

    // Reactive metadata access
    routeTitle,            // Get current title
    routeBreadcrumbs,      // Get current breadcrumbs
    routeContext            // Get full route context object
} from '@keenmate/svelte-spa-router/helpers/route-metadata'
```

See `/loading-demo` and `/document/:id` routes in the example-history app for complete interactive demos.
