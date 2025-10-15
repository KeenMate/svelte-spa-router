<script>
import { getParsedQuerystring, updateQuerystring } from '../../../src/lib/helpers/querystring-helpers.svelte.js'

// State for array format selection
let arrayFormat = $state('repeat') // 'repeat' or 'comma'

// Reactive parsed querystring - updates automatically when URL changes
const query = $derived(getParsedQuerystring({ arrayFormat }))

// Sample data
const categories = ['all', 'books', 'electronics', 'clothing', 'food']
const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'date', label: 'Date' }
]

// Derived values from querystring
const search = $derived(query.search || '')
const category = $derived(query.category || 'all')
const sort = $derived(query.sort || 'name')
const page = $derived(query.page ? Number(query.page) : 1)
const tags = $derived(Array.isArray(query.tags) ? query.tags : (query.tags ? [query.tags] : []))

// Sample items filtered by query
const allItems = [
    { id: 1, name: 'Svelte Book', category: 'books', price: 29.99, tags: ['programming', 'web'] },
    { id: 2, name: 'Laptop', category: 'electronics', price: 899.99, tags: ['tech', 'work'] },
    { id: 3, name: 'T-Shirt', category: 'clothing', price: 19.99, tags: ['fashion', 'casual'] },
    { id: 4, name: 'Coffee Beans', category: 'food', price: 12.99, tags: ['beverages', 'organic'] },
    { id: 5, name: 'JavaScript Guide', category: 'books', price: 34.99, tags: ['programming', 'web'] },
    { id: 6, name: 'Headphones', category: 'electronics', price: 149.99, tags: ['tech', 'audio'] },
]

const filteredItems = $derived.by(() => {
    let items = allItems

    // Filter by search
    if (search) {
        items = items.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase())
        )
    }

    // Filter by category
    if (category && category !== 'all') {
        items = items.filter(item => item.category === category)
    }

    // Filter by tags
    if (tags.length > 0) {
        items = items.filter(item =>
            tags.some(tag => item.tags.includes(tag))
        )
    }

    // Sort
    items = [...items].sort((a, b) => {
        if (sort === 'price') return a.price - b.price
        if (sort === 'name') return a.name.localeCompare(b.name)
        return a.id - b.id
    })

    return items
})

// Event handlers
async function handleSearchInput(e) {
    await updateQuerystring({
        search: e.target.value || null,  // null removes the param
        page: 1  // Reset to page 1 on new search
    })
}

async function handleCategoryChange(e) {
    await updateQuerystring({
        category: e.target.value === 'all' ? null : e.target.value,
        page: 1
    })
}

async function handleSortChange(e) {
    await updateQuerystring({
        sort: e.target.value === 'name' ? null : e.target.value,  // 'name' is default
        page: 1
    })
}

async function toggleTag(tag) {
    const newTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag]

    await updateQuerystring({
        tags: newTags.length > 0 ? newTags : null,
        page: 1
    }, { arrayFormat })
}

async function clearFilters() {
    // Setting all to null removes them from querystring
    await updateQuerystring({
        search: null,
        category: null,
        sort: null,
        tags: null,
        page: null
    })
}

async function changePage(newPage) {
    await updateQuerystring({ page: newPage })
}
</script>

<div class="querystring-demo">
    <h1>Querystring-Driven UI Demo</h1>
    <p>This page demonstrates a UI completely driven by URL querystring. All filters, search, and pagination are synced with the URL.</p>

    <div class="array-format-selector">
        <h3>🎛️ Array Format Mode:</h3>
        <div class="format-buttons">
            <button
                class="format-btn"
                class:active={arrayFormat === 'repeat'}
                onclick={() => arrayFormat = 'repeat'}
            >
                <strong>Repeat Format</strong>
                <span class="format-example">?tags=foo&tags=bar&tags=baz</span>
                <span class="format-desc">Standard, widely compatible</span>
            </button>
            <button
                class="format-btn"
                class:active={arrayFormat === 'comma'}
                onclick={() => arrayFormat = 'comma'}
            >
                <strong>Comma Format</strong>
                <span class="format-example">?tags=foo,bar,baz</span>
                <span class="format-desc">Shorter URLs, more readable</span>
            </button>
        </div>
        <p class="format-note">
            💡 <strong>Note:</strong> Switch formats and add tags below to see how the URL changes!
            The current format is: <code>{arrayFormat}</code>
        </p>
    </div>

    <div class="info-box">
        <strong>🔗 Current URL State:</strong>
        <pre><code>{JSON.stringify(query, null, 2)}</code></pre>
        <p class="hint">Try bookmarking this page or sharing the URL - the filters will be preserved!</p>
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
                    {#each categories as cat}
                        <option value={cat}>{cat}</option>
                    {/each}
                </select>
            </label>
        </div>

        <div class="filter-group">
            <label>
                🔄 Sort by:
                <select value={sort} onchange={handleSortChange}>
                    {#each sortOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </label>
        </div>

        <div class="filter-group">
            <label>🏷️ Tags:</label>
            <div class="tags">
                {#each ['programming', 'web', 'tech', 'fashion', 'organic', 'audio'] as tag}
                    <button
                        class="tag-button"
                        class:active={tags.includes(tag)}
                        onclick={() => toggleTag(tag)}
                    >
                        {tag}
                    </button>
                {/each}
            </div>
        </div>

        <button onclick={clearFilters} class="btn-clear">Clear All Filters</button>
    </div>

    <div class="results">
        <h3>Results ({filteredItems.length} items)</h3>

        {#if filteredItems.length === 0}
            <p class="no-results">No items match your filters.</p>
        {:else}
            <div class="items-grid">
                {#each filteredItems as item}
                    <div class="item-card">
                        <h4>{item.name}</h4>
                        <p class="category">{item.category}</p>
                        <p class="price">${item.price}</p>
                        <div class="item-tags">
                            {#each item.tags as tag}
                                <span class="tag">{tag}</span>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="pagination">
                <button
                    onclick={() => changePage(page - 1)}
                    disabled={page <= 1}
                >
                    Previous
                </button>
                <span class="page-info">Page {page}</span>
                <button
                    onclick={() => changePage(page + 1)}
                >
                    Next
                </button>
            </div>
        {/if}
    </div>

    <div class="usage-example">
        <h3>Usage Example:</h3>
        <pre><code>{`import { getParsedQuerystring, updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

// Reactive parsed querystring with array format
const query = $derived(getParsedQuerystring({ arrayFormat: '${arrayFormat}' }))

// Access values
const search = $derived(query.search || '')
const page = $derived(query.page ? Number(query.page) : 1)
const tags = $derived(Array.isArray(query.tags) ? query.tags : [])

// Update partial querystring with array format
async function toggleTag(tag) {
    const newTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag]

    await updateQuerystring({
        tags: newTags.length > 0 ? newTags : null,
        page: 1
    }, { arrayFormat: '${arrayFormat}' })
}`}</code></pre>
    </div>
</div>

<style>
.querystring-demo {
    padding: 2rem;
}

h1 {
    color: #ff3e00;
    margin-bottom: 0.5rem;
}

.array-format-selector {
    background: #fff3e0;
    border-left: 4px solid #ff9800;
    padding: 1.5rem;
    margin: 1.5rem 0;
    border-radius: 4px;
}

.array-format-selector h3 {
    margin-top: 0;
    color: #e65100;
}

.format-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1rem 0;
}

.format-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
    border: 2px solid #ddd;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.format-btn:hover {
    border-color: #ff9800;
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
}

.format-btn.active {
    border-color: #ff9800;
    background: #fff3e0;
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.format-btn strong {
    color: #333;
    font-size: 1.1em;
    margin-bottom: 0.5rem;
}

.format-example {
    display: block;
    background: #f5f5f5;
    padding: 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    color: #666;
    margin: 0.5rem 0;
    word-break: break-all;
}

.format-desc {
    display: block;
    font-size: 0.85em;
    color: #666;
    margin-top: 0.25rem;
}

.format-note {
    background: white;
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
    font-size: 0.95em;
}

.format-note code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-weight: bold;
    color: #ff9800;
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
    font-style: italic;
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

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.tag-button {
    padding: 0.4rem 0.8rem;
    border: 2px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.tag-button:hover {
    border-color: #ff3e00;
}

.tag-button.active {
    background: #ff3e00;
    color: white;
    border-color: #ff3e00;
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

.items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin: 1.5rem 0;
}

.item-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    transition: box-shadow 0.2s;
}

.item-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.item-card h4 {
    margin: 0 0 0.5rem 0;
    color: #333;
}

.category {
    color: #666;
    font-size: 0.9em;
    margin: 0.25rem 0;
    text-transform: capitalize;
}

.price {
    font-size: 1.2em;
    font-weight: bold;
    color: #4caf50;
    margin: 0.5rem 0;
}

.item-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
}

.tag {
    background: #e0e0e0;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.8em;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
}

.pagination button {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
}

.pagination button:hover:not(:disabled) {
    background: #f5f5f5;
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-info {
    font-weight: 600;
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
}

.usage-example code {
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
}
</style>
