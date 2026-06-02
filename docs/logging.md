# Debug logging

The router includes a built-in debug logging system to help troubleshoot routing issues during development.

## Enabling debug logs

```javascript
// main.js
import { enableLogging } from '@keenmate/svelte-spa-router/logger'

// Enable debug logs in development only
if (import.meta.env.DEV) {
  enableLogging()  // Enable all categories
}

// Or enable specific categories only
import { disableLogging, setCategoryLevel } from '@keenmate/svelte-spa-router/logger'

disableLogging()  // Disable all first
setCategoryLevel('ROUTER:SCROLL', 'debug')  // Enable only scroll logs
setCategoryLevel('ROUTER:NAVIGATION', 'info')  // Enable navigation at info level
```

## What gets logged

The router provides **12 hierarchical logging categories** for granular control:

| Category | Description |
|----------|-------------|
| `ROUTER` | Core routing pipeline, route matching |
| `ROUTER:NAVIGATION` | push, pop, replace, goBack |
| `ROUTER:SCROLL` | Scroll restoration |
| `ROUTER:GUARDS` | Navigation guards |
| `ROUTER:CONDITIONS` | Route condition checks |
| `ROUTER:HIERARCHY` | Hierarchical route inheritance |
| `ROUTER:PERMISSIONS` | Permission checking |
| `ROUTER:ROUTES` | Named routes and URL building |
| `ROUTER:ZONES` | Multi-zone routing |
| `ROUTER:METADATA` | Breadcrumbs and route metadata |
| `ROUTER:ERROR_HANDLER` | Global error handling |
| `ROUTER:FILTERS` | Filter parsing |

**Example output:**
```
[13:42:48.123] [DEBUG] [ROUTER] Running pipeline for: /document/123
[13:42:48.234] [DEBUG] [ROUTER] Route loaded successfully: /document/:id
[13:42:48.345] [DEBUG] [ROUTER:NAVIGATION] Called - navigationContext: { source: 'menu' }
[13:42:48.456] [DEBUG] [ROUTER:SCROLL] Scroll effect triggered - restoreScrollState: true
```

## Advanced logging control

```javascript
import { setLogLevel, setCategoryLevel } from '@keenmate/svelte-spa-router/logger'

// Set global log level (affects all categories)
setLogLevel('warn')  // Only show warnings and errors

// Enable specific categories at different levels
disableLogging()  // Start with all disabled
setCategoryLevel('ROUTER:SCROLL', 'debug')  // Debug scroll issues
setCategoryLevel('ROUTER:PERMISSIONS', 'info')  // Monitor permission checks
```

**Log levels:** `trace`, `debug`, `info`, `warn`, `error`, `silent`

## Filtering logs

To focus on specific router logs in your browser console:

- Filter by `ROUTER` to see all router logs
- Filter by `ROUTER:SCROLL` to see only scroll-related logs
- Filter by `[ERROR]` to see only errors

Debug logs are **disabled by default** to keep production consoles clean.

## Runtime control via window API

The router exposes a global API at `window.components['svelte-spa-router']` for runtime debugging:

```javascript
// Check version
window.components['svelte-spa-router'].version()  // "5.0.0"

// View package metadata
window.components['svelte-spa-router'].config
// { name, version, author, license, repository, homepage }

// Enable all debug logging
window.components['svelte-spa-router'].logging.enableLogging()

// Disable all logging
window.components['svelte-spa-router'].logging.disableLogging()

// Set global log level
window.components['svelte-spa-router'].logging.setLogLevel('debug')

// Enable specific category
window.components['svelte-spa-router'].logging.setCategoryLevel('ROUTER:NAVIGATION', 'debug')

// List all logging categories
window.components['svelte-spa-router'].logging.getCategories()
// ["ROUTER", "ROUTER:NAVIGATION", "ROUTER:SCROLL", ...]
```

Useful for toggling logging from the browser console without code changes.
