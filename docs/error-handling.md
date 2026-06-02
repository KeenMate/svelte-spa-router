# Error handling & 404 tracking

## Global error handler

Production-ready error handling for your Svelte app.

### Quick start

```javascript
// main.js
import { configureGlobalErrorHandler } from '@keenmate/svelte-spa-router/helpers/error-handler'
import GlobalErrorHandler from '@keenmate/svelte-spa-router/helpers/GlobalErrorHandler'

configureGlobalErrorHandler({
    onError: (error, errorInfo, context) => {
        // Log to Sentry, LogRocket, etc.
        Sentry.captureException(error, { extra: errorInfo })

        // Show a toast/snackbar via your own UI library
        toast.error(`Something went wrong: ${error.message}`)
    },

    strategy: 'navigateSafe', // Navigate to home on error
    safeRoute: '/',

    maxRestarts: 3,
    restartWindow: 60000, // 1 minute

    isDevelopment: import.meta.env.DEV
})
```

```svelte
<!-- App.svelte -->
<script>
import GlobalErrorHandler from '@keenmate/svelte-spa-router/helpers/GlobalErrorHandler'
</script>

<GlobalErrorHandler>
    <Router {routes} />
</GlobalErrorHandler>
```

### Recovery strategies

- **`navigateSafe`** (default) — Navigate to safe route (e.g., home page)
- **`restart`** — Reload the page with loop prevention
- **`showError`** — Display error component and let user decide
- **`custom`** — Execute custom recovery logic via `onRecover` callback

### Custom recovery

```javascript
configureGlobalErrorHandler({
    strategy: 'custom',
    onRecover: (error, errorInfo, context, helpers) => {
        const { restart, navigate, showError, canRestart } = helpers

        if (error.name === 'ChunkLoadError') {
            restart() // New deployment - safe to restart
        } else if (error.message.includes('auth')) {
            navigate('/login')
        } else {
            navigate('/')
        }
    }
})
```

### Features

- Catches ALL errors (render, effect, event handlers, async, promises)
- Loop prevention (tracks restarts in sessionStorage)
- Full-page error UI (default `ErrorDisplay` or your own component)
- `onError` callback for wiring up your toast/snackbar library, Sentry, analytics, etc.
- Error filtering (ignore known non-critical errors)
- TypeScript support

## 404 not found tracking

Track 404s for analytics and monitoring:

```svelte
<Router
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
    }}
/>
```

The `onNotFound` callback fires when:
- The catch-all route (`'*'`) matches (user sees your 404 page)
- No route matches at all (no 404 page defined)
