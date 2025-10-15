<script>
import { filters, updateFilters } from '../../../src/lib/helpers/filters.svelte.js'

// Sample products data
const allProducts = [
    { id: 1, name: 'Java Programming Book', category: 'books', status: 'active', price: 45.99 },
    { id: 2, name: 'Python Guide', category: 'books', status: 'active', price: 39.99 },
    { id: 3, name: 'Gaming Laptop', category: 'electronics', status: 'active', price: 1299.99 },
    { id: 4, name: 'Wireless Mouse', category: 'electronics', status: 'discontinued', price: 29.99 },
    { id: 5, name: 'JavaScript Course', category: 'courses', status: 'active', price: 99.99 },
    { id: 6, name: 'React Framework', category: 'courses', status: 'active', price: 79.99 },
    { id: 7, name: 'Coffee Mug', category: 'accessories', status: 'active', price: 12.99 },
    { id: 8, name: 'Vintage Camera', category: 'electronics', status: 'discontinued', price: 499.99 },
]

// Reactive filter values
const search = $derived(filters().search || '')
const category = $derived(filters().category || 'all')
const status = $derived(filters().status || 'all')
const minPrice = $derived(filters().minPrice ? Number(filters().minPrice) : null)
const maxPrice = $derived(filters().maxPrice ? Number(filters().maxPrice) : null)

// Filter products based on current filters
const filteredProducts = $derived.by(() => {
    let products = allProducts

    // Filter by search
    if (search) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase())
        )
    }

    // Filter by category
    if (category && category !== 'all') {
        products = products.filter(p => p.category === category)
    }

    // Filter by status
    if (status && status !== 'all') {
        products = products.filter(p => p.status === status)
    }

    // Filter by price range
    if (minPrice !== null) {
        products = products.filter(p => p.price >= minPrice)
    }
    if (maxPrice !== null) {
        products = products.filter(p => p.price <= maxPrice)
    }

    return products
})

// Event handlers
async function handleSearchInput(e) {
    const value = e.target.value
    // undefined removes the param, null keeps it as empty
    await updateFilters({ search: value ? value : undefined })
}

async function handleCategoryChange(e) {
    const value = e.target.value
    await updateFilters({ category: value === 'all' ? undefined : value })
}

async function handleStatusChange(e) {
    const value = e.target.value
    await updateFilters({ status: value === 'all' ? undefined : value })
}

async function handleMinPriceChange(e) {
    const value = e.target.value
    await updateFilters({ minPrice: value ? Number(value) : undefined })
}

async function handleMaxPriceChange(e) {
    const value = e.target.value
    await updateFilters({ maxPrice: value ? Number(value) : undefined })
}

async function clearFilters() {
    await updateFilters({
        search: undefined,
        category: undefined,
        status: undefined,
        minPrice: undefined,
        maxPrice: undefined
    }, { merge: false })
}
</script>

<div class="filters-demo">
    <h1>Filters Demo</h1>
    <p>This page demonstrates flexible filter handling with both flat and structured modes.</p>

    <div class="info-box">
        <strong>🔗 Current Filters:</strong>
        <pre><code>{JSON.stringify(filters(), null, 2)}</code></pre>
        <p class="hint">
            The URL format depends on your configuration in <code>main.js</code>:<br>
            • <strong>Flat mode:</strong> <code>?search=java&category=books&status=active</code><br>
            • <strong>Structured mode:</strong> <code>?$filter=search eq 'java' AND category eq 'books'</code>
        </p>
    </div>

    <div class="filters-panel">
        <h3>Filters</h3>

        <div class="filter-group">
            <label>
                🔍 Search:
                <input
                    type="text"
                    value={search}
                    oninput={handleSearchInput}
                    placeholder="Search products..."
                />
            </label>
        </div>

        <div class="filter-group">
            <label>
                📁 Category:
                <select value={category} onchange={handleCategoryChange}>
                    <option value="all">All Categories</option>
                    <option value="books">Books</option>
                    <option value="electronics">Electronics</option>
                    <option value="courses">Courses</option>
                    <option value="accessories">Accessories</option>
                </select>
            </label>
        </div>

        <div class="filter-group">
            <label>
                ✅ Status:
                <select value={status} onchange={handleStatusChange}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="discontinued">Discontinued</option>
                </select>
            </label>
        </div>

        <div class="price-filters">
            <div class="filter-group">
                <label>
                    💰 Min Price:
                    <input
                        type="number"
                        value={minPrice || ''}
                        oninput={handleMinPriceChange}
                        placeholder="Min"
                        step="0.01"
                    />
                </label>
            </div>

            <div class="filter-group">
                <label>
                    💰 Max Price:
                    <input
                        type="number"
                        value={maxPrice || ''}
                        oninput={handleMaxPriceChange}
                        placeholder="Max"
                        step="0.01"
                    />
                </label>
            </div>
        </div>

        <button onclick={clearFilters} class="btn-clear">Clear All Filters</button>
    </div>

    <div class="results">
        <h3>Results ({filteredProducts.length} products)</h3>

        {#if filteredProducts.length === 0}
            <p class="no-results">No products match your filters.</p>
        {:else}
            <div class="products-grid">
                {#each filteredProducts as product}
                    <div class="product-card">
                        <h4>{product.name}</h4>
                        <p class="category">{product.category}</p>
                        <p class="status" class:discontinued={product.status === 'discontinued'}>
                            {product.status}
                        </p>
                        <p class="price">${product.price.toFixed(2)}</p>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <div class="usage-example">
        <h3>📖 Usage Examples</h3>

        <h4>1️⃣ Flat Mode (Default) - Separate Query Parameters</h4>
        <pre><code>{`// In main.js
import { configureFilters } from '@keenmate/svelte-spa-router/helpers/filters'

configureFilters({ mode: 'flat' })

// In your component
import { filters, updateFilters } from '@keenmate/svelte-spa-router/helpers/filters'

const search = $derived(filters().search || '')
const category = $derived(filters().category || 'all')

await updateFilters({ search: 'java', category: 'books' })
// URL: ?search=java&category=books`}</code></pre>

        <h4>2️⃣ Structured Mode - Single Filter Parameter (OData-style)</h4>
        <pre><code>{`// In main.js
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
      .map(([k, v]) => \`\${k} eq '\${v}'\`)
      .join(' AND ')
  }
})

// In your component (same API!)
import { filters, updateFilters } from '@keenmate/svelte-spa-router/helpers/filters'

const search = $derived(filters().search || '')
const category = $derived(filters().category || 'all')

await updateFilters({ search: 'java', category: 'books' })
// URL: ?$filter=search eq 'java' AND category eq 'books'`}</code></pre>

        <h4>3️⃣ Custom Parser for Your API</h4>
        <pre><code>{`// Example: Microsoft Graph API style
configureFilters({
  mode: 'structured',
  paramName: '$filter',
  parse: (str) => parseMicrosoftGraphFilter(str),
  stringify: (obj) => stringifyMicrosoftGraphFilter(obj)
})

// Example: Custom JSON format
configureFilters({
  mode: 'structured',
  paramName: 'filters',
  parse: (str) => JSON.parse(decodeURIComponent(str)),
  stringify: (obj) => encodeURIComponent(JSON.stringify(obj))
})
// URL: ?filters=%7B%22search%22%3A%22java%22%7D`}</code></pre>
    </div>
</div>

<style>
.filters-demo {
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

.info-box {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: 4px;
}

.info-box pre {
    background: white;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5rem 0;
}

.info-box code {
    color: #333;
    font-size: 0.9em;
}

.hint {
    color: #1976d2;
    margin: 0.5rem 0 0 0;
    font-size: 0.9em;
}

.hint code {
    background: white;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    color: #ff3e00;
}

.filters-panel {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 2rem 0;
}

.filters-panel h3 {
    margin-top: 0;
}

.filter-group {
    margin: 1rem 0;
}

.filter-group label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.filter-group input,
.filter-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.price-filters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.btn-clear {
    background: #d32f2f;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
}

.btn-clear:hover {
    background: #b71c1c;
}

.results {
    margin: 2rem 0;
}

.no-results {
    text-align: center;
    color: #666;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin: 1.5rem 0;
}

.product-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    transition: box-shadow 0.2s;
}

.product-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.product-card h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
}

.category {
    color: #666;
    font-size: 0.9em;
    margin: 0.25rem 0;
    text-transform: capitalize;
}

.status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 600;
    background: #4caf50;
    color: white;
    margin: 0.5rem 0;
}

.status.discontinued {
    background: #f44336;
}

.price {
    font-size: 1.3em;
    font-weight: bold;
    color: #2196f3;
    margin: 0.5rem 0 0 0;
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
