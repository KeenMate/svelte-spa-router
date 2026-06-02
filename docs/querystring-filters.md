# Querystring & filter helpers

The router includes powerful helpers for working with querystrings and filters in a reactive, type-safe way.

## Querystring helpers

### Basic setup

Configure once in `main.js`:

```javascript
import { configureQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

configureQuerystring({
  arrayFormat: 'auto'  // 'auto', 'repeat', or 'comma'
})
```

### Using shared reactive querystring

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

### Array format support

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

### Manual parsing (without configuration)

```javascript
import { parseQuerystring, stringifyQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Parse
const parsed = parseQuerystring('search=foo&tags=a,b,c', { arrayFormat: 'auto' })
// { search: 'foo', tags: ['a', 'b', 'c'] }

// Stringify
const qs = stringifyQuerystring({ search: 'foo', tags: ['a', 'b'] }, { arrayFormat: 'repeat' })
// 'search=foo&tags=a&tags=b'
```

## Filter helpers

The filter system supports both flat and structured filter modes for different API requirements.

### Flat mode (default)

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

### Structured mode (OData-style)

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

### null vs undefined in filters

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
