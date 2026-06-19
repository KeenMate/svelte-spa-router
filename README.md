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

### v5.3.0-rc01 (release candidate)

- **`helpers/nav-tree` — permission-aware filtering for auto-generated sidebars** — `filterByPermissions(navTree, { mode })` drops or marks-as-disabled nodes the current user can't reach. Two modes (`hide` / `disable`), cascading parent hiding, ancestor permission inheritance, and a polymorphic `isHidden: boolean | () => boolean` per node for static or reactive overrides (e.g. dev-only features via `isHidden: () => !import.meta.env.DEV`). Reactive end-to-end — `$derived(filterByPermissions(navTree))` re-runs when `setCurrentUser()` fires or any `isHidden` getter reads `$state` that mutates. No subscription wiring.
- **`subtree: true` on `use:active`** — sidebar parents stay highlighted on their own index page AND every nested URL from a single action call, no regex required. The action reads the link's `href` and registers both patterns internally. Pairs with `nav-tree` filtering for the full "one tree drives both routes AND sidebar with permissions" pattern — see `/nav-tree-demo`.
- **`subtreeClassName` option** — pair with `className` for a distinct CSS class on "parent of an active child" vs "really active" links (e.g. `link-active` / `sublink-active`) in one action call instead of two stacked `use:active`.
- **Stacked `use:active` actions on the same node now cooperate** — class management rewritten from per-entry remove-then-conditionally-add to a per-node aggregate sync. Fixes a silent bug where the common "parent + descendants" pattern (`use:active use:active={'/foo/*'}`) failed on the bare path because the second action stripped the class the first added.
- **`/nav-tree-demo` + `<NavLink>` reference implementation** — one tree drives both the sidebar (filtered via `filterByPermissions`, walked via `<NavLink subtree={!!children} forbidden={_forbidden}>`) and the route registration. Three live toggles demonstrate every filter behavior side-by-side: user (Donna ↔ Audrey), mode (hide ↔ disable), and a runtime feature-flag rune that flips an `isHidden` getter — the pattern you'd wire to a real feature-flag service in production.
- **`ai/link-actions.txt` rewritten** — previous PREFIX MATCHING section was wrong about `/foo/*` matching bare `/foo`. New BRANCH MATCHING, SIDEBAR WITH SUBMENU, TWO-CLASS PARENT/CHILD, GENERATING NAV FROM ROUTE TREE, and FILTERING BY PERMISSIONS sections. Same expansion in the showcase site.

### v5.2.1

- **Unblocks bare-function routes on modern stacks** — `{ '/': Home }` (without `wrap()`) now works under `vite@^7 + @sveltejs/vite-plugin-svelte@^6 + svelte@5.5x`, where the Router's component validator was previously throwing `Invalid component object` at first route render. Pure runtime fix — no API change, no consumer-side migration.
- **Root cause was an upstream Svelte compiler quirk**, not a router design issue — the nested-OR shape of the original validator got its inner parens dropped during compilation, flipping the boolean. Detailed write-up in [`docs/pitfalls.md`](./docs/pitfalls.md).

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
