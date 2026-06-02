# Imports & exports

Here are the most frequently used imports and where to get them.

## Basic router setup

```javascript
// Main Router component
import Router from '@keenmate/svelte-spa-router'

// Navigation functions - available from main module OR /utils
import { push, replace, pop, goBack } from '@keenmate/svelte-spa-router'
// Alternative:
import { push, replace, pop, goBack } from '@keenmate/svelte-spa-router/utils'

// Link action for <a> tags
import { link } from '@keenmate/svelte-spa-router'
```

## Accessing route information

```javascript
// Get current route data (call as functions, not stores!)
import { location, querystring, routeParams, navigationContext } from '@keenmate/svelte-spa-router'

// Usage in components:
const currentPath = $derived(location())        // e.g., "/user/123"
const query = $derived(querystring())           // e.g., "?tab=profile"
const params = $derived(routeParams())          // e.g., { id: "123" }
const context = $derived(navigationContext())   // Navigation context data
```

**⚠️ Important:** In route components, prefer receiving `routeParams` as props instead of importing:

```svelte
<script>
// Recommended in route components
let { routeParams = {} } = $props()
</script>

<p>User ID: {routeParams.id}</p>
```

## Route configuration

```javascript
// Type-safe route definitions (recommended!)
import { defineRoutes } from '@keenmate/svelte-spa-router/routes'

// Wrap routes with loading/conditions
import { wrap } from '@keenmate/svelte-spa-router/wrap'

// Active link highlighting
import active from '@keenmate/svelte-spa-router/active'

// Named routes system
import { registerRoutes, buildUrl } from '@keenmate/svelte-spa-router/routes'
```

## Advanced features

```javascript
// Permission-based routing
import {
  configurePermissions,
  createProtectedRoute,
  hasPermission
} from '@keenmate/svelte-spa-router/helpers/permissions'

// Navigation guards
import {
  registerBeforeLeave,
  unregisterBeforeLeave,
  NavigationCancelledError
} from '@keenmate/svelte-spa-router/helpers/navigation-guard'

// Hierarchical route structure
import { createHierarchy } from '@keenmate/svelte-spa-router/helpers/hierarchy'

// Error handling
import {
  configureGlobalErrorHandler
} from '@keenmate/svelte-spa-router/helpers/error-handler'
import { GlobalErrorHandler } from '@keenmate/svelte-spa-router/helpers/GlobalErrorHandler'

// URL utilities
import { joinPaths } from '@keenmate/svelte-spa-router/helpers/url-helpers'

// Query string helpers
import {
  parseQuerystring,
  stringifyQuerystring,
  updateQuerystring
} from '@keenmate/svelte-spa-router/helpers/querystring'
```

## All available import paths

```javascript
'@keenmate/svelte-spa-router'                        // Main module (Router, push, location, etc.)
'@keenmate/svelte-spa-router/utils'                  // Alternative path for utils
'@keenmate/svelte-spa-router/wrap'                   // Route wrapping
'@keenmate/svelte-spa-router/active'                 // Active link action
'@keenmate/svelte-spa-router/routes'                 // Named routes system
'@keenmate/svelte-spa-router/constants'              // Constants and enums
'@keenmate/svelte-spa-router/logger'                 // Debug logging
'@keenmate/svelte-spa-router/helpers/permissions'    // Permission system
'@keenmate/svelte-spa-router/helpers/navigation-guard'  // Navigation guards
'@keenmate/svelte-spa-router/helpers/hierarchy'      // Hierarchical routes
'@keenmate/svelte-spa-router/helpers/error-handler'  // Error handling
'@keenmate/svelte-spa-router/helpers/GlobalErrorHandler'  // Error component
'@keenmate/svelte-spa-router/helpers/url-helpers'    // URL utilities
'@keenmate/svelte-spa-router/helpers/querystring'    // Query string helpers
'@keenmate/svelte-spa-router/helpers/route-metadata' // Breadcrumbs/metadata
'@keenmate/svelte-spa-router/helpers/filters'        // Filter parsing
```

## Common mistake

```javascript
// ❌ WRONG - /stores path doesn't exist (this was the old v3/v4 API)
import { routeParams } from '@keenmate/svelte-spa-router/stores'

// ✅ CORRECT - Import from main module or /utils
import { routeParams } from '@keenmate/svelte-spa-router'
```

> **Note:** This is a Svelte 5 router using runes (`$state`, `$derived`), not Svelte stores. There is no `/stores` export path.
