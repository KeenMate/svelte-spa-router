<script>
import { link } from '@keenmate/svelte-spa-router'
import { routeContext, routeTitle, routeBreadcrumbs } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import Breadcrumbs from '../components/Breadcrumbs.svelte'

const context = $derived(routeContext())
const title = $derived(routeTitle())
const breadcrumbs = $derived(routeBreadcrumbs())
</script>

<div class="route-context-target">
    <Breadcrumbs />

    <h1>Route Context Target Page</h1>

    <p class="subtitle">
        You navigated here from the <a href="/route-context-demo" use:link>Route Context Demo</a>.
        This page has its own <code>routeContext</code> defined via <code>wrap()</code> &mdash; see the values below.
    </p>

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

    <div class="context-highlight">
        <h3>Custom Fields on This Route</h3>
        <table>
            <tbody>
                <tr>
                    <td><code>section</code></td>
                    <td>{context.section ?? '(not set)'}</td>
                </tr>
                <tr>
                    <td><code>pageType</code></td>
                    <td>{context.pageType ?? '(not set)'}</td>
                </tr>
                <tr>
                    <td><code>showSidebar</code></td>
                    <td>{String(context.showSidebar ?? '(not set)')}</td>
                </tr>
                <tr>
                    <td><code>maxItems</code></td>
                    <td>{context.maxItems ?? '(not set)'}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <a href="/route-context-demo" use:link class="back-link">
        Back to Route Context Demo
    </a>
</div>

<style>
.route-context-target {
    max-width: 1000px;
}

h1 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #4b5563;
    line-height: 1.6;
    margin-bottom: 2rem;
}

.subtitle code {
    background: rgba(0,0,0,0.06);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

.subtitle a {
    color: #7c3aed;
    font-weight: 500;
}

.output-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
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

.context-highlight {
    background: white;
    padding: 1.5rem 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-left: 4px solid #7c3aed;
    margin-bottom: 2rem;
}

.context-highlight h3 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
}

.context-highlight table {
    width: 100%;
    border-collapse: collapse;
}

.context-highlight td {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.context-highlight td:first-child {
    width: 160px;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #7c3aed;
}

.context-highlight td:first-child code {
    background: none;
    padding: 0;
    color: inherit;
}

.context-highlight tr:last-child td {
    border-bottom: none;
}

.back-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #7c3aed;
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.2s;
}

.back-link:hover {
    background: #6d28d9;
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
