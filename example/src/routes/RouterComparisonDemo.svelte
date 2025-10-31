<script>
import { link, location, querystring, routeParams } from '@keenmate/svelte-spa-router/utils'

const loc = $derived(location())
const qs = $derived(querystring())
const params = $derived(routeParams())

</script>

<div class="comparison-demo">
    <h1>Router vs Router2 Comparison</h1>

    <div class="info-box">
        <h2>What's the difference?</h2>
        <p>This page demonstrates both Router implementations:</p>
        <ul>
            <li><strong>Router.svelte:</strong> Original implementation with 433-line $effect</li>
            <li><strong>Router2.svelte:</strong> Simplified implementation with cleaner separation of concerns</li>
        </ul>
        <p>Both should behave identically. Try navigating around and checking the console to see the differences.</p>
    </div>

    <div class="state-display">
        <h3>Current State</h3>
        <dl>
            <dt>Location:</dt>
            <dd><code>{loc}</code></dd>

            <dt>Querystring:</dt>
            <dd><code>{qs || '(none)'}</code></dd>

            <dt>Route Params:</dt>
            <dd><code>{params ? JSON.stringify(params) : '(none)'}</code></dd>
        </dl>
    </div>

    <div class="test-links">
        <h3>Test Navigation</h3>
        <div class="links-grid">
            <a href="/" use:link>Home</a>
            <a href="/about" use:link>About</a>
            <a href="/user/john/doe" use:link>User (with params)</a>
            <a href="/book/chapter-1" use:link>Book (wildcard)</a>
            <a href="/querystring-demo?foo=bar&baz=qux" use:link>With Querystring</a>
            <a href="/does-not-exist" use:link>Not Found</a>
        </div>
    </div>

    <div class="architecture-comparison">
        <h3>Architecture Differences</h3>

        <div class="comparison-grid">
            <div class="comparison-card">
                <h4>Router.svelte (Original)</h4>
                <ul>
                    <li>433-line $effect with complex logic</li>
                    <li>Mixes state management + rendering</li>
                    <li>Uses untrack() extensively (20+ times)</li>
                    <li>Race condition handling with lastLoc</li>
                    <li>Referrer injection in effect</li>
                    <li>Handles zones, breadcrumbs, metadata</li>
                    <li>Scroll restoration built-in</li>
                </ul>
            </div>

            <div class="comparison-card highlight">
                <h4>Router2.svelte (Simplified)</h4>
                <ul>
                    <li>~270 lines total (37% smaller)</li>
                    <li>Pure view component (reads state only)</li>
                    <li>No untrack() needed!</li>
                    <li>Race condition handling with loadingId</li>
                    <li>Clean separation: state in utils.svelte.js</li>
                    <li>Core routing only (extensible)</li>
                    <li>One effect per concern</li>
                </ul>
            </div>
        </div>
    </div>

    <div class="code-example">
        <h3>Key Architectural Difference</h3>

        <div class="code-block">
            <h4>Router.svelte - Effect that READS and WRITES</h4>
            <pre><code>$effect(() => {'{'}<br/>
    const newLoc = {'{'}<br/>
        location: location(),<br/>
        querystring: querystring()<br/>
    {'}'}<br/>
<br/>
    // ❌ Writes to state (causes complexity)<br/>
    untrack(() => setNavigationContext(...))<br/>
    untrack(() => setZoneComponents(...))<br/>
<br/>
    // Complex async block with 400+ lines<br/>
    await loadRoute()<br/>
    await checkConditions()<br/>
    // ... more side effects<br/>
{'}'})<br/>
</code></pre>
        </div>

        <div class="code-block highlight">
            <h4>Router2.svelte - Effect that only READS</h4>
            <pre><code>$effect(() => {'{'}<br/>
    const loc = location()<br/>
    const qs = querystring()<br/>
<br/>
    // ✅ Pure function, no side effects<br/>
    const match = findMatchingRoute(loc)<br/>
<br/>
    // ✅ Delegate to separate async handler<br/>
    if (match) {'{'}<br/>
        loadRoute(match, qs)<br/>
    {'}'}<br/>
{'}'})<br/>
<br/>
// Separate function (not reactive)<br/>
async function loadRoute(match, qs) {'{'}<br/>
    // All async logic here<br/>
    // No untrack() needed!<br/>
{'}'}</code></pre>
        </div>
    </div>
</div>

<style>
    .comparison-demo {
        max-width: 1000px;
        margin: 0 auto;
    }

    h1 {
        color: #2563eb;
        margin-bottom: 1rem;
    }

    h2, h3, h4 {
        color: #1e40af;
    }

    .info-box {
        background: #eff6ff;
        border: 2px solid #2563eb;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 2rem 0;
    }

    .info-box ul {
        margin: 1rem 0;
    }

    .state-display {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 2rem 0;
    }

    dl {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 0.5rem;
        margin: 1rem 0;
    }

    dt {
        font-weight: 600;
        color: #374151;
    }

    dd {
        margin: 0;
    }

    code {
        background: white;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        color: #2563eb;
    }

    .test-links {
        margin: 2rem 0;
    }

    .links-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .links-grid a {
        display: block;
        padding: 1rem;
        background: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        text-align: center;
        transition: background 0.2s;
    }

    .links-grid a:hover {
        background: #1e40af;
    }

    .architecture-comparison {
        margin: 3rem 0;
    }

    .comparison-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-top: 1rem;
    }

    .comparison-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .comparison-card.highlight {
        border-color: #10b981;
        background: #f0fdf4;
    }

    .comparison-card h4 {
        margin-top: 0;
        margin-bottom: 1rem;
    }

    .comparison-card ul {
        margin: 0;
        padding-left: 1.5rem;
    }

    .comparison-card li {
        margin: 0.5rem 0;
        line-height: 1.6;
    }

    .code-example {
        margin: 3rem 0;
    }

    .code-block {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }

    .code-block.highlight {
        border-color: #10b981;
        background: #f0fdf4;
    }

    .code-block h4 {
        margin-top: 0;
        margin-bottom: 0.5rem;
    }

    pre {
        margin: 0;
        overflow-x: auto;
    }

    pre code {
        display: block;
        background: transparent;
        padding: 1rem;
        color: #1f2937;
        line-height: 1.6;
        font-size: 0.9rem;
    }

    @media (max-width: 768px) {
        .comparison-grid {
            grid-template-columns: 1fr;
        }

        dl {
            grid-template-columns: 1fr;
        }
    }
</style>
