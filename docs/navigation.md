# Navigation

## Navigating between pages

Using links with the `use:link` action:

```svelte
<script>
import {link} from '@keenmate/svelte-spa-router'
</script>

<a href="/book/123" use:link>View Book</a>
```

Programmatically with multiple formats:

```js
import {push, pop, replace} from '@keenmate/svelte-spa-router'

// String format (simple paths)
push('/book/42')

// Multi-parameter signature (NEW!)
push('userProfile', { userId: 123 }, { tab: 'settings' })
// Route name starting with / = exact path, otherwise = named route lookup
push('/about', {}, { source: 'nav' })

// Array format (with named routes)
push(['userProfile', { userId: 123 }])

// Array with query parameters
push(['userProfile', { userId: 123 }, { tab: 'settings' }])

// Array with navigation context (4 elements)
push(['userProfile', { userId: 123 }, { tab: 'settings' }, { source: 'menu' }])

// Object format (most explicit)
push({
  route: 'userProfile',
  params: { userId: 123 },
  query: { tab: 'settings', page: '2' }
})

// Object with navigation context
push({
  route: 'userProfile',
  params: { userId: 123 },
  query: { tab: 'settings' },
  navigationContext: { source: 'toolbar', userId: 789 }
})

// Go back (browser back button)
pop()

// Go back to referrer (with scroll restoration) - requires referrer tracking
goBack()

// Replace current page (supports all formats above)
replace('/book/3')
replace(['bookDetail', { bookId: 456 }])
replace('bookDetail', { bookId: 456 }, { preview: 'true' })
```

**Note:** To use named routes with `push()` and `replace()`, you need to register your routes first:

```js
import { registerRoutes } from '@keenmate/svelte-spa-router/routes'

registerRoutes({
  home: '/',
  userProfile: '/user/:userId',
  bookDetail: '/book/:bookId'
})
```

## Navigation context

Pass data during navigation without showing it in the URL (similar to WinForms):

```js
import { push, navigationContext } from '@keenmate/svelte-spa-router'

// Navigate with hidden context data
await push('/order-confirmation', {
  orderId: 12345,
  customer: 'Alice',
  totalAmount: 99.99
})

// In the target route component, access the context
const navContext = $derived(navigationContext())
// { orderId: 12345, customer: 'Alice', totalAmount: 99.99 }
```

Navigation context:
- Does NOT appear in the URL
- Perfect for passing sensitive data or large objects
- Accessible via `navigationContext()` in the target route
- Cleared when user manually navigates (types URL, refreshes, etc.)

## Referrer tracking

Automatically track and navigate back to the previous route with full context preservation.

### Enabling referrer tracking

Configure in your main.js before mounting the app:

```javascript
// main.js
import { setIncludeReferrer } from '@keenmate/svelte-spa-router'

setIncludeReferrer('always')  // Track referrer for all routes
```

**Configuration options:**
- `'never'` (default) — Disable referrer tracking
- `'notfound'` — Track referrer only for 404/catch-all routes
- `'always'` — Track referrer for all navigation

### Using goBack() for "Go Back" buttons

The `goBack()` helper provides the best way to navigate back with automatic scroll restoration:

```svelte
<script>
import { goBack, navigationContext } from '@keenmate/svelte-spa-router'

const navContext = $derived(navigationContext())
const referrer = $derived(navContext?.referrer)
</script>

{#if referrer}
    <button onclick={goBack}>← Back to {referrer.location}</button>
{/if}
```

**How it works:**
- Navigates using browser's native back button (`window.history.back()`)
- Automatically restores scroll position from when you first visited that page
- Preserves the original referrer (not chronological previous route)
- Falls back to `pop()` if no referrer exists

> **⚠️ Important:** Use `goBack()` instead of manual `push(referrer.location)` to get automatic scroll restoration and proper back navigation behavior.

### What gets tracked

The referrer object includes complete route context:

```javascript
{
  location: '/documents/123',      // Previous route path
  querystring: 'tab=settings',     // Query string
  params: { id: '123' },           // Route parameters
  routeName: 'documentDetail',     // Named route (if using named routes)
  scrollX: 0,                      // Scroll position when leaving
  scrollY: 245                     // Scroll position when leaving
}
```

### How it works

Referrers are automatically preserved in browser history:

1. When you navigate forward, the router calculates the referrer and saves it to `history.state`
2. When you press browser back/forward buttons, the referrer is restored from history
3. Referrer tracking respects your routing mode (hash or history API)
4. Scroll position is automatically saved and restored by `goBack()`

The referrer is cleared when users manually type a URL or refresh the page.

### Advanced: manual navigation

For cases requiring custom logic before navigation:

```svelte
<script>
import { push, navigationContext } from '@keenmate/svelte-spa-router'

const navContext = $derived(navigationContext())
const referrer = $derived(navContext?.referrer)

function customGoBack() {
    if (!referrer?.location) {
        // No referrer - fallback to home
        push('/')
        return
    }

    // Custom logic before navigation
    if (await confirmUnsavedChanges()) {
        const url = referrer.querystring
            ? `${referrer.location}?${referrer.querystring}`
            : referrer.location
        push(url)
        // Note: Manual push does NOT restore scroll position
    }
}
</script>
```

> **Migration note:** If you're currently using manual `push(referrer.location)` pattern, switch to `goBack()` for automatic scroll restoration and proper history navigation.

### Benefits over history.back()

- **Automatic scroll restoration** — Returns to exact scroll position when you left
- **Preserved in browser history** — Works with browser back/forward buttons
- **Works with replace() navigation** — Referrer persists even when using `replace()`
- **Conditional logic** — Check referrer before navigating back
- **Full route context** — Access to params, querystring, route name
- **Custom fallback** — Redirect to home or other route when no referrer exists

## Strict parameter replacement

Configure how missing route parameters are handled:

```javascript
// main.js
import { setParamReplacementPlaceholder } from '@keenmate/svelte-spa-router'

// Set placeholder for missing parameters (default: 'N-A')
setParamReplacementPlaceholder('N-A')
```

**Behavior:**

```javascript
// Route pattern: /users/:userId/:section
// If userId is provided but section is missing:
push('userProfile', { userId: 123 })
// Result: /users/123/N-A

// Missing parameters trigger onNotFound callback for error tracking
```

**Why strict replacement?**
- Predictable URLs — no silent parameter removal
- Easy to spot missing data in development
- `onNotFound` callback tracks issues for debugging
- Configure placeholder to match your app's style
