<script>
/**
 * Navigation Context Demo
 * Demonstrates passing context data during navigation without URL parameters
 * This enables "WinForms-like" experiences where you pass rich objects between views
 */

import { push, navigationContext } from '@keenmate/svelte-spa-router'

// Get context if navigated here with data
const ctx = $derived(navigationContext())

// Sample data for demonstration
let orders = $state([
    { id: 1, customer: 'John Doe', total: 299.99, status: 'Pending', items: 5 },
    { id: 2, customer: 'Jane Smith', total: 459.50, status: 'Shipped', items: 3 },
    { id: 3, customer: 'Bob Johnson', total: 125.00, status: 'Delivered', items: 2 },
    { id: 4, customer: 'Alice Brown', total: 875.25, status: 'Pending', items: 8 },
])

function viewOrder(order) {
    // Navigate with context - no URL parameters needed!
    // push(route, routeParams, queryString, navigationContext)
    push('/navigation-context-demo', {}, {}, {
        mode: 'view',
        order: order,
        timestamp: new Date().toISOString()
    })
}

function editOrder(order) {
    // Navigate with context for editing
    // push(route, routeParams, queryString, navigationContext)
    push('/navigation-context-demo', {}, {}, {
        mode: 'edit',
        order: order,
        canDelete: true
    })
}

function backToList() {
    // Navigate back to the list view (clears context)
    push('/navigation-context-demo')
}

function saveOrder() {
    if (ctx && ctx.mode === 'edit') {
        alert(`Order #${ctx.order.id} saved!`)
        backToList()
    }
}

function deleteOrder() {
    if (ctx && ctx.order) {
        const confirmed = confirm(`Delete order #${ctx.order.id}?`)
        if (confirmed) {
            orders = orders.filter(o => o.id !== ctx.order.id)
            backToList()
        }
    }
}
</script>

<div class="context-demo">
    <h1>📦 Navigation Context Demo</h1>

    <div class="intro">
        <p>
            <strong>Navigation Context</strong> allows you to pass data during navigation without adding it to the URL.
            This is perfect for:
        </p>
        <ul>
            <li><strong>WinForms-like experiences:</strong> Pass rich objects between views</li>
            <li><strong>Internal navigation:</strong> Data that shouldn't be in the URL</li>
            <li><strong>Temporary state:</strong> Data that doesn't need to be bookmarkable</li>
            <li><strong>Complex objects:</strong> Nested data, functions, or large payloads</li>
        </ul>
    </div>

    {#if !ctx}
        <!-- List View -->
        <div class="list-view">
            <h2>Order List</h2>
            <p class="hint">Click any order to view or edit with context data</p>

            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each orders as order}
                        <tr>
                            <td>#{order.id}</td>
                            <td>{order.customer}</td>
                            <td>{order.items}</td>
                            <td>${order.total.toFixed(2)}</td>
                            <td>
                                <span class="status status-{order.status.toLowerCase()}">
                                    {order.status}
                                </span>
                            </td>
                            <td>
                                <button onclick={() => viewOrder(order)} class="btn-view">
                                    View
                                </button>
                                <button onclick={() => editOrder(order)} class="btn-edit">
                                    Edit
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            <div class="code-example">
                <h3>How It Works</h3>
                <pre><code>{`import { push, navigationContext } from '@keenmate/svelte-spa-router'

// Pass context when navigating (4-parameter signature)
function viewOrder(order) {
    // push(route, routeParams, queryString, navigationContext)
    push('/navigation-context-demo', &#123;&#125;, &#123;&#125;, {
        mode: 'view',
        order: order,
        timestamp: new Date().toISOString()
    })
}

// Retrieve context in the route component
const ctx = $derived(navigationContext())

if (ctx) {
    console.log('Mode:', ctx.mode)        // 'view'
    console.log('Order:', ctx.order)      // { id: 1, customer: '...', ... }
    console.log('Time:', ctx.timestamp)   // '2024-...'
}`}</code></pre>
            </div>
        </div>
    {:else if ctx.mode === 'view'}
        <!-- View Mode -->
        <div class="detail-view">
            <div class="header">
                <h2>📋 Order #{ctx.order.id} - View Mode</h2>
                <button onclick={backToList} class="btn-back">← Back to List</button>
            </div>

            <div class="context-badge">
                <strong>Context Received:</strong>
                <pre><code>{JSON.stringify(ctx, null, 2)}</code></pre>
            </div>

            <div class="order-details">
                <div class="detail-row">
                    <label>Customer:</label>
                    <span>{ctx.order.customer}</span>
                </div>
                <div class="detail-row">
                    <label>Items:</label>
                    <span>{ctx.order.items}</span>
                </div>
                <div class="detail-row">
                    <label>Total:</label>
                    <span>${ctx.order.total.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <label>Status:</label>
                    <span class="status status-{ctx.order.status.toLowerCase()}">
                        {ctx.order.status}
                    </span>
                </div>
                <div class="detail-row">
                    <label>Loaded At:</label>
                    <span>{new Date(ctx.timestamp).toLocaleString()}</span>
                </div>
            </div>

            <div class="note">
                <strong>Note:</strong> The order data came from context, not from the URL.
                Notice the URL is just <code>/navigation-context-demo</code> - no query parameters!
            </div>
        </div>
    {:else if ctx.mode === 'edit'}
        <!-- Edit Mode -->
        <div class="detail-view">
            <div class="header">
                <h2>✏️ Order #{ctx.order.id} - Edit Mode</h2>
                <button onclick={backToList} class="btn-back">← Back to List</button>
            </div>

            <div class="context-badge">
                <strong>Context Received:</strong>
                <pre><code>{JSON.stringify(ctx, null, 2)}</code></pre>
            </div>

            <div class="order-form">
                <div class="form-row">
                    <label>Customer:</label>
                    <input type="text" value={ctx.order.customer} />
                </div>
                <div class="form-row">
                    <label>Items:</label>
                    <input type="number" value={ctx.order.items} />
                </div>
                <div class="form-row">
                    <label>Total:</label>
                    <input type="number" step="0.01" value={ctx.order.total} />
                </div>
                <div class="form-row">
                    <label>Status:</label>
                    <select value={ctx.order.status}>
                        <option>Pending</option>
                        <option>Shipped</option>
                        <option>Delivered</option>
                    </select>
                </div>

                <div class="actions">
                    <button onclick={saveOrder} class="btn-save">💾 Save Changes</button>
                    {#if ctx.canDelete}
                        <button onclick={deleteOrder} class="btn-delete">🗑️ Delete Order</button>
                    {/if}
                </div>
            </div>

            <div class="note">
                <strong>Permission Check:</strong> The <code>canDelete</code> permission came from context!
                {#if ctx.canDelete}
                    <span class="allowed">✅ Delete allowed</span>
                {:else}
                    <span class="denied">❌ Delete denied</span>
                {/if}
            </div>
        </div>
    {/if}

    <div class="benefits">
        <h2>Benefits of Navigation Context</h2>
        <div class="benefit-grid">
            <div class="benefit">
                <h3>🔒 Privacy</h3>
                <p>Sensitive data doesn't appear in the URL or browser history</p>
            </div>
            <div class="benefit">
                <h3>🎯 Simplicity</h3>
                <p>No need to serialize/deserialize complex objects</p>
            </div>
            <div class="benefit">
                <h3>⚡ Performance</h3>
                <p>Pass large objects without URL length limits</p>
            </div>
            <div class="benefit">
                <h3>🔄 State Management</h3>
                <p>Works with browser back/forward buttons</p>
            </div>
        </div>
    </div>

    <div class="comparison">
        <h2>Navigation Context vs URL Parameters</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>URL Parameters</th>
                    <th>Navigation Context</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Bookmarkable</td>
                    <td>✅ Yes</td>
                    <td>❌ No</td>
                </tr>
                <tr>
                    <td>Shareable</td>
                    <td>✅ Yes</td>
                    <td>❌ No</td>
                </tr>
                <tr>
                    <td>Complex Objects</td>
                    <td>❌ Limited</td>
                    <td>✅ Full support</td>
                </tr>
                <tr>
                    <td>Privacy</td>
                    <td>❌ Visible in URL</td>
                    <td>✅ Not in URL</td>
                </tr>
                <tr>
                    <td>Back Button</td>
                    <td>✅ Works</td>
                    <td>✅ Works</td>
                </tr>
                <tr>
                    <td>Page Reload</td>
                    <td>✅ Persists</td>
                    <td>❌ Lost</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
.navigation-context-demo {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
}

h1 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

.intro {
    background: #e3f2fd;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #2196f3;
    margin-bottom: 2rem;
}

.intro p {
    margin: 0 0 1rem 0;
    line-height: 1.6;
}

.intro ul {
    margin: 0;
    padding-left: 1.5rem;
}

.intro li {
    margin: 0.5rem 0;
}

.hint {
    color: #666;
    font-style: italic;
    margin-bottom: 1rem;
}

.orders-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.orders-table th,
.orders-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.orders-table th {
    background: #2563eb;
    color: white;
    font-weight: 600;
}

.orders-table tbody tr:hover {
    background: #f5f5f5;
}

.status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
}

.status-pending {
    background: #fff3cd;
    color: #856404;
}

.status-shipped {
    background: #d1ecf1;
    color: #0c5460;
}

.status-delivered {
    background: #d4edda;
    color: #155724;
}

.btn-view,
.btn-edit {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-right: 0.5rem;
}

.btn-view {
    background: #2196f3;
    color: white;
}

.btn-view:hover {
    background: #1976d2;
}

.btn-edit {
    background: #ff9800;
    color: white;
}

.btn-edit:hover {
    background: #f57c00;
}

.code-example {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.code-example h3 {
    margin-top: 0;
    color: #667eea;
}

pre {
    background: #2c3e50;
    color: #ecf0f1;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.5rem 0;
}

code {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
}

.detail-view {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.header h2 {
    margin: 0;
    color: #2c3e50;
}

.btn-back {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}

.btn-back:hover {
    background: #5a6268;
}

.context-badge {
    background: #f0f4ff;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #667eea;
    margin-bottom: 1.5rem;
}

.context-badge strong {
    display: block;
    margin-bottom: 0.5rem;
    color: #667eea;
}

.context-badge pre {
    margin: 0;
    background: #2c3e50;
    padding: 1rem;
}

.order-details,
.order-form {
    margin-bottom: 1.5rem;
}

.detail-row,
.form-row {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: center;
}

.detail-row label,
.form-row label {
    font-weight: 600;
    color: #666;
}

.form-row input,
.form-row select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 1rem;
}

.btn-save,
.btn-delete {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    font-weight: 600;
}

.btn-save {
    background: #28a745;
    color: white;
}

.btn-save:hover {
    background: #218838;
}

.btn-delete {
    background: #dc3545;
    color: white;
}

.btn-delete:hover {
    background: #c82333;
}

.note {
    background: #fff3cd;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #ffc107;
}

.note strong {
    display: block;
    margin-bottom: 0.5rem;
}

.note code {
    background: rgba(0,0,0,0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
}

.allowed {
    color: #28a745;
    font-weight: 600;
}

.denied {
    color: #dc3545;
    font-weight: 600;
}

.benefits {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.benefits h2 {
    margin-top: 0;
    color: #2c3e50;
}

.benefit-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}

.benefit {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 6px;
}

.benefit h3 {
    margin: 0 0 0.5rem 0;
    color: #667eea;
}

.benefit p {
    margin: 0;
    color: #666;
    line-height: 1.6;
}

.comparison {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.comparison h2 {
    margin-top: 0;
    color: #2c3e50;
}

.comparison table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.comparison th,
.comparison td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.comparison th {
    background: #f8f9fa;
    font-weight: 600;
}

.comparison tbody tr:hover {
    background: #f8f9fa;
}
</style>
