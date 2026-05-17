<script>
    function throwError() {
        // setTimeout escapes the Svelte event-handler context so the throw
        // becomes a genuine unhandled error caught by window.addEventListener('error').
        setTimeout(() => {
            throw new Error('Test error from /test/error fixture')
        }, 0)
    }

    function throwIgnored() {
        // Matches the ignoreErrors pattern (/ResizeObserver loop/i) configured
        // in main.js — the GlobalErrorHandler should ignore this error.
        setTimeout(() => {
            throw new Error('ResizeObserver loop completed with undelivered notifications.')
        }, 0)
    }
</script>

<svelte:head>
    <title>Test &mdash; error handling</title>
</svelte:head>

<main>
    <h1 data-testid="error-fixture-heading">Error Handling Test Fixture</h1>
    <p>
        Targeted by <code>e2e/error-handling.spec.ts</code>. The app's GlobalErrorHandler is
        configured with <code>strategy: 'navigateSafe'</code> and <code>safeRoute: '/'</code>
        in main.js. The <code>onError</code> callback is the supported hook for any toast /
        Sentry / analytics integration.
    </p>

    <section class="actions">
        <button data-testid="btn-throw" onclick={throwError}>Throw an unhandled error</button>
        <button data-testid="btn-throw-ignored" onclick={throwIgnored}>Throw an ignored (ResizeObserver) error</button>
    </section>
</main>

<style>
    main {
        max-width: 760px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    button {
        margin: 0.25rem 0.25rem 0 0;
        padding: 0.5rem 1rem;
        border: 1px solid #dc2626;
        background: white;
        color: #dc2626;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
    }
</style>
