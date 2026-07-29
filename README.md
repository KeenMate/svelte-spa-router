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

### v5.4.0-rc01

- **Fixed: `use:link` in history mode could navigate to a stale target** — when a component reuses the same `<a>` DOM node across renders and only updates its `href="/x/{id}"` attribute (e.g. rows in a reused/virtualized data grid), clicks navigated to the previously-rendered path even though the visible href was correct. The action now reads the link's live `href` from the DOM at click time (matching hash mode), so navigation always follows the current attribute.
- **Fixed: `use:link` leaked duplicate `click` listeners** — the listener is now attached once and cleaned up via a `destroy()` on the action, instead of a new one being added on every reactive update.

### v5.3.0

- **BREAKING: `NavTreeNode.isHidden` renamed to `hidden`** — aligns with the KeenMate web-components convention of bare HTML attribute names (`hidden`, `disabled`, `selected`) for data-model boolean fields. Same shape, same getter reactivity. Migration: find-and-replace `isHidden:` → `hidden:` in your nav-tree definitions. The helper predicate `isNodeHidden(node)` keeps its `is*` prefix.
- **`helpers/nav-tree` — permission-aware filtering for auto-generated sidebars** — `filterByPermissions(navTree, { mode })` drops or marks-as-disabled nodes the current user can't reach. Two modes (`hide` / `disable`), cascading parent hiding, ancestor permission inheritance, and a polymorphic `hidden: boolean | () => boolean` per node for static or reactive overrides. Reactive end-to-end — `$derived(filterByPermissions(navTree))` re-runs when `setCurrentUser()` fires or any `hidden` getter reads mutating `$state`. No subscription wiring. Ships with `walkTree` / `findNodeByPath` and a `/nav-tree-demo` reference implementation where one tree drives both routes AND sidebar.
- **`subtree: true` + `subtreeClassName` on `use:active`** — sidebar parents stay highlighted on their own index page AND every nested URL from a single action call, no regex required. `subtreeClassName` adds a distinct class on "parent of an active child" vs "really active" links (e.g. `link-active` / `sublink-active`) in one call instead of two stacked actions.
- **`NavTreeNode.disabled` now renders as forbidden in BOTH filter modes** — `disabled` is a product-level placeholder signal ("coming soon"), not a user-permission concern, so it stays visible regardless of hide/disable mode. New `FilterOptions.disabledClassName` styles these distinctly from permission-denied items (e.g. amber "Unavailable" vs. red "Access restricted"); when both apply, `disabledClassName` wins. Default falls back to `forbiddenClassName`, fully backward compatible.
- **Stacked `use:active` actions on the same node now cooperate** — class management rewritten from per-entry remove-then-conditionally-add to a per-node aggregate sync. Fixes a silent bug where the common "parent + descendants" pattern (`use:active use:active={'/foo/*'}`) failed on the bare path.
- **`ai/link-actions.txt` rewritten** — corrected the PREFIX MATCHING claim that `/foo/*` matched bare `/foo` (it doesn't), with new BRANCH MATCHING, SIDEBAR WITH SUBMENU, TWO-CLASS PARENT/CHILD, GENERATING NAV FROM ROUTE TREE, and FILTERING BY PERMISSIONS sections.

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
