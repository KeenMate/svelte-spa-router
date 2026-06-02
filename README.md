# @keenmate/svelte-spa-router

[![npm](https://img.shields.io/npm/v/@keenmate/svelte-spa-router.svg)](https://www.npmjs.com/package/@keenmate/svelte-spa-router)
[![GitHub](https://img.shields.io/github/license/keenmate/svelte-spa-router.svg)](https://github.com/keenmate/svelte-spa-router/blob/master/LICENSE.md)

A modern router for [Svelte 5](https://github.com/sveltejs/svelte) SPAs, built from the ground up on the runes API (`$props`, `$state`, `$effect`, `$derived`). Supports dual-mode routing (hash and history) with comprehensive permission management.

MIT licensed.

## Main features

- **Dual-mode routing** — hash (`#/path`) or history API (`/path`)
- **Built on Svelte 5 runes** — no stores, no `$:` declarations
- **Type-safe routes** — `defineRoutes()` gives IDE autocomplete on route names and params
- **TypeScript-first** — generics on `routeParams()`, `query()`, `filters()`
- **Flexible navigation** — multi-parameter signatures, named routes, navigation context, referrer tracking
- **Hierarchical routes** — optional parent→child inheritance of breadcrumbs, permissions, and guards
- **Permissions** — role-based AND resource-based access control, with live reactivity via `setCurrentUser()`
- **Querystring & filter helpers** — reactive, type-safe, with auto-detection of array formats
- **Global error handler** — production-ready, with restart-loop prevention
- **404 tracking** — `onNotFound` callback for analytics/monitoring
- **Tiny** — uses [regexparam](https://github.com/lukeed/regexparam) for route matching, distributed as source (no build step)

## What's new

### v5.2.0

- **Breaking — built-in toast removed from `GlobalErrorHandler`** — notification UI belongs in your stack. Wire your own toast/snackbar inside the `onError` callback. The `showToast` config field is gone.
- **`defineRoutes()`** — type-safe route definitions with IDE autocomplete on route names and params, plus generated `nav.X.push(params)` and `paths.X(params)` helpers
- **Permissions reactivity by default** — `setCurrentUser()` makes `hasPermission()` updates live in `{#if}` blocks without subscription wiring; `revalidateCurrentRoute()` + `onRevalidationFailure` re-check the currently mounted route on out-of-band user changes (websocket permission updates, token refresh)
- **Comprehensive test coverage** — 347 vitest cases across 16 files plus a 16-spec / 103-test Playwright e2e suite with dedicated browser-level fixtures
- **Docs reorganization** — README trimmed from ~2,300 to 157 lines, deep-dive content split into 14 domain-specific files under `docs/`; 15-file AI-assistant reference set under `ai/` for Claude / Cursor / Copilot
- **Several router fixes + diagnostics** — routed components are no longer wrapped in a layout-breaking `<div style="display: block">` (broke flexbox/grid for routes that didn't use loading); `push('/path', {}, queryObj)` was dropping the query; `onNotFound` never fired when `'*'` catch-all was configured; `navigationContext()` leaked the internal `_routeName` key (so `!ctx` was never true); new 10-second warning when `shouldDisplayLoadingOnRouteLoad` routes forget to call `hideLoading()`; `relativeLocation` now on every Router event payload for prefix-stripped nested-router reasoning

### v5.1.1

- **Breadcrumbs preserved on querystring-only navigation** — fixed breadcrumbs resetting to "Loading..." when only the querystring changes (e.g., tab switching via `replace('/items/1', {}, { tab: 'settings' })`)
- **TabsDemo example** — shows the correct `replace()`-for-tabs pattern with dynamic breadcrumbs that persist across tab switches
- **AI documentation index** — `ai/INDEX.txt` for keyword lookup, organized by topic with reading-order recommendations and a quick problem-solving guide

Full details in [CHANGELOG.md](./CHANGELOG.md).

## Installation

```sh
npm install @keenmate/svelte-spa-router
```

> **⚠️ Important:** This package requires **Node.js 22 or higher** for production builds. Node.js 20 has compatibility issues with Svelte 5 that may cause runtime errors like "link is not defined" in production builds. Make sure your build environment (CI/CD, Docker, etc.) uses Node 22+.

## Quick start

**1. Define your routes:**

```js
// routes.js
import Home from './routes/Home.svelte'
import About from './routes/About.svelte'
import User from './routes/User.svelte'
import NotFound from './routes/NotFound.svelte'

export default {
    '/': Home,
    '/about': About,
    '/user/:id': User,
    '*': NotFound,        // Catch-all (must be last)
}
```

**2. Mount the router:**

```svelte
<!-- App.svelte -->
<script>
import Router from '@keenmate/svelte-spa-router'
import routes from './routes'
</script>

<Router {routes} />
```

**3. Add links and navigate:**

```svelte
<script>
import { link, push } from '@keenmate/svelte-spa-router'
</script>

<nav>
    <a href="/" use:link>Home</a>
    <a href="/about" use:link>About</a>
    <a href="/user/42" use:link>User 42</a>
</nav>

<button onclick={() => push('/user/99')}>Go to User 99</button>
```

**4. Read route params inside a route component:**

```svelte
<!-- User.svelte -->
<script>
let { routeParams = {} } = $props()
</script>

<p>User ID: {routeParams.id}</p>
```

That's it. By default the router uses hash mode (`#/path`) so no server config is needed. For clean URLs, switch to history mode — see [Routing modes](./docs/routing-modes.md).

For type-safe routes with autocomplete on names and params, see [`defineRoutes()`](./docs/routes.md#defineroutes--type-safe-routes-recommended).

## Documentation

- [Imports & exports](./docs/imports.md) — which path to import from, plus the `/stores` gotcha
- [Routing modes](./docs/routing-modes.md) — hash vs history, server config, base path
- [Defining routes](./docs/routes.md) — basic routes, `defineRoutes()`, `createRoute()`, `wrap()`, code-splitting
- [Navigation](./docs/navigation.md) — `push` / `replace` / `pop` / `goBack`, named routes, navigation context, referrer tracking
- [Route params, location & querystring](./docs/route-params.md) — accessing route data, TypeScript generics
- [Querystring & filter helpers](./docs/querystring-filters.md) — reactive URL-driven UIs, flat & OData-style filters
- [Loading states & metadata](./docs/loading-metadata.md) — three loading patterns, dynamic title & breadcrumbs
- [Route guards (pre-conditions)](./docs/route-guards.md) — `wrap({ conditions })` and the failure flow
- [Permissions](./docs/permissions.md) — `createProtectedRoute()`, `hasPermission()`, role + resource auth, conditions vs permissions
- [Navigation guards (beforeLeave)](./docs/navigation-guards.md) — unsaved-changes confirmations, dirty checks, browser back/close
- [Hierarchical routes](./docs/hierarchical-routes.md) — tree structure with `createHierarchy()`, flat-mode inheritance
- [Error handling & 404 tracking](./docs/error-handling.md) — global error handler, recovery strategies, `onNotFound`
- [Debug logging](./docs/logging.md) — 12 categorized loggers, runtime control from the browser console
- [Advanced topics](./docs/advanced.md) — pipeline architecture, scroll restoration, nested routers, event payloads, full import reference

Other guides in the repo root:

- [CHANGELOG.md](./CHANGELOG.md) — full release history
- [MIGRATION.md](./MIGRATION.md) — migration guide from other routers
- [DEVELOPMENT.md](./DEVELOPMENT.md) — development workflow

## Examples

This repository includes three complete example applications:

- **`example/`** — hash mode routing with basic features
- **`example-history/`** — history mode with clean URLs, querystring demos, filter demos
- **`example-permissions/`** — permission-based routing with role management

Run an example:

```bash
cd example-history
npm install
npm run dev
```

## License

MIT — see [LICENSE.md](./LICENSE.md) for details.
