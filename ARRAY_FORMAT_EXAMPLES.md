# Array Format Examples

The querystring helpers support two array formats for handling arrays in URLs.

## Formats

### 1. Repeat Format (Default)

Uses repeated parameters with the same key:
```
?tags=foo&tags=bar&tags=baz
```

**Pros:**
- Standard URL format
- Widely supported by backend frameworks
- Each value is independent

**Cons:**
- Longer URLs
- More verbose

### 2. Comma Format

Uses comma-separated values:
```
?tags=foo,bar,baz
```

**Pros:**
- Shorter URLs
- More human-readable
- Better for sharing links

**Cons:**
- Less common format
- Values cannot contain commas (they'll be split)

## Usage Examples

### Parsing

```javascript
import { parseQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

// Repeat format (default)
const result1 = parseQuerystring('tags=foo&tags=bar&tags=baz')
// { tags: ['foo', 'bar', 'baz'] }

// Comma format
const result2 = parseQuerystring('tags=foo,bar,baz', { arrayFormat: 'comma' })
// { tags: ['foo', 'bar', 'baz'] }
```

### Stringifying

```javascript
import { stringifyQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

const data = { search: 'books', tags: ['fiction', 'bestseller'] }

// Repeat format (default)
stringifyQuerystring(data)
// 'search=books&tags=fiction&tags=bestseller'

// Comma format
stringifyQuerystring(data, { arrayFormat: 'comma' })
// 'search=books&tags=fiction%2Cbestseller'
```

### In Components (Reactive)

```svelte
<script>
import { getParsedQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

// Using repeat format (default)
const query = $derived(getParsedQuerystring())

// Using comma format
const queryComma = $derived(getParsedQuerystring({ arrayFormat: 'comma' }))
</script>

<div>
  <h2>Tags (repeat format):</h2>
  <ul>
    {#each query.tags || [] as tag}
      <li>{tag}</li>
    {/each}
  </ul>

  <h2>Tags (comma format):</h2>
  <ul>
    {#each queryComma.tags || [] as tag}
      <li>{tag}</li>
    {/each}
  </ul>
</div>
```

### Updating Querystrings

```javascript
import { updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

// With repeat format (default)
await updateQuerystring({ tags: ['fiction', 'bestseller'] })
// URL: /products?tags=fiction&tags=bestseller

// With comma format
await updateQuerystring({ tags: ['fiction', 'bestseller'] }, { arrayFormat: 'comma' })
// URL: /products?tags=fiction,bestseller

// Add more tags
await updateQuerystring({ tags: ['fiction', 'bestseller', 'new'] }, { arrayFormat: 'comma' })
// URL: /products?tags=fiction,bestseller,new

// Remove tags
await updateQuerystring({ tags: null })
// URL: /products
```

### Complete Example: Filter Component

```svelte
<script>
import { getParsedQuerystring, updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

// Use comma format for cleaner URLs
const query = $derived(getParsedQuerystring({ arrayFormat: 'comma' }))
const selectedTags = $derived(query.tags || [])
const searchTerm = $derived(query.search || '')

const availableTags = ['fiction', 'non-fiction', 'bestseller', 'new-release']

async function toggleTag(tag) {
    const newTags = selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]

    await updateQuerystring({ tags: newTags.length ? newTags : null }, { arrayFormat: 'comma' })
}

async function updateSearch(value) {
    await updateQuerystring({ search: value || null }, { arrayFormat: 'comma' })
}
</script>

<div class="filters">
  <input
    type="text"
    value={searchTerm}
    oninput={(e) => updateSearch(e.target.value)}
    placeholder="Search..."
  />

  <div class="tags">
    {#each availableTags as tag}
      <button
        class:active={selectedTags.includes(tag)}
        onclick={() => toggleTag(tag)}
      >
        {tag}
      </button>
    {/each}
  </div>

  {#if selectedTags.length > 0}
    <p>Selected: {selectedTags.join(', ')}</p>
  {/if}
</div>

<style>
.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}
</style>
```

## Choosing a Format

**Use Repeat Format when:**
- You need maximum compatibility with backend systems
- Your values might contain commas
- You're working with standard REST APIs

**Use Comma Format when:**
- You want shorter, more readable URLs
- You're building a user-facing application where URL sharing is important
- Your array values are simple (tags, categories, IDs)
- You control both frontend and backend

## Important Notes

1. **Consistency:** Choose one format and stick with it throughout your application
2. **Whitespace:** Comma format automatically trims whitespace around values
3. **URL Encoding:** Both formats properly URL-encode values
4. **Empty Arrays:** Setting an array to `null` or an empty array removes it from the URL
