# Svelte 5 Fork Available

Since the original repository appears to be inactive, we have created a modernized fork of svelte-spa-router that is fully compatible with **Svelte 5** and its new runes system.

## Why This Fork

The original svelte-spa-router repository (this) has been inactive for some time and does not support Svelte 5. Rather than wait for updates, we decided to move the project forward with a complete rewrite and significant enhancements for Svelte 5 while preserving the core routing concepts that made the original so popular.

## Repository and Showcase

- **GitHub:** https://github.com/keenmate/svelte-spa-router
- **Live Demo:** https://svelte-spa-router.keenmate.dev/

## Key Features

1. **Svelte 5 Runes Support** - Complete rewrite using `$state`, `$props`, `$effect`, and `$derived` instead of Svelte stores.

2. **Dual-Mode Routing** - Support for both hash-based routing (`#/path`) and history API routing (`/path`) with clean URLs, configured before app mount.

3. **Multi-Parameter Navigation** - Enhanced navigation functions supporting route parameters, query strings, and navigation context in a single call: `push(route, params, query, context)`.

4. **Named Routes System** - Define and use named routes for type-safe navigation without hardcoding paths throughout your application.

5. **Permission Management** - Built-in RBAC (role-based access control) with support for both role-based permission checks and resource-based authorization callbacks.

6. **Navigation Guards** - Prevent users from leaving a route with unsaved changes using `onBeforeRouteLeave()` hook with customizable confirmation dialogs.

7. **Multi-Zone Routing** - Load multiple components per route into different named zones (e.g., sidebar, main, panel) for complex layouts.

8. **Route Metadata & Breadcrumbs** - Attach metadata to routes including titles, breadcrumbs, and custom data, with dynamic breadcrumb updates.

9. **Advanced Loading States** - Per-route loading components with global loading state management, including route-level loading indicators.

10. **Global Error Handling** - Comprehensive error handling system with configurable recovery strategies, restart loop prevention, and beautiful error displays.

11. **Navigation Context** - Pass data between routes without exposing it in the URL, similar to WinForms navigation patterns.

12. **Querystring & Filter Helpers** - Built-in utilities for parsing and stringifying query parameters and URL filters with type safety.

13. **Strict Parameter Replacement** - Missing route parameters are replaced with configurable placeholders instead of being silently removed, making debugging easier.

## Important Notes

This is **not a drop-in replacement**. Migration requires code changes:

**State Management**
Replace Svelte store syntax with runes:
```javascript
// Old
import { location } from 'svelte-spa-router'
$: currentLocation = $location

// New
import { location } from '@keenmate/svelte-spa-router/utils'
let currentLocation = $derived(location())
```

**Component Props**
Update route component prop declarations:
```javascript
// Old
export let params = {}

// New
let { routeParams = {} } = $props()
```

**Configuration**
Call configuration functions before app mount:
```javascript
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'
setHashRoutingEnabled(false)  // For history mode
setBasePath('/')
```

## Documentation

Full documentation and migration guide available in the repository README and CLAUDE.md file.

## Feedback Welcome

We are actively looking for people to test this fork and provide feedback. If you're working with Svelte 5, we'd appreciate:

- Testing the router in your projects
- Reporting issues or bugs on our GitHub repository
- Suggesting improvements or new features
- Sharing your migration experience

We hope this fork is useful to the Svelte 5 community while maintaining the spirit of the original project.
