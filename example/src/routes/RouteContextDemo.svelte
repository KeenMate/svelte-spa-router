<script>
import { link } from '@keenmate/svelte-spa-router'
import { routeContext, routeTitle, routeBreadcrumbs } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import Breadcrumbs from '../components/Breadcrumbs.svelte'

const context = $derived(routeContext())
const title = $derived(routeTitle())
const breadcrumbs = $derived(routeBreadcrumbs())
</script>

<div class="route-context-demo">
    <Breadcrumbs />

    <h1>routeContext() Demo</h1>

    <div class="intro">
        <p>
            <strong>routeContext()</strong> gives you reactive access to the full metadata bag attached to the
            current route via <code>wrap()</code>, <code>createRoute()</code>, or <code>defineRoutes()</code>.
            It contains <code>title</code>, <code>breadcrumbs</code>, <code>permissions</code>, and any
            custom fields you add.
        </p>
    </div>

    <!-- Section 1: Live Output -->
    <div class="section">
        <h2>Live Output for This Page</h2>
        <p>These values update reactively as you navigate between routes.</p>

        <div class="output-grid">
            <div class="output-card">
                <h4>routeTitle()</h4>
                <pre><code>{JSON.stringify(title, null, 2)}</code></pre>
            </div>

            <div class="output-card">
                <h4>routeBreadcrumbs()</h4>
                <pre><code>{JSON.stringify(breadcrumbs, null, 2)}</code></pre>
            </div>

            <div class="output-card full-width">
                <h4>routeContext()</h4>
                <pre><code>{JSON.stringify(context, null, 2)}</code></pre>
            </div>
        </div>

        <div class="note">
            Notice how <code>routeContext()</code> includes <strong>title</strong>, <strong>breadcrumbs</strong>,
            and the custom fields (<code>section</code>, <code>customField</code>, <code>featureFlag</code>)
            defined in the route's <code>wrap()</code> call.
        </div>
    </div>

    <!-- Navigate to target page -->
    <div class="section target-section">
        <h2>See It on Another Page</h2>
        <p>
            Navigate to a second page that has <strong>different</strong> <code>routeContext</code> values.
            The target page reads and displays its own context &mdash; proving the values change per-route.
        </p>
        <a href="/route-context-target" use:link class="target-button">
            Go to Target Page
        </a>
        <div class="target-preview">
            <span class="target-preview-label">Target route defines:</span>
            <code>{`{ section: "examples", pageType: "target", showSidebar: false, maxItems: 25 }`}</code>
        </div>
    </div>

    <!-- Section 2: How to Set routeContext -->
    <div class="section">
        <h2>How to Set routeContext</h2>
        <p>You can attach custom metadata to any route. Here are the three ways:</p>

        <h4>Using wrap()</h4>
        <div class="code-block">
            <pre><code>{`'/my-route': wrap({
    component: MyComponent,
    title: 'My Page',
    breadcrumbs: [{ label: 'Home', path: '/' }, { label: 'My Page' }],
    routeContext: {
        section: 'demos',
        customField: 'Hello!',
        featureFlag: true
    }
})`}</code></pre>
        </div>

        <h4>Using createRoute()</h4>
        <div class="code-block">
            <pre><code>{`import { createRoute } from '@keenmate/svelte-spa-router/wrap'

'/my-route': createRoute({
    component: MyComponent,
    title: 'My Page',
    routeContext: { section: 'admin', priority: 1 }
})`}</code></pre>
        </div>

        <h4>Using defineRoutes()</h4>
        <div class="code-block">
            <pre><code>{`import { defineRoutes } from '@keenmate/svelte-spa-router/routes'

const { routes, nav } = defineRoutes({
    myRoute: {
        path: '/my-route',
        component: MyComponent,
        title: 'My Page',
        routeContext: { section: 'admin' }
    }
})`}</code></pre>
        </div>
    </div>

    <!-- Section 3: Try Other Routes -->
    <div class="section">
        <h2>Try Other Routes</h2>
        <p>Navigate to these routes and use the browser console or come back here to see how <code>routeContext()</code> changes:</p>

        <div class="demo-links">
            <a href="/document/1" use:link class="demo-link blue-link">
                <div class="link-title">Document Detail</div>
                <div class="link-desc">Has title, breadcrumbs, and permissions</div>
            </a>
            <a href="/product/1" use:link class="demo-link green-link">
                <div class="link-title">Product Detail</div>
                <div class="link-desc">Has title and breadcrumbs (no permissions)</div>
            </a>
            <a href="/admin" use:link class="demo-link orange-link">
                <div class="link-title">Admin Panel</div>
                <div class="link-desc">Protected route with permissions</div>
            </a>
            <a href="/about" use:link class="demo-link gray-link">
                <div class="link-title">About</div>
                <div class="link-desc">Plain route &mdash; routeContext() returns {'{}'}</div>
            </a>
        </div>
    </div>

    <!-- Section 4: Import Reference -->
    <div class="section">
        <h2>Import Reference</h2>
        <div class="code-block">
            <pre><code>{`import {
    routeContext,      // Full metadata object
    routeTitle,        // Just the title string
    routeBreadcrumbs   // Just the breadcrumbs array
} from '@keenmate/svelte-spa-router/helpers/route-metadata'

// Usage in a Svelte 5 component
const context = $derived(routeContext())
const title = $derived(routeTitle())
const crumbs = $derived(routeBreadcrumbs())

// Access custom fields
const section = $derived(context.section)
const flag = $derived(context.featureFlag)`}</code></pre>
        </div>

        <div class="note">
            <strong>Important:</strong> These are reactive functions, not stores!
            Use <code>$derived()</code> to track changes &mdash; do NOT use <code>$routeContext</code> store syntax.
        </div>
    </div>
</div>

<style>
.route-context-demo {
    max-width: 1000px;
}

h1 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

h2 {
    color: #2c3e50;
    margin-top: 0;
}

.intro {
    background: #fdf4ff;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #a855f7;
    margin-bottom: 2rem;
}

.intro p {
    margin: 0;
    line-height: 1.6;
}

.intro code {
    background: rgba(0,0,0,0.08);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.section {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.section p {
    line-height: 1.6;
    color: #444;
}

.section code {
    background: rgba(0,0,0,0.06);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.section h4 {
    margin: 1.5rem 0 0.5rem 0;
    color: #374151;
    font-size: 1.125rem;
}

.output-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
}

.output-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 1rem;
}

.output-card.full-width {
    grid-column: 1 / -1;
}

.output-card h4 {
    margin: 0 0 0.75rem 0;
    color: #6b21a8;
    font-size: 0.95rem;
    font-family: 'Courier New', monospace;
}

.output-card pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0;
    line-height: 1.5;
}

.output-card code {
    background: none;
    padding: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: inherit;
}

.code-block pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1.25rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 0.5rem 0 0 0;
    line-height: 1.5;
}

.code-block code {
    background: none;
    padding: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: inherit;
}

.note {
    background: #fff3cd;
    padding: 1rem 1.25rem;
    border-radius: 6px;
    border-left: 4px solid #ffc107;
    margin-top: 1rem;
    line-height: 1.6;
}

.note strong {
    color: #856404;
}

.note code {
    background: rgba(0,0,0,0.08);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
}

.demo-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.demo-link {
    display: block;
    padding: 1.25rem;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    text-decoration: none;
    transition: all 0.2s;
}

.demo-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.blue-link {
    background: #eff6ff;
    border-color: #bfdbfe;
}

.blue-link:hover {
    background: #dbeafe;
    border-color: #3b82f6;
}

.green-link {
    background: #f0fdf4;
    border-color: #bbf7d0;
}

.green-link:hover {
    background: #dcfce7;
    border-color: #10b981;
}

.orange-link {
    background: #fff7ed;
    border-color: #fed7aa;
}

.orange-link:hover {
    background: #ffedd5;
    border-color: #f97316;
}

.gray-link {
    background: #f9fafb;
    border-color: #e5e7eb;
}

.gray-link:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.link-title {
    font-weight: 600;
    color: #111827;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
}

.link-desc {
    color: #6b7280;
    font-size: 0.875rem;
}

.target-section {
    border-left: 4px solid #7c3aed;
}

.target-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #7c3aed;
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.1rem;
    transition: background 0.2s;
}

.target-button:hover {
    background: #6d28d9;
}

.target-preview {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: #f5f3ff;
    border-radius: 6px;
    border: 1px solid #ddd6fe;
    font-size: 0.9rem;
}

.target-preview-label {
    color: #6b7280;
    margin-right: 0.5rem;
}

.target-preview code {
    color: #7c3aed;
    font-weight: 600;
    background: none;
    padding: 0;
}

@media (max-width: 600px) {
    .output-grid {
        grid-template-columns: 1fr;
    }

    .output-card.full-width {
        grid-column: auto;
    }
}
</style>
