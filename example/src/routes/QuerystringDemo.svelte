<script>
import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
import { updateQuerystring, createQuerystringHelpers } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'
import { querystring } from '@keenmate/svelte-spa-router'

// Detect initial array format from URL
function detectArrayFormat() {
    const qs = querystring()
    if (!qs) return 'repeat'

    // Check if any parameter contains commas (indicating comma format)
    const params = new URLSearchParams(qs)
    for (const [key, value] of params.entries()) {
        if (params.getAll(key).length > 1) {
            // Multiple params with same key = repeat format
            return 'repeat'
        }
        if (value.includes(',')) {
            // Single param with comma = comma format
            return 'comma'
        }
    }
    return 'repeat'
}

// State for array format selection - detect initial format from URL
let arrayFormat = $state(detectArrayFormat())

// Note: We're using the shared reactive query from querystring-helpers
// No need to call getParsedQuerystring() - it's already parsed and reactive!

// Sample data
const categories = ['all', 'books', 'electronics', 'clothing', 'food']
const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'date', label: 'Date' }
]

// Derived values from querystring
// Note: query() is a function, so we call it to get the current parsed querystring
const search = $derived(query().search || '')
const category = $derived(query().category || 'all')
const sort = $derived(query().sort || 'name')
const page = $derived(query().page ? Number(query().page) : 1)
const tags = $derived(Array.isArray(query().tags) ? query().tags : (query().tags ? [query().tags] : []))

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

// =============================================================================
// OData / Microsoft Graph custom-formatter demo
// =============================================================================
// OData uses dollar-prefixed system query options ($filter, $select, $orderby,
// $top, $skip, $count) and comma-separates field lists instead of repeating
// keys. The standard parsers don't handle this — but createQuerystringHelpers()
// lets you plug in your own parse/stringify pair and get the full reactive
// helper suite (parsed view, updateQuerystring, etc.) for free.

const ODATA_LIST_KEYS = new Set(['$select', '$orderby', '$expand'])
const ODATA_NUMBER_KEYS = new Set(['$top', '$skip'])

function parseOData(qs) {
    if (!qs) return {}
    const params = new URLSearchParams(qs)
    const result = {}
    for (const [key, value] of params.entries()) {
        if (ODATA_LIST_KEYS.has(key)) {
            result[key] = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
        } else if (ODATA_NUMBER_KEYS.has(key)) {
            result[key] = Number(value)
        } else if (key === '$count') {
            result[key] = value === 'true'
        } else {
            result[key] = value
        }
    }
    return result
}

function stringifyOData(obj) {
    const parts = []
    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined || value === '') continue
        if (Array.isArray(value)) {
            if (value.length === 0) continue
            parts.push(`${encodeURIComponent(key)}=${value.map(v => encodeURIComponent(String(v))).join(',')}`)
        } else if (typeof value === 'boolean') {
            parts.push(`${encodeURIComponent(key)}=${value ? 'true' : 'false'}`)
        } else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        }
    }
    return parts.join('&')
}

// Custom helpers wired to the OData formatter.
const odata = createQuerystringHelpers(parseOData, stringifyOData)

// Local form state — what the user is composing in the builder.
// We don't bind these directly to the URL on every keystroke; the user
// presses "Apply" to write them. That keeps the demo predictable.
const ALL_USER_FIELDS = ['id', 'displayName', 'mail', 'jobTitle', 'department']
const ALL_ORDER_FIELDS = ['displayName', 'mail', 'jobTitle']

let odataFilter = $state("startswith(displayName,'A')")
let odataSelect = $state(['id', 'displayName', 'mail'])
let odataOrderField = $state('displayName')
let odataOrderDir = $state('asc')
let odataTop = $state(10)
let odataSkip = $state(0)
let odataCount = $state(true)

// Live OData querystring as built from the form state (no URL write yet).
const odataBuilt = $derived(stringifyOData({
    $filter: odataFilter,
    $select: odataSelect,
    $orderby: odataOrderField ? `${odataOrderField} ${odataOrderDir}` : null,
    $top: odataTop,
    $skip: odataSkip,
    $count: odataCount
}))

// Round-trip: re-parse the actually-on-URL querystring through parseOData.
// Shows ONLY the $-prefixed keys (because parseOData picks them up; standard
// keys from the existing demo are returned as plain strings and we hide them).
const odataParsed = $derived.by(() => {
    const all = odata.getParsedQuerystring()
    const dollar = {}
    for (const [k, v] of Object.entries(all)) {
        if (k.startsWith('$')) dollar[k] = v
    }
    return dollar
})

function toggleOdataField(field) {
    odataSelect = odataSelect.includes(field)
        ? odataSelect.filter(f => f !== field)
        : [...odataSelect, field]
}

async function applyOdata() {
    await odata.updateQuerystring({
        $filter: odataFilter || null,
        $select: odataSelect.length > 0 ? odataSelect : null,
        $orderby: odataOrderField ? `${odataOrderField} ${odataOrderDir}` : null,
        $top: odataTop || null,
        $skip: odataSkip > 0 ? odataSkip : null,
        $count: odataCount ? true : null
    })
}

async function clearOdata() {
    await odata.updateQuerystring({
        $filter: null,
        $select: null,
        $orderby: null,
        $top: null,
        $skip: null,
        $count: null
    })
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
        <pre><code>{JSON.stringify(query(), null, 2)}</code></pre>
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
            <strong class="group-label">🏷️ Tags:</strong>
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
        <h3>✨ New: Simplified API (Recommended)</h3>
        <p class="api-note">Configure once in <code>main.js</code>, use everywhere:</p>
        <pre><code>{`// 1️⃣ Configure in main.js (once)
import { configureQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring'

configureQuerystring({ arrayFormat: 'auto' }) // Auto-detects format!

// 2️⃣ Use in any component (no config needed!)
import { query } from '@keenmate/svelte-spa-router/helpers/querystring'
import { updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Access values - simple and clean!
const search = $derived(query().search || '')
const page = $derived(query().page ? Number(query().page) : 1)
const tags = $derived(Array.isArray(query().tags) ? query().tags : [])

// Update querystring
async function toggleTag(tag) {
    const newTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]
    await updateQuerystring({ tags: newTags.length > 0 ? newTags : null, page: 1 })
}`}</code></pre>

        <h3>📚 Alternative: Manual Configuration (Per Component)</h3>
        <p class="api-note">If you need different formats per component:</p>
        <pre><code>{`import { getParsedQuerystring, updateQuerystring } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Specify format per component
const query = $derived(getParsedQuerystring({ arrayFormat: '${arrayFormat}' }))

const search = $derived(query.search || '')
const tags = $derived(Array.isArray(query.tags) ? query.tags : [])

// Specify format when updating
await updateQuerystring({ tags: ['foo', 'bar'] }, { arrayFormat: '${arrayFormat}' })`}</code></pre>
    </div>

    <!-- ===================================================================== -->
    <!-- OData / Microsoft Graph custom formatter demo                          -->
    <!-- ===================================================================== -->
    <div class="odata-demo">
        <h2>🔌 Custom Formatter Demo — OData / Microsoft Graph</h2>
        <p class="odata-intro">
            Standard repeat/comma formats don't cover every API. Some backends use
            their own conventions — like <a href="https://learn.microsoft.com/en-us/graph/query-parameters" target="_blank" rel="noopener">Microsoft Graph</a>
            (and OData generally), with dollar-prefixed query options
            (<code>$filter</code>, <code>$select</code>, <code>$orderby</code>,
            <code>$top</code>, <code>$skip</code>, <code>$count</code>) and
            comma-separated field lists. <code>createQuerystringHelpers()</code>
            lets you plug in a custom parse/stringify pair and get the full
            reactive helper suite for free.
        </p>

        <div class="odata-builder">
            <h3>Query Builder</h3>
            <p class="odata-hint">
                Imagine you're fetching <code>/users</code> from Microsoft Graph.
                Compose a request below — the OData querystring is built live,
                and "Apply to URL" writes it to <em>this page</em> using your
                custom stringifier.
            </p>

            <div class="odata-field">
                <label for="odata-filter">$filter (OData expression):</label>
                <input
                    id="odata-filter"
                    type="text"
                    bind:value={odataFilter}
                    placeholder="startswith(displayName,'A') and department eq 'Sales'"
                />
            </div>

            <div class="odata-field">
                <strong class="odata-field-label">$select (which fields to return):</strong>
                <div class="odata-chips">
                    {#each ALL_USER_FIELDS as field}
                        <button
                            type="button"
                            class="odata-chip"
                            class:active={odataSelect.includes(field)}
                            onclick={() => toggleOdataField(field)}
                        >
                            {field}
                        </button>
                    {/each}
                </div>
            </div>

            <div class="odata-row">
                <div class="odata-field">
                    <label for="odata-orderby-field">$orderby field:</label>
                    <select id="odata-orderby-field" bind:value={odataOrderField}>
                        <option value="">(none)</option>
                        {#each ALL_ORDER_FIELDS as field}
                            <option value={field}>{field}</option>
                        {/each}
                    </select>
                </div>
                <div class="odata-field">
                    <label for="odata-orderby-dir">direction:</label>
                    <select id="odata-orderby-dir" bind:value={odataOrderDir}>
                        <option value="asc">asc</option>
                        <option value="desc">desc</option>
                    </select>
                </div>
            </div>

            <div class="odata-row">
                <div class="odata-field odata-field-narrow">
                    <label for="odata-top">$top:</label>
                    <input id="odata-top" type="number" min="0" bind:value={odataTop} />
                </div>
                <div class="odata-field odata-field-narrow">
                    <label for="odata-skip">$skip:</label>
                    <input id="odata-skip" type="number" min="0" bind:value={odataSkip} />
                </div>
            </div>

            <div class="odata-field odata-checkbox-row">
                <label class="odata-checkbox" for="odata-count">
                    <input id="odata-count" type="checkbox" bind:checked={odataCount} />
                    <span>Include <code>$count=true</code> in the request (asks the server for a total result count)</span>
                </label>
            </div>

            <div class="odata-actions">
                <button type="button" onclick={applyOdata} class="btn-apply">Apply to URL</button>
                <button type="button" onclick={clearOdata} class="btn-clear-odata">Clear OData params</button>
            </div>
        </div>

        <div class="odata-panels">
            <div class="odata-panel odata-panel-built">
                <h4>Built querystring (from form)</h4>
                <pre class="odata-string"><code>?{odataBuilt}</code></pre>
                <p class="odata-panel-note">
                    Output of <code>stringifyOData(formState)</code> — what
                    "Apply to URL" will write.
                </p>
            </div>

            <div class="odata-panel odata-panel-parsed">
                <h4>Parsed back from URL</h4>
                <pre class="odata-string"><code>{JSON.stringify(odataParsed, null, 2)}</code></pre>
                <p class="odata-panel-note">
                    Output of <code>parseOData(window.location.search)</code> —
                    keys typed back as arrays / numbers / booleans according to
                    OData conventions.
                </p>
            </div>
        </div>

        <div class="odata-code">
            <h3>How it's wired</h3>
            <pre><code>{`import { createQuerystringHelpers } from '@keenmate/svelte-spa-router/helpers/querystring-helpers'

// Tiny OData-aware parse/stringify pair.
function parseOData(qs) {
    const params = new URLSearchParams(qs)
    const result = {}
    for (const [key, value] of params.entries()) {
        if (key === '$select' || key === '$orderby' || key === '$expand') {
            result[key] = value.split(',').map(s => s.trim())
        } else if (key === '$top' || key === '$skip') {
            result[key] = Number(value)
        } else if (key === '$count') {
            result[key] = value === 'true'
        } else {
            result[key] = value
        }
    }
    return result
}

function stringifyOData(obj) {
    const parts = []
    for (const [key, value] of Object.entries(obj)) {
        if (value == null || value === '') continue
        if (Array.isArray(value)) {
            if (value.length === 0) continue
            parts.push(\`\${encodeURIComponent(key)}=\${value.map(v => encodeURIComponent(v)).join(',')}\`)
        } else {
            parts.push(\`\${encodeURIComponent(key)}=\${encodeURIComponent(String(value))}\`)
        }
    }
    return parts.join('&')
}

// One call wires the full helper suite to your formatter.
const odata = createQuerystringHelpers(parseOData, stringifyOData)

// Use it like the standard helpers:
const query = $derived(odata.getParsedQuerystring())
await odata.updateQuerystring({ $select: ['id', 'displayName'], $top: 10 })`}</code></pre>
        </div>
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

.filter-group label,
.filter-group .group-label {
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
    margin-bottom: 0.5rem;
}

.usage-example h3:not(:first-child) {
    margin-top: 2rem;
}

.api-note {
    margin: 0.5rem 0 1rem 0;
    color: #666;
    font-size: 0.95em;
}

.api-note code {
    background: white;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    color: #ff3e00;
    font-weight: 600;
}

.usage-example pre {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin-bottom: 1rem;
}

.usage-example code {
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
}

/* ===== OData / Microsoft Graph demo ===== */

.odata-demo {
    background: linear-gradient(180deg, #f3f0ff 0%, #ede9fe 100%);
    border-left: 4px solid #7c3aed;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 2.5rem 0 1.5rem;
}

.odata-demo h2 {
    margin-top: 0;
    color: #5b21b6;
}

.odata-intro {
    margin: 0 0 1.5rem;
    color: #4b3a78;
    line-height: 1.6;
    font-size: 0.95rem;
}

.odata-intro a {
    color: #7c3aed;
    text-decoration: underline;
}

.odata-intro code {
    background: white;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    color: #5b21b6;
    font-family: 'Courier New', monospace;
    font-size: 0.88em;
}

.odata-builder {
    background: white;
    border-radius: 6px;
    padding: 1.25rem;
    margin-bottom: 1rem;
}

.odata-builder h3 {
    margin-top: 0;
    color: #5b21b6;
    font-size: 1.05rem;
}

.odata-hint {
    margin: 0 0 1rem;
    font-size: 0.88rem;
    color: #6b5f88;
}

.odata-hint code {
    background: #f5f3ff;
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
    color: #5b21b6;
}

.odata-field {
    margin-bottom: 1rem;
    flex: 1;
}

.odata-field label,
.odata-field .odata-field-label {
    display: block;
    font-weight: 600;
    font-size: 0.85rem;
    color: #4b3a78;
    margin-bottom: 0.35rem;
}

.odata-field input[type="text"],
.odata-field input[type="number"],
.odata-field select {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem 0.65rem;
    border: 1px solid #d8d0f0;
    border-radius: 4px;
    font-size: 0.9rem;
    font-family: 'Courier New', monospace;
    background: white;
}

.odata-field input[type="text"]:focus,
.odata-field input[type="number"]:focus,
.odata-field select:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
}

.odata-row {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
}

.odata-field-narrow {
    flex: 0 1 8rem;
}

.odata-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}

.odata-chip {
    padding: 0.35rem 0.7rem;
    border: 1px solid #d8d0f0;
    background: white;
    color: #6b5f88;
    border-radius: 999px;
    font-size: 0.82rem;
    font-family: 'Courier New', monospace;
    cursor: pointer;
    transition: all 0.15s;
}

.odata-chip:hover {
    border-color: #7c3aed;
    color: #5b21b6;
}

.odata-chip.active {
    background: #7c3aed;
    color: white;
    border-color: #7c3aed;
}

.odata-checkbox-row {
    background: #f5f3ff;
    border: 1px dashed #d8d0f0;
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    margin-top: 0;
}

.odata-checkbox {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.85rem;
    color: #4b3a78;
    cursor: pointer;
    margin: 0;
    font-weight: 400;
}

.odata-checkbox input {
    margin: 0;
    width: 1rem;
    height: 1rem;
    accent-color: #7c3aed;
    flex-shrink: 0;
}

.odata-checkbox code {
    background: white;
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
    color: #5b21b6;
    font-family: 'Courier New', monospace;
    font-size: 0.88em;
}

.odata-actions {
    display: flex;
    gap: 0.6rem;
    margin-top: 1rem;
}

.btn-apply {
    background: #7c3aed;
    color: white;
    border: none;
    padding: 0.55rem 1.2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
}

.btn-apply:hover {
    background: #6d28d9;
}

.btn-clear-odata {
    background: white;
    color: #5b21b6;
    border: 1px solid #d8d0f0;
    padding: 0.55rem 1.2rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.btn-clear-odata:hover {
    background: #f5f3ff;
}

.odata-panels {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.odata-panel {
    background: white;
    border-radius: 6px;
    padding: 0.9rem 1rem;
}

.odata-panel h4 {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    color: #5b21b6;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.odata-string {
    background: #1f1432;
    color: #e9d5ff;
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0;
    font-size: 0.78rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.odata-panel-note {
    margin: 0.5rem 0 0;
    font-size: 0.78rem;
    color: #6b5f88;
    font-style: italic;
}

.odata-panel-note code {
    background: #f5f3ff;
    padding: 0.05rem 0.3rem;
    border-radius: 3px;
    color: #5b21b6;
    font-family: 'Courier New', monospace;
    font-style: normal;
}

.odata-code {
    background: white;
    border-radius: 6px;
    padding: 1rem 1.25rem;
}

.odata-code h3 {
    margin-top: 0;
    color: #5b21b6;
    font-size: 1rem;
}

.odata-code pre {
    background: #1f1432;
    color: #e9d5ff;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5rem 0 0;
    font-size: 0.78rem;
}
</style>
