<script>
/**
 * 404 Not Found Tracking Demo
 * Demonstrates the onNotFound callback for analytics and monitoring
 */

import { push } from '@keenmate/svelte-spa-router/utils'

let testPaths = [
    '/this-does-not-exist',
    '/random-page-123',
    '/foo/bar/baz',
    '/api/users/999',
]

function navigateTo404(path) {
    push(path)
}
</script>

<div class="not-found-demo">
    <h1>🔍 404 Not Found Tracking Demo</h1>

    <div class="intro">
        <p>
            The <strong>onNotFound</strong> callback allows you to track 404 errors for analytics and monitoring.
            This is essential for:
        </p>
        <ul>
            <li>Detecting broken links in your app</li>
            <li>Monitoring user behavior (what pages do users try to access?)</li>
            <li>Sending 404s to error tracking services (Sentry, LogRocket)</li>
            <li>Logging to analytics platforms (Google Analytics, Mixpanel)</li>
        </ul>
    </div>

    <div class="how-it-works">
        <h2>How It Works</h2>

        <div class="step">
            <h3>1. Add onNotFound Callback to Router</h3>
            <pre><code>{`<Router
    {routes}
    onNotFound={(e) => {
        console.log('404:', e.detail.location)

        // Send to Sentry
        Sentry.captureMessage('404 Not Found', {
            extra: {
                path: e.detail.location,
                querystring: e.detail.querystring
            }
        })

        // Send to Google Analytics
        gtag('event', 'page_not_found', {
            page_path: e.detail.location
        })
    })
/>`}</code></pre>
        </div>

        <div class="step">
            <h3>2. When Does It Fire?</h3>
            <p>The <code>onNotFound</code> callback fires in two scenarios:</p>
            <ul>
                <li><strong>Catch-all route matches (<code>'*'</code>):</strong> User sees your NotFound page</li>
                <li><strong>No route matches at all:</strong> No catch-all route defined</li>
            </ul>
        </div>

        <div class="step">
            <h3>3. Event Detail</h3>
            <p>The callback receives an event with the following detail:</p>
            <pre><code>{`{
    location: '/nonexistent',  // The path that was not found
    querystring: 'tab=about'   // Query string (if any)
}`}</code></pre>
        </div>
    </div>

    <div class="demo-section">
        <h2>Try It Out</h2>
        <p>Click any button below to navigate to a non-existent route. Watch the console for the 404 log:</p>

        <div class="test-buttons">
            {#each testPaths as path}
                <button onclick={() => navigateTo404(path)} class="test-btn">
                    Navigate to <code>{path}</code>
                </button>
            {/each}
        </div>

        <div class="expected">
            <h3>Expected Console Output:</h3>
            <pre><code>{`404 Not Found: {
    location: '${testPaths[0]}',
    querystring: ''
}`}</code></pre>
        </div>
    </div>

    <div class="current-implementation">
        <h2>Current Implementation</h2>
        <p>
            This demo app has the <code>onNotFound</code> callback configured in <code>App.svelte</code>:
        </p>
        <pre><code>{`function handleNotFound(event) {
    console.log('404 Not Found:', event.detail)
    // Example: Send to Sentry or other monitoring service
    // Sentry.captureMessage('404 Not Found', {
    //     extra: {
    //         path: event.detail.location,
    //         querystring: event.detail.querystring
    //     }
    // })
}

<Router {routes} onNotFound={handleNotFound} />`}</code></pre>
    </div>

    <div class="use-cases">
        <h2>Common Use Cases</h2>

        <div class="use-case">
            <h3>🔴 Sentry Integration</h3>
            <pre><code>{`onNotFound={(e) => {
    Sentry.captureMessage('404 Not Found', {
        level: 'info',
        extra: {
            path: e.detail.location,
            querystring: e.detail.querystring,
            referrer: document.referrer
        }
    })
})
/>`}</code></pre>
        </div>

        <div class="use-case">
            <h3>📊 Google Analytics</h3>
            <pre><code>{`onNotFound={(e) => {
    gtag('event', 'page_not_found', {
        page_path: e.detail.location,
        page_location: window.location.href
    })
})
/>`}</code></pre>
        </div>

        <div class="use-case">
            <h3>📝 Custom Logging</h3>
            <pre><code>{`onNotFound={(e) => {
    fetch('/api/log-404', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            path: e.detail.location,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        })
    })
})
/>`}</code></pre>
        </div>
    </div>

    <div class="benefits">
        <h2>Benefits</h2>
        <ul>
            <li>✅ <strong>Track broken links:</strong> Find and fix dead links in your app</li>
            <li>✅ <strong>User behavior insights:</strong> Understand what users are looking for</li>
            <li>✅ <strong>SEO monitoring:</strong> Detect broken backlinks from search engines</li>
            <li>✅ <strong>Quality assurance:</strong> Catch typos in your navigation</li>
            <li>✅ <strong>Analytics integration:</strong> Feed data to your monitoring stack</li>
        </ul>
    </div>
</div>

<style>
.not-found-demo {
    max-width: 900px;
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

.how-it-works {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.how-it-works h2 {
    margin-top: 0;
    color: #2c3e50;
}

.step {
    margin: 2rem 0;
}

.step h3 {
    color: #667eea;
    margin-bottom: 1rem;
}

.step p {
    margin: 0.5rem 0;
    line-height: 1.6;
}

.step ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
}

.step li {
    margin: 0.5rem 0;
}

pre {
    background: #2c3e50;
    color: #ecf0f1;
    padding: 1.5rem;
    border-radius: 6px;
    overflow-x: auto;
    margin: 1rem 0;
}

code {
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
}

p code, li code, h3 code {
    background: #f5f5f5;
    color: #e74c3c;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9rem;
}

.demo-section {
    background: #fff3cd;
    padding: 2rem;
    border-radius: 8px;
    border: 2px solid #ffc107;
    margin-bottom: 2rem;
}

.demo-section h2 {
    margin-top: 0;
    color: #856404;
}

.demo-section p {
    margin: 0 0 1.5rem 0;
    color: #856404;
}

.test-buttons {
    display: grid;
    gap: 1rem;
    margin-bottom: 2rem;
}

.test-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
}

.test-btn:hover {
    background: #c82333;
}

.test-btn code {
    background: rgba(255,255,255,0.2);
    color: white;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
}

.expected {
    background: white;
    padding: 1.5rem;
    border-radius: 6px;
}

.expected h3 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
}

.expected pre {
    margin: 0;
}

.current-implementation {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.current-implementation h2 {
    margin-top: 0;
    color: #2c3e50;
}

.current-implementation p {
    margin: 0 0 1rem 0;
}

.use-cases {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

.use-cases h2 {
    margin-top: 0;
    color: #2c3e50;
}

.use-case {
    margin: 2rem 0;
}

.use-case h3 {
    color: #667eea;
    margin-bottom: 1rem;
}

.benefits {
    background: #d4edda;
    padding: 2rem;
    border-radius: 8px;
    border-left: 4px solid #28a745;
}

.benefits h2 {
    margin-top: 0;
    color: #155724;
}

.benefits ul {
    margin: 0;
    padding-left: 1.5rem;
}

.benefits li {
    margin: 1rem 0;
    color: #155724;
    line-height: 1.6;
}
</style>
