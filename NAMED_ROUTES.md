# Named Routes Feature

This router now supports multiple convenient ways to create links, including a powerful named routes system!

## Quick Start

### 1. Register Your Routes

```javascript
import { registerRoutes } from '@keenmate/svelte-spa-router'

registerRoutes({
    home: '/',
    about: '/about',
    userProfile: '/users/:userId',
    documentDetail: '/documents/:documentId'
})
```

### 2. Use Links (Multiple Styles!)

```svelte
<script>
import { link } from '@keenmate/svelte-spa-router'
</script>

<!-- ✅ Old style (still works!) -->
<a href="/about" use:link>About</a>

<!-- ✅ Object with direct href -->
<a use:link={{href: '/about'}}>About</a>

<!-- ✅ Named routes with params -->
<a use:link={{route: 'documentDetail', params: {documentId: 123}}}>
    View Document
</a>

<!-- ✅ Array shorthand [routeName, params] -->
<a use:link={['documentDetail', {documentId: 123}]}>
    View Document
</a>

<!-- ✅ With query string -->
<a use:link={{route: 'documentDetail', params: {documentId: 123}, query: {tab: 'info'}}}>
    Document Info Tab
</a>

<!-- ✅ Array with query [routeName, params, query] -->
<a use:link={['documentDetail', {documentId: 123}, {tab: 'info'}]}>
    Document Info Tab
</a>

<!-- ✅ Direct href with query -->
<a use:link={{href: '/documents/123', query: {tab: 'info'}}}>
    Document Info Tab
</a>
```

## API Reference

### Route Registration

#### `registerRoute(name, pattern)`
Register a single named route.

```javascript
import { registerRoute } from '@keenmate/svelte-spa-router'

registerRoute('userProfile', '/users/:userId')
```

#### `registerRoutes(routes)`
Register multiple routes at once.

```javascript
import { registerRoutes } from '@keenmate/svelte-spa-router'

registerRoutes({
    home: '/',
    about: '/about',
    userProfile: '/users/:userId',
    documentDetail: '/documents/:documentId'
})
```

#### `buildUrl(name, params, query)`
Build a URL from a route name (used internally by the link action).

```javascript
import { buildUrl } from '@keenmate/svelte-spa-router'

const url = buildUrl('documentDetail', { documentId: 123 }, { tab: 'info' })
// Returns: '/documents/123?tab=info'
```

#### `hasRoute(name)`
Check if a route is registered.

```javascript
import { hasRoute } from '@keenmate/svelte-spa-router'

if (hasRoute('documentDetail')) {
    console.log('Route exists!')
}
```

#### `getRoutes()`
Get all registered routes.

```javascript
import { getRoutes } from '@keenmate/svelte-spa-router'

console.log(getRoutes())
// { home: '/', about: '/about', ... }
```

#### `clearRoutes()`
Clear all registered routes.

```javascript
import { clearRoutes } from '@keenmate/svelte-spa-router'

clearRoutes()
```

## Link Action Options

The `link` action now accepts multiple formats:

### String Format (Legacy)
```svelte
<a use:link="/about">About</a>
```

### Array Format
```svelte
<!-- [routeName, params, query] -->
<a use:link={['userProfile', {userId: 123}]}>User Profile</a>
<a use:link={['userProfile', {userId: 123}, {tab: 'settings'}]}>User Settings</a>
```

### Object Format
```svelte
<a use:link={{
    route: 'userProfile',     // Route name (or use href for direct path)
    params: {userId: 123},    // Route parameters
    query: {tab: 'settings'}, // Query string parameters
    replace: false,           // Use replaceState instead of pushState
    disabled: false           // Disable navigation
}}>
    User Settings
</a>
```

## TypeScript Support

Full TypeScript support is included:

```typescript
import type { LinkActionOptions } from '@keenmate/svelte-spa-router'

const linkOptions: LinkActionOptions = {
    route: 'documentDetail',
    params: { documentId: 123 },
    query: { tab: 'info' }
}
```

## Examples

See the `/links-demo` route in the example app for a complete demonstration of all link formats!

## Benefits

- **Type-safe routing** - Define routes once, use them everywhere
- **Refactor-friendly** - Change URL patterns without updating every link
- **Cleaner code** - No more string concatenation for dynamic URLs
- **Flexible** - Choose the syntax that fits your use case
- **Backward compatible** - Old `<a href="/path" use:link>` still works!

## Migration

No breaking changes! Your existing code continues to work. You can gradually adopt named routes:

```svelte
<!-- Before -->
<a href="/documents/123" use:link>View Document</a>

<!-- After (when you're ready) -->
<a use:link={['documentDetail', {documentId: 123}]}>View Document</a>
```
