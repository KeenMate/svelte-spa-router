<script>
import { params, location, querystring } from '../../../src/lib/utils.svelte.js'
import { query } from '../../../src/lib/helpers/querystring.svelte.js'
import { filters } from '../../../src/lib/helpers/filters.svelte.js'

// Extract route parameters (from URL path)
// For route: /user/:userId/post/:postId
// URL: /user/123/post/456
const userId = $derived(params()?.userId)
const postId = $derived(params()?.postId)

// Extract querystring (raw string)
const rawQuerystring = $derived(querystring())

// Extract parsed querystring (auto-parsed with configured format)
const parsedQuery = $derived(query())
const search = $derived(parsedQuery.search || '')
const page = $derived(parsedQuery.page ? Number(parsedQuery.page) : 1)
const tags = $derived(Array.isArray(parsedQuery.tags) ? parsedQuery.tags : [])

// Extract filters (using filter system)
const filterSearch = $derived(filters().search || '')
const category = $derived(filters().category || 'all')

// Current location (path only, no querystring)
const currentPath = $derived(location())
</script>

<div class="route-data-demo">
    <h1>Route Data Extraction Demo</h1>
    <p>This page shows how to extract different types of data from the URL.</p>

    <div class="data-section">
        <h2>📍 Current Location</h2>
        <pre><code>{currentPath}</code></pre>
        <p class="hint">The current path without querystring</p>
    </div>

    <div class="data-section">
        <h2>🔢 Route Parameters</h2>
        <pre><code>{JSON.stringify(params(), null, 2)}</code></pre>
        <p class="hint">
            Extracted from URL path patterns like <code>/user/:userId/post/:postId</code><br>
            Example: <code>/user/123/post/456</code> → <code>{`{ userId: '123', postId: '456' }`}</code>
        </p>
        {#if userId}
            <p>User ID: <strong>{userId}</strong></p>
        {/if}
        {#if postId}
            <p>Post ID: <strong>{postId}</strong></p>
        {/if}
    </div>

    <div class="data-section">
        <h2>🔗 Raw Querystring</h2>
        <pre><code>{rawQuerystring || '(empty)'}</code></pre>
        <p class="hint">The raw querystring from the URL</p>
    </div>

    <div class="data-section">
        <h2>📦 Parsed Query (Auto-detected)</h2>
        <pre><code>{JSON.stringify(parsedQuery, null, 2)}</code></pre>
        <p class="hint">
            Automatically parsed with configured array format.<br>
            Access with: <code>query().paramName</code>
        </p>
        {#if search}
            <p>Search: <strong>{search}</strong></p>
        {/if}
        <p>Page: <strong>{page}</strong></p>
        {#if tags.length > 0}
            <p>Tags: <strong>{tags.join(', ')}</strong></p>
        {/if}
    </div>

    <div class="data-section">
        <h2>🔍 Filters</h2>
        <pre><code>{JSON.stringify(filters(), null, 2)}</code></pre>
        <p class="hint">
            Parsed using the configured filter mode (flat or structured).<br>
            Access with: <code>filters().filterName</code>
        </p>
        {#if filterSearch}
            <p>Filter Search: <strong>{filterSearch}</strong></p>
        {/if}
        <p>Category: <strong>{category}</strong></p>
    </div>

    <div class="usage-example">
        <h3>📖 Code Examples</h3>

        <h4>1️⃣ Extract Route Parameters</h4>
        <pre><code>{`import { params } from '@keenmate/svelte-spa-router'

// For route: /user/:userId/post/:postId
// URL: /user/123/post/456

const userId = $derived(params()?.userId)  // '123'
const postId = $derived(params()?.postId)  // '456'

// Or extract all at once
const routeParams = $derived(params())
// { userId: '123', postId: '456' }

// Use in API calls
$effect(() => {
  if (userId) {
    fetchUser(userId)
  }
})`}</code></pre>

        <h4>2️⃣ Extract Querystring</h4>
        <pre><code>{`import { querystring, query } from '@keenmate/svelte-spa-router'

// Raw querystring (string)
const raw = $derived(querystring())
// 'search=java&page=2&tags=web,tech'

// Parsed querystring (object with auto-detected arrays)
const search = $derived(query().search || '')
const page = $derived(query().page ? Number(query().page) : 1)
const tags = $derived(Array.isArray(query().tags) ? query().tags : [])

// Access all query params
const allParams = $derived(query())
// { search: 'java', page: '2', tags: ['web', 'tech'] }`}</code></pre>

        <h4>3️⃣ Extract Filters</h4>
        <pre><code>{`import { filters } from '@keenmate/svelte-spa-router/helpers/filters'

// Works with both flat and structured modes
const search = $derived(filters().search || '')
const category = $derived(filters().category || 'all')
const status = $derived(filters().status || 'active')
const minPrice = $derived(filters().minPrice ? Number(filters().minPrice) : null)

// All filters
const allFilters = $derived(filters())
// { search: 'java', category: 'books', status: 'active', minPrice: 10 }`}</code></pre>

        <h4>4️⃣ React to URL Changes</h4>
        <pre><code>{`import { params, query } from '@keenmate/svelte-spa-router'

// Automatically fetch data when route params change
$effect(() => {
  const userId = params()?.userId
  if (userId) {
    console.log('User ID changed:', userId)
    fetchUserData(userId)
  }
})

// Automatically filter when query changes
$effect(() => {
  const search = query().search
  if (search) {
    console.log('Search changed:', search)
    performSearch(search)
  }
})

// Combine multiple URL parts
$effect(() => {
  const userId = params()?.userId
  const page = query().page || 1

  if (userId) {
    fetchUserPosts(userId, page)
  }
})`}</code></pre>

        <h4>5️⃣ Complete Example Component</h4>
        <pre><code>{`<script>
import { params } from '@keenmate/svelte-spa-router'
import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
import { updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Route: /user/:userId
// URL: /user/123?page=2&search=hello

// Extract route params
const userId = $derived(params()?.userId)

// Extract query params
const page = $derived(query().page ? Number(query().page) : 1)
const search = $derived(query().search || '')

// Fetch data when URL changes
let userData = $state(null)
let loading = $state(false)

$effect(() => {
  if (userId) {
    loading = true
    fetchUser(userId, { page, search })
      .then(data => userData = data)
      .finally(() => loading = false)
  }
})

// Update querystring
async function handleSearch(value) {
  await updateQuerystring({ search: value || undefined, page: 1 })
}

async function changePage(newPage) {
  await updateQuerystring({ page: newPage })
}
</script>

<div>
  <h1>User: {userId}</h1>

  <input
    type="text"
    value={search}
    oninput={(e) => handleSearch(e.target.value)}
  />

  {#if loading}
    <p>Loading...</p>
  {:else if userData}
    <p>{userData.name}</p>

    <button onclick={() => changePage(page - 1)} disabled={page <= 1}>
      Previous
    </button>
    <span>Page {page}</span>
    <button onclick={() => changePage(page + 1)}>
      Next
    </button>
  {/if}
</div>`}</code></pre>
    </div>
</div>

<style>
.route-data-demo {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

h1 {
    color: #ff3e00;
    margin-bottom: 0.5rem;
}

h4 {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: #333;
}

.data-section {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1.5rem 0;
}

.data-section h2 {
    margin-top: 0;
    color: #333;
}

.data-section pre {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1rem 0;
}

.data-section code {
    color: #333;
    font-size: 0.9em;
    font-family: 'Courier New', monospace;
}

.hint {
    color: #666;
    margin: 0.5rem 0;
    font-size: 0.9em;
}

.hint code {
    background: white;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    color: #ff3e00;
}

.usage-example {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 2rem 0;
}

.usage-example h3 {
    margin-top: 0;
}

.usage-example pre {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1rem 0;
}

.usage-example code {
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
}
</style>
