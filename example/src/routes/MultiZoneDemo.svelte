<script>
import { link } from '../../../src/lib/utils.svelte.js'
import active from '../../../src/lib/active.svelte.js'
</script>

<div class="multi-zone-demo">
    <h1>Multi-Zone Routing Demo</h1>

    <div class="intro">
        <p>
            Multi-zone routing allows you to load different components into multiple areas
            of your layout based on the current route.
        </p>
        <p>
            Try navigating to see the sidebar (menu), main content, and side panel (toolbar)
            all update independently with zone-specific components for each category.
        </p>
    </div>

    <div class="demo-controls">
        <h2>Try It Out</h2>

        <div class="category-cards">
            <a href="/products" use:link class="category-card products">
                <div class="card-icon">📦</div>
                <h3>Products</h3>
                <p>Browse product catalog with filters and tools</p>
                <div class="card-footer">View Products →</div>
            </a>

            <a href="/users" use:link class="category-card users">
                <div class="card-icon">👥</div>
                <h3>Users</h3>
                <p>Manage users with roles and permissions</p>
                <div class="card-footer">View Users →</div>
            </a>

            <a href="/orders" use:link class="category-card orders">
                <div class="card-icon">📋</div>
                <h3>Orders</h3>
                <p>Track and manage customer orders</p>
                <div class="card-footer">View Orders →</div>
            </a>
        </div>
    </div>

    <div class="code-example">
        <h2>How It Works</h2>
        <h3>1. Define Zone-Based Routes</h3>
        <pre><code>{`import { wrap } from '@keenmate/svelte-spa-router/wrap'

const routes = {
    '/product-zones/:productId': wrap({
        zones: {
            'sidebar': ProductSidebar,
            'main': ProductMain,
            'panel': ProductPanel
        }
    })
}`}</code></pre>

        <h3>2. Setup Multiple Router Instances</h3>
        <pre><code>{`<div class="layout">
    <aside>
        <Router {routes} zone="sidebar" />
    </aside>
    <main>
        <Router {routes} zone="main" />
    </main>
    <aside>
        <Router {routes} zone="panel" />
    </aside>
</div>`}</code></pre>

        <h3>3. Zone Components Receive Props</h3>
        <pre><code>{`<!-- ProductSidebar.svelte -->
<script>
let { params = {} } = $props()
</script>

<div>
    <h3>Product {params.productId}</h3>
    <!-- sidebar content -->
</div>`}</code></pre>
    </div>

    <div class="features">
        <h2>Features</h2>
        <ul>
            <li>✅ Load different components into multiple zones per route</li>
            <li>✅ All zones share the same route params and querystring</li>
            <li>✅ Supports async component loading with code-splitting</li>
            <li>✅ Works with route guards and conditions</li>
            <li>✅ Fully TypeScript supported</li>
            <li>✅ Mix single-component and multi-zone routes</li>
        </ul>
    </div>
</div>

<style>
.multi-zone-demo {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
}

h1 {
    color: #1a1a1a;
    margin-bottom: 1rem;
}

.intro {
    background: #f0f7ff;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border-left: 4px solid #0066cc;
}

.intro p {
    margin: 0.5rem 0;
    line-height: 1.6;
}

.demo-controls {
    background: #fff;
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.demo-controls h2 {
    margin-top: 0;
    color: #333;
    margin-bottom: 1.5rem;
}

.category-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.category-card {
    display: flex;
    flex-direction: column;
    padding: 2rem;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s;
    cursor: pointer;
}

.category-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.category-card.products {
    border-color: #0066cc;
}

.category-card.products:hover {
    background: #f0f7ff;
    border-color: #0052a3;
}

.category-card.users {
    border-color: #7c3aed;
}

.category-card.users:hover {
    background: #f3e8ff;
    border-color: #6d28d9;
}

.category-card.orders {
    border-color: #f97316;
}

.category-card.orders:hover {
    background: #ffedd5;
    border-color: #ea580c;
}

.card-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.category-card h3 {
    margin: 0 0 0.5rem 0;
    color: #1a1a1a;
    font-size: 1.3rem;
}

.category-card p {
    margin: 0;
    color: #666;
    font-size: 0.95rem;
    line-height: 1.5;
    flex: 1;
}

.card-footer {
    margin-top: 1.5rem;
    font-weight: 600;
    font-size: 0.95rem;
}

.category-card.products .card-footer {
    color: #0066cc;
}

.category-card.users .card-footer {
    color: #7c3aed;
}

.category-card.orders .card-footer {
    color: #f97316;
}

.code-example {
    margin-bottom: 2rem;
}

.code-example h2 {
    color: #333;
    margin-bottom: 1rem;
}

.code-example h3 {
    color: #555;
    font-size: 1.1rem;
    margin: 1.5rem 0 0.5rem;
}

.code-example pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.5rem 0;
}

.code-example code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
}

.features {
    background: #f9f9f9;
    padding: 1.5rem;
    border-radius: 8px;
}

.features h2 {
    margin-top: 0;
    color: #333;
}

.features ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.features li {
    padding: 0.5rem 0;
    font-size: 1rem;
}

@media (max-width: 768px) {
    .multi-zone-demo {
        padding: 1rem;
    }

    .control-group {
        flex-direction: column;
        align-items: stretch;
    }

    .control-group select,
    .control-group button {
        width: 100%;
    }
}
</style>
