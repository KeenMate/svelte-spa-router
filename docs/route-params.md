# Route parameters, location & querystring

## Accessing route parameters

In your route components:

```svelte
<script>
let { routeParams = {} } = $props()
</script>

<p>Book ID: {routeParams.id}</p>
```

## Accessing location and querystring

```svelte
<script>
import { location, querystring, routeParams } from '@keenmate/svelte-spa-router'

// Access current location and querystring
const currentPath = $derived(location())
const query = $derived(querystring())
const params = $derived(routeParams())
</script>

<p>Current page: {currentPath}</p>
<p>Query: {query}</p>
<p>Params: {JSON.stringify(params)}</p>
```

## TypeScript support with generics

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
const p = $derived(routeParams<UserParams>())
const q = $derived(query<UserQuery>())

if (p) {
  const userId = p.userId        // ✅ TypeScript knows this exists
  const tab = p.tab || 'profile' // ✅ TypeScript knows this is optional
}

const search = $derived(q.search || '')
const page = $derived(q.page ? Number(q.page) : 1)
const tags = $derived(q.tags || [])  // ✅ TypeScript knows this is string[]
```
