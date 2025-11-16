<script>
/**
 * Referrer Tracking Demo
 * Demonstrates automatic referrer tracking that captures previous route information
 * Includes location, querystring, params, and route name
 */

import { push, navigationContext, location, querystring } from '@keenmate/svelte-spa-router'

// Get navigation context (includes referrer when tracking is enabled)
const ctx = $derived(navigationContext())
const referrer = $derived(ctx?.referrer)
const currentLocation = $derived(location())
const currentQuerystring = $derived(querystring())

// Log referrer information to console for debugging
// NOTE: On first navigation after referrer is updated, you may see this $effect run twice:
// 1. First log: referrer is undefined (location changed but referrer not yet injected)
// 2. Second log: referrer has correct value (navigationContext updated with referrer)
// This is expected Svelte 5 behavior and doesn't affect functionality. The UI renders
// correctly on the second run. Subsequent navigations will be smooth (single log).
$effect(() => {
    console.log('📍 Referrer Info:', {
        referrer: $state.snapshot(referrer),
        currentLocation: currentLocation,
        currentQuerystring: currentQuerystring,
        fullContext: $state.snapshot(ctx)
    })
})

// Sample navigation links
const demoPages = [
    { path: '/referrer-demo', label: 'Referrer Demo (No Query)' },
    { path: '/referrer-demo?tab=info&view=grid', label: 'Referrer Demo (With Query)' },
    { path: '/user/john/doe', label: 'User Page (With Params)' },
    { path: '/document/123', label: 'Document Detail (Protected)' },
    { path: '/about', label: 'About Page' },
    { path: '/links-demo', label: 'Links Demo' },
    { path: '/metadata-demo', label: 'Metadata Demo' },
    { path: '/invalid-route-that-does-not-exist', label: '404 Test (NotFound)' },
]

function navigateTo(path) {
    push(path)
}
</script>

<div class="referrer-demo">
    <h1>🔗 Referrer Tracking Demo</h1>

    <div class="intro">
        <p>
            <strong>Referrer Tracking</strong> automatically captures information about the previous route
            and injects it into <code>navigationContext</code>. This is useful for:
        </p>
        <ul>
            <li><strong>"Go Back" functionality:</strong> Navigate to previous route with full context</li>
            <li><strong>Analytics:</strong> Track user navigation patterns</li>
            <li><strong>Breadcrumbs:</strong> Build dynamic breadcrumb trails</li>
            <li><strong>Context-aware UIs:</strong> Show "Continue from where you left off"</li>
        </ul>

        <div class="config-info">
            <h3>⚙️ Configuration</h3>
            <p>Set referrer tracking mode in <code>main.js</code>:</p>
            <pre><code>import &#123; setIncludeReferrer &#125; from '@keenmate/svelte-spa-router'

// Options:
setIncludeReferrer('never')    // Disabled (default)
setIncludeReferrer('notfound') // Only for 404 routes
setIncludeReferrer('always')   // All routes (current mode)</code></pre>
        </div>
    </div>

    <div class="current-route">
        <h2>📍 Current Route Information</h2>
        <table class="info-table">
            <tbody>
                <tr>
                    <td class="label">Location:</td>
                    <td class="value"><code>{currentLocation}</code></td>
                </tr>
                <tr>
                    <td class="label">Querystring:</td>
                    <td class="value">
                        {#if currentQuerystring}
                            <code>{currentQuerystring}</code>
                        {:else}
                            <span class="empty">(none)</span>
                        {/if}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="referrer-info">
        <h2>🔙 Referrer Information</h2>

        {#if referrer}
            <div class="referrer-details">
                <div class="success-badge">
                    ✅ Referrer tracking is active! Here's what was captured:
                </div>

                <table class="info-table">
                    <tbody>
                        <tr>
                            <td class="label">Previous Location:</td>
                            <td class="value"><code>{referrer.location}</code></td>
                        </tr>
                        <tr>
                            <td class="label">Previous Querystring:</td>
                            <td class="value">
                                {#if referrer.querystring}
                                    <code>{referrer.querystring}</code>
                                {:else}
                                    <span class="empty">(none)</span>
                                {/if}
                            </td>
                        </tr>
                        <tr>
                            <td class="label">Previous Params:</td>
                            <td class="value">
                                {#if referrer.params && Object.keys(referrer.params).length > 0}
                                    <pre class="inline-pre">{JSON.stringify(referrer.params, null, 2)}</pre>
                                {:else}
                                    <span class="empty">(none)</span>
                                {/if}
                            </td>
                        </tr>
                        <tr>
                            <td class="label">Previous Route Name:</td>
                            <td class="value">
                                {#if referrer.routeName}
                                    <code>{referrer.routeName}</code>
                                {:else}
                                    <span class="empty">(not named)</span>
                                {/if}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="json-display">
                    <h3>Full Referrer Object:</h3>
                    <pre><code>{JSON.stringify(referrer, null, 2)}</code></pre>
                </div>

                {#if referrer.location !== '/'}
                    <button onclick={() => push(referrer.location + (referrer.querystring ? '?' + referrer.querystring : ''))} class="btn-back">
                        ← Go Back to Previous Route
                    </button>
                {/if}
            </div>
        {:else}
            <div class="no-referrer">
                <div class="info-badge">
                    ℹ️ No referrer information available yet.
                </div>
                <p>
                    This means either:
                </p>
                <ul>
                    <li>This is your first navigation after page load</li>
                    <li>Referrer tracking is disabled (<code>setIncludeReferrer('never')</code>)</li>
                    <li>You manually typed the URL or refreshed the page</li>
                </ul>
                <p>
                    <strong>Navigate to another page using the links below, then come back to see the referrer!</strong>
                </p>
            </div>
        {/if}
    </div>

    <div class="navigation-section">
        <h2>🧭 Test Navigation (URL Paths)</h2>
        <p>Click any link below to navigate using <strong>URL paths</strong>. The referrer <code>routeName</code> will be the URL.</p>

        <div class="nav-grid">
            {#each demoPages as page}
                <button
                    onclick={() => navigateTo(page.path)}
                    class="nav-button url-nav"
                    class:active={currentLocation === page.path.split('?')[0]}
                >
                    {page.label}
                </button>
            {/each}
        </div>

        <div class="nav-note">
            <strong>Note:</strong> These buttons use <code>push('/user/john/doe')</code> - URL path navigation.
            The <code>routeName</code> will be <code>"/user/john/doe"</code>.
        </div>
    </div>

    <div class="navigation-section named-routes">
        <h2>⭐ Test Navigation (Named Routes)</h2>
        <p>Click these links to navigate using <strong>named routes</strong>. The referrer <code>routeName</code> will be the route name!</p>

        <div class="nav-grid">
            <button
                onclick={() => push('userProfile', {first: 'jane', last: 'smith'})}
                class="nav-button named-nav"
            >
                User Profile (Named) → jane/smith
            </button>
            <button
                onclick={() => push('about')}
                class="nav-button named-nav"
            >
                About (Named)
            </button>
            <button
                onclick={() => push('linksDemo')}
                class="nav-button named-nav"
            >
                Links Demo (Named)
            </button>
            <button
                onclick={() => push('metadataDemo')}
                class="nav-button named-nav"
            >
                Metadata Demo (Named)
            </button>
            <button
                onclick={() => push('navigationContextDemo')}
                class="nav-button named-nav"
            >
                Nav Context Demo (Named)
            </button>
            <button
                onclick={() => push('home')}
                class="nav-button named-nav"
            >
                Home (Named)
            </button>
        </div>

        <div class="nav-note success">
            <strong>✅ Named Routes:</strong> These buttons use <code>push('userProfile', &#123;first: 'jane', last: 'smith'&#125;)</code>.
            The <code>routeName</code> will be <code>"userProfile"</code> (not a URL)!
        </div>
    </div>

    <div class="code-example">
        <h2>💻 Usage Example</h2>
        <pre><code>import &#123; navigationContext &#125; from '@keenmate/svelte-spa-router'

// Get referrer from navigation context
const ctx = $derived(navigationContext())
const referrer = $derived(ctx?.referrer)

// Check if referrer exists
if (referrer) &#123;
    console.log('Previous location:', referrer.location)
    console.log('Previous params:', referrer.params)
    console.log('Previous query:', referrer.querystring)
    console.log('Previous route name:', referrer.routeName)
&#125;

// Navigate back to previous route
function goBack() &#123;
    if (referrer?.location) &#123;
        const url = referrer.querystring
            ? `$&#123;referrer.location&#125;?$&#123;referrer.querystring&#125;`
            : referrer.location
        push(url)
    &#125;
&#125;</code></pre>
    </div>

    <div class="use-cases">
        <h2>🎯 Common Use Cases</h2>
        <div class="use-case-grid">
            <div class="use-case">
                <h3>404 Pages</h3>
                <p>Show "Go Back" button that returns to the last valid route, not just history.back()</p>
                <code>setIncludeReferrer('notfound')</code>
            </div>
            <div class="use-case">
                <h3>Breadcrumbs</h3>
                <p>Build dynamic breadcrumb trails based on actual navigation path taken by user</p>
                <code>setIncludeReferrer('always')</code>
            </div>
            <div class="use-case">
                <h3>Analytics</h3>
                <p>Track user journey: "User went from Products → Detail → Checkout"</p>
                <code>setIncludeReferrer('always')</code>
            </div>
            <div class="use-case">
                <h3>Return URLs</h3>
                <p>After login/signup, return user to where they came from with full context</p>
                <code>setIncludeReferrer('always')</code>
            </div>
        </div>
    </div>

    <div class="comparison">
        <h2>🆚 Referrer vs history.back()</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>history.back()</th>
                    <th>Referrer Tracking</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Works with replace()</td>
                    <td>❌ Broken with replace</td>
                    <td>✅ Always safe</td>
                </tr>
                <tr>
                    <td>Access to params</td>
                    <td>❌ No</td>
                    <td>✅ Full params object</td>
                </tr>
                <tr>
                    <td>Access to querystring</td>
                    <td>❌ No</td>
                    <td>✅ Full querystring</td>
                </tr>
                <tr>
                    <td>Route name</td>
                    <td>❌ No</td>
                    <td>✅ Named route support</td>
                </tr>
                <tr>
                    <td>Conditional logic</td>
                    <td>❌ Blind navigation</td>
                    <td>✅ Inspect before navigating</td>
                </tr>
                <tr>
                    <td>Fallback behavior</td>
                    <td>❌ May leave site</td>
                    <td>✅ Custom fallback (e.g., home)</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
.referrer-demo {
    max-width: 1000px;
    margin: 0 auto;
}

h1 {
    color: #2c3e50;
    margin-bottom: 1rem;
}

h2 {
    color: #2c3e50;
    margin-top: 2rem;
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

.intro code {
    background: rgba(0,0,0,0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.config-info {
    background: white;
    padding: 1rem;
    border-radius: 6px;
    margin-top: 1rem;
}

.config-info h3 {
    margin: 0 0 0.5rem 0;
    color: #667eea;
    font-size: 1rem;
}

.config-info p {
    margin: 0.5rem 0;
}

.current-route,
.referrer-info,
.navigation-section,
.code-example,
.use-cases,
.comparison {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.info-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
}

.info-table tr {
    border-bottom: 1px solid #eee;
}

.info-table td {
    padding: 0.75rem;
}

.info-table .label {
    font-weight: 600;
    color: #666;
    width: 200px;
}

.info-table .value {
    color: #2c3e50;
}

.info-table code {
    background: #f5f5f5;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: #d63384;
}

.empty {
    color: #999;
    font-style: italic;
}

.success-badge {
    background: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #28a745;
    margin-bottom: 1rem;
    font-weight: 600;
}

.info-badge {
    background: #d1ecf1;
    color: #0c5460;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #17a2b8;
    margin-bottom: 1rem;
    font-weight: 600;
}

.no-referrer p {
    margin: 0.5rem 0;
    line-height: 1.6;
}

.no-referrer ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.no-referrer li {
    margin: 0.5rem 0;
}

.no-referrer code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.json-display {
    margin: 1.5rem 0;
}

.json-display h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
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

.inline-pre {
    display: inline-block;
    background: #2c3e50;
    color: #ecf0f1;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
}

code {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
}

.btn-back {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    margin-top: 1rem;
    transition: background 0.2s;
}

.btn-back:hover {
    background: #1d4ed8;
}

.nav-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.nav-button {
    background: white;
    border: 2px solid #ddd;
    padding: 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.2s;
    text-align: left;
}

.nav-button:hover {
    background: #f8f9fa;
    border-color: #2563eb;
}

.nav-button.active {
    background: #e3f2fd;
    border-color: #2563eb;
    font-weight: 600;
}

.nav-button.url-nav {
    border-color: #94a3b8;
}

.nav-button.url-nav:hover {
    border-color: #64748b;
    background: #f8fafc;
}

.nav-button.named-nav {
    border-color: #a78bfa;
    background: #faf5ff;
}

.nav-button.named-nav:hover {
    border-color: #8b5cf6;
    background: #f3e8ff;
}

.navigation-section.named-routes {
    background: linear-gradient(to bottom right, #faf5ff, #ffffff);
    border: 2px solid #e9d5ff;
}

.nav-note {
    background: #f0f9ff;
    border-left: 4px solid #3b82f6;
    padding: 1rem;
    margin-top: 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
}

.nav-note.success {
    background: #f0fdf4;
    border-left-color: #22c55e;
}

.nav-note code {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
}

.use-case-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

.use-case {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 6px;
}

.use-case h3 {
    margin: 0 0 0.5rem 0;
    color: #667eea;
    font-size: 1.1rem;
}

.use-case p {
    margin: 0 0 0.75rem 0;
    color: #666;
    line-height: 1.6;
}

.use-case code {
    background: #e3f2fd;
    color: #1976d2;
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    font-size: 0.85rem;
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
    background: #2563eb;
    color: white;
    font-weight: 600;
}

.comparison tbody tr:hover {
    background: #f8f9fa;
}
</style>
