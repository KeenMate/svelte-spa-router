# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.2.0-rc02] - 2026-05-01

### Fixed
- **`ReferenceError: __PACKAGE_NAME__ is not defined` masking real route errors** — The global API setup in `src/lib/index.js` referenced bundler-injected placeholders (`__PACKAGE_NAME__`, `__VERSION__`, `__AUTHOR__`, `__LICENSE__`, `__REPOSITORY__`, `__HOMEPAGE__`) with `typeof X !== 'undefined'` fallbacks. Consumer Vite optimizers (esbuild prebundle) were not preserving the guard, leaving bare references that threw `ReferenceError` at module-init. The error surfaced asynchronously during route activation and masked real errors thrown by route components.
  - Replaced the placeholder pattern with a direct `import pkg from '../../package.json'` — works universally because npm always ships `package.json` and all modern bundlers handle JSON imports natively.
  - No consumer-side bundler config required.

- **Svelte 5 `state_referenced_locally` warnings on every consumer dev build** — `Router.svelte` parsed the `routes` prop into `routesList` at script top level, which captures only the initial value. Svelte 5 emitted three `state_referenced_locally` warnings (lines 172, 173, 177) in any consumer's dev console, and silently ignored prop swaps if a consumer ever replaced `routes`.
  - Wrapped the parse logic in `$derived.by(() => { ... })` so the closure captures `routes` reactively. Warnings are gone and the routes prop is now properly reactive — replacing it rebuilds `routesList` and takes effect on the next navigation.
  - `findParentRoute()` and `findMatchingRoute()` already read `routesList` per-call, so no other changes were needed.

- **`push('/path', {}, queryObject)` and `replace(...)` silently dropped the querystring** — The multi-parameter signature `push(route, params, query, context)` only serialized the `query` object when the first argument was a *named route*. When the first argument was a path string (starting with `/`), the path branch stored `query` on `opts` but the downstream code only read `opts.href`, so the query object was never applied to the URL. The named-route branch worked because it routes through `buildUrl()`, which does the serialization. Existing tests only covered the named-route case and the path case with empty `{}`, so the regression was invisible.
  - Extracted `serializeQuery(query)` into `helpers/url-helpers.svelte.js` and reuse it in both `buildUrl()` (named branch, behavior unchanged) and `push()` / `replace()` (path branch).
  - When the path already contains a `?`, the serialized query is appended with `&`; otherwise with `?`.
  - Added 6 vitest cases covering: path + query object, URL encoding of keys/values, skipping `null` / `undefined`, merging with a path-embedded query, empty-query no-op, and the equivalent `replace()` case.

- **`onNotFound` was never emitted when a `'*'` catch-all route was configured** — `runRoutingPipeline()` only dispatched `notFound` on the true no-match path (`!ctx.match`). With a `'*'` route present, `regexparam` turned it into a wildcard that matched every unmatched URL, so `ctx.match` was always truthy and the event was suppressed. Apps that configured a `'*': NotFound` route to render a 404 page lost the ability to *observe* 404s programmatically (for logging, analytics, error tracking).
  - In `src/lib/Router.svelte`, after the no-match early-exit, dispatch `notFound` whenever `ctx.match.routeItem.path === '*'`. The catch-all component still renders — the event is purely additive.
  - The check uses the same exact-`'*'` test as the existing `isCatchAll` flag at line 727, so subtree wildcards like `'/admin/*'` (whose `routeItem.path` is `/admin/*`, not `*`) and the synthetic unauthorized-route match (whose `routeItem.path` is the unauthorized route) are unaffected.
  - Added an e2e test in `e2e/router-events.spec.ts` asserting that both the catch-all component renders *and* `onNotFound` fires with the correct `{ location, querystring }` payload. The pre-existing nested-router-without-catch-all test still covers the true no-match path.

### Added
- **`revalidateCurrentRoute()` + `onRevalidationFailure` — re-check the active route on user state changes** — `hasPermission()` reactivity (above) covers UI element visibility (menus, buttons), but it doesn't cover the case where the user is *sitting on a protected page* when their permissions are revoked. The router checks route conditions only during navigation, so a user already on `/admin` who loses admin permission would stay on `/admin` until they navigated away. This is exactly the websocket-permission-update scenario most real apps need to handle.
  - New `revalidateCurrentRoute()` export from the main module. Re-runs guards and conditions against the currently mounted route without re-mounting the component. On success, nothing visible happens — the component keeps its state (no flicker, no scroll reset, no in-flight form data lost). On failure, the same unauthorized handling that runs for fresh navigation fires here too.
  - New `configurePermissions({ onRevalidationFailure })` callback. When configured, fires *instead of* the standard unauthorized handling for revalidation failures — letting apps show a confirmation dialog, soft-warn the user, or log an audit trail before deciding what to do. If the callback doesn't navigate, the user stays on the current page. The `onConditionsFailed` Router event still fires for consistency with navigation behavior. Pass `null` to clear and fall back to standard handling.
  - Calls to `revalidateCurrentRoute()` within a ~50ms window are coalesced into a single re-validation pass — safe to call on every websocket message.
  - Multiple Router instances (nested routers, zones) each register independently and re-validate their own routes.
  - Implementation: `runRoutingPipeline` accepts a `revalidationOnly` option that (a) skips the `beforeLeave` guards (user isn't navigating away), (b) skips the `routeLoading` event dispatch (nothing's loading), (c) on success returns early before the load/commit phases (preserves the mounted component), (d) on failure routes through the new callback when configured. The existing `loadingId` race-condition mechanism handles overlapping navigation/revalidation cleanly.
  - vitest coverage in `navigation.test.js` (5 new cases: debounce, coalescing, multi-listener, unregister, throwing-listener tolerance) and `permissions.test.js` (4 new cases for the handler getter/setter contract).
  - e2e: new `RevalidateTest` + `RevalidateProtected` fixtures and `e2e/revalidate.spec.ts` (3 tests: callback fires on protected-route downgrade, no callback when still authorized, no-op on unprotected routes). App.svelte wires up an `onRevalidationFailure` recorder for the spec to assert on.
  - **Bug fix found while wiring this up:** the pipeline's internal `isPermissionFailure` value is the permissions object (truthy) rather than the literal `true`. Coerced to a boolean before exposing it in the callback's `detail`.

- **`setCurrentUser()` / `getCurrentUser()` — reactivity-by-default for `hasPermission()`** — Previously, `hasPermission()` only re-evaluated in `{#if}` blocks if the consumer's configured `getCurrentUser` happened to read reactive state. The README's canonical example used `getCurrentUser: () => get(currentUser)` (Svelte 4 store, non-reactive read), so following the docs literally meant `{#if hasPermission(...)}` only updated on navigation. A websocket pushing a permission change wouldn't update the UI until the user clicked a link.
  - Added module-level `$state` (`currentUserState`) inside `permissions.svelte.js`. The default `currentUserGetter` now reads from this rune, so any `hasPermission()` call inside a reactive context (`{#if}`, `$derived`, `$effect`) automatically tracks user changes.
  - New `setCurrentUser(user)` export — consumers call this on login/logout/websocket update; every reactive `hasPermission()` call site re-evaluates immediately. No subscription wiring needed on the consumer side.
  - New `getCurrentUser()` export — symmetric reader for cases like `setCurrentUser({ ...getCurrentUser(), permissions: newPerms })`.
  - `configurePermissions({ getCurrentUser })` still works for consumers who already maintain their own reactive user store (and remains the right choice when they do). Pass `getCurrentUser: null` to explicitly reset back to the default state-backed getter.
  - **Migration:** existing apps keep working unchanged. New apps can skip `getCurrentUser` and use `setCurrentUser` instead — typically less code and guaranteed-reactive without thinking about it. The README, `permissions.d.ts`, and `ai/permissions.txt` now recommend this path and call out the non-reactive footgun explicitly.
  - vitest coverage (`src/tests/permissions.test.js`): 5 new cases — `setCurrentUser`/`getCurrentUser` round-trip, `hasPermission` reflecting writes, explicit `getCurrentUser` overriding the default, `getCurrentUser: null` resetting back, and logged-out (`null`) handling.

- **Diagnostic warning when `shouldDisplayLoadingOnRouteLoad` routes never call `hideLoading()`** — Routes configured with `wrap({ shouldDisplayLoadingOnRouteLoad: true, loadingComponent: ... })` mount the real component immediately but keep it hidden under the loading component, waiting for the component itself to call `hideLoading()` from `@keenmate/svelte-spa-router/helpers/route-metadata` once data is ready. Previously, if the consumer forgot to call `hideLoading()` (or threw before reaching it, or hit a code path that didn't call it), the loading screen stayed up forever — no console message, no timeout, no recovery short of navigating away. The author hit this themselves while writing the e2e fixture and spent ten minutes debugging a "broken" wrap option.
  - `startRouteLoading()` in `route-metadata.svelte.js` now schedules a `setTimeout(console.warn, 10_000)` that fires only if `isRouteLoading` is still true at the threshold. Bypasses the configurable logger (matches the project convention that misconfiguration warnings always print). The message names the option, names the required call, and links to the README.
  - `hideLoading()` and a subsequent `startRouteLoading()` both clear the timer so the warning never fires when things are working normally.
  - vitest coverage in `route-metadata.test.js`: three new cases (warning fires after threshold, warning doesn't fire when `hideLoading()` is called in time, warning timer resets on subsequent `startRouteLoading()`).

- **Pending `waitForRouteReady()` promises are resolved when a new navigation starts** — Previously, if a user navigated away from a `shouldDisplayLoadingOnRouteLoad` route before its `hideLoading()` fired, the next `startRouteLoading()` clobbered `routeReadyResolvers = []` without resolving the pending entry. The old pipeline's `await waitForRouteReady()` was orphaned and leaked one unresolvable promise per abandoned navigation. After resolving, it would also have raced with the new pipeline's state writes if not for the new race check.
  - `startRouteLoading()` now resolves any pending resolvers before clearing the array.
  - `Router.svelte` adds a `loadingId !== loadingId` race-condition check immediately after `await waitForRouteReady()`, matching the pattern already used after `pipelineLoadComponent` and `pipelineLoadZoneComponents`. Stale pipeline runs bail cleanly instead of racing.
  - vitest coverage: new case asserting that a second `startRouteLoading()` resolves the first navigation's pending waiter.

- **Documented the `shouldDisplayLoadingOnRouteLoad` contract loudly** — `wrap.d.ts`, `wrap.js`, `routes.d.ts`, `helpers/hierarchy.d.ts`, and the README's Pattern 1 section now spell out the "you MUST call `hideLoading()`" requirement and the blank-page failure mode. Old docstring was 14 words; new copy names the failure mode and the dev-mode safety net.

- **`relativeLocation` field on every Router event payload** — Nested Routers configured with `prefix="/foo/bar"` define their routes in prefix-relative terms (e.g. `'/known'`, not `'/foo/bar/known'`) and match against the prefix-stripped path internally. But every event payload (`onRouteLoading`, `onRouteLoaded`, `onConditionsFailed`, `onNotFound`) reported the **full app URL** in `location` — so the router used two different notions of "location" depending on whether you looked at route definitions or event payloads. Consumers had to know the difference and strip the prefix themselves to reason about what the nested Router actually saw.
  - Added a new `relativeLocation` field to every dispatched event payload that already carried `location`. For a root Router (no `prefix`), `relativeLocation === location`. For a nested Router with `prefix`, it's the path with the prefix stripped (`/` if stripping leaves it empty). For paths outside the prefix (the rare case where the parent app navigates to something the nested Router doesn't own), `relativeLocation` equals `location`.
  - `location` is preserved unchanged — useful for logging, analytics, and re-navigating with `push()` (which always takes app-wide paths). `relativeLocation` is useful for reasoning about *this* Router's routing decisions.
  - All 7 `dispatchNextTick` sites in `Router.svelte` updated. The field is computed once per pipeline run in `createPipelineContext` and threaded through `ctx`.
  - README event-payload table updated to list the field and explain when it differs from `location`.
  - e2e coverage: extended `e2e/router-events.spec.ts` to assert (1) `relativeLocation === '/missing'` for a nested Router with `prefix="/test/embed"` navigating to `/test/embed/missing`, and (2) `relativeLocation === location` for the root Router with no prefix.

### Changed (docs)
- **Documented `conditions` failure behavior and the `conditions` vs `permissions` distinction** — Previously the README showed how to *write* a `wrap({ conditions: [...] })` guard and listed `onConditionsFailed` as a Router event, but never explained what the user actually sees when a condition returns `false`: the route component is unmounted, the slot becomes empty, and no built-in fallback UI is rendered. This surprised even the maintainers when writing the e2e suite — assertions assumed conditions failures would mount the same Unauthorized component that the permission system mounts.
  - `README.md`: added a "What happens when a condition returns `false`" callout to the *Route guards (pre-conditions)* section; expanded the *Event handling* example with a payload-shape table (`onRouteLoading` / `onRouteLoaded` / `onConditionsFailed` / `onNotFound`); added a new *Conditions vs Permissions* subsection with a side-by-side comparison covering setup, where the logic lives, what happens on failure (UI + event), and when to choose each.
  - `ai/guards-conditions.txt`: added a `WHAT HAPPENS ON FAILURE` section mirroring the README so the AI-facing summary captures the same fact.
  - **No code change.** The conditions/permissions split is the intended design — conditions are the low-level primitive, permissions are the opinionated wrapper that builds on top. Per the project's "library shouldn't paint default UI" principle (see the toast removal in this same release), conditions stay unopinionated. The behavior just needed to be documented.

### Removed (breaking — rc02 is unreleased)
- **Built-in error toast removed from `GlobalErrorHandler`** — The library used to render its own `<div class="error-toast">` on caught errors, gated by the `showToast` config flag (`true` by default). The render condition was `toastVisible && errorState.currentError && !config.showErrorComponent`, which made it dead code under the default `navigateSafe` strategy: that strategy calls `clearError()` synchronously after `push()` in the same handler tick, so by the time Svelte's reactive system flushed the `toastVisible = true` update, `errorState.currentError` was already `null` and the toast never rendered. `restart` with `autoRestart: false` and `showError` set `config.showErrorComponent = true`, which the same guard hides — so the toast was effectively only observable for `restart` with `autoRestart: true` during the delay window, and for `custom` strategies that left state untouched.
  - Rather than patch the broken interaction, the toast is removed entirely. Notification UI is the consumer's responsibility — every app already has a preferred toast/snackbar library, and the router's job is to surface the event, not paint pixels.
  - `onError(error, errorInfo, context)` is the supported integration point and was already wired up. Consumers can call their own toast library, Sentry, LogRocket, analytics, etc. from inside that callback.
  - Removed: `showToast` config field (was: `boolean`, default `true`), `toastVisible` / `toastTimeoutId` state, `showToast()` / `dismissToast()` helpers, the toast `{#if}` block in the template, and all `.error-toast` / `.toast-*` CSS in `GlobalErrorHandler.svelte`.
  - Updated: the `GlobalErrorHandlerConfig` TypeScript declaration (`error-handler.d.ts`), the example app (`main.js`, `ErrorHandlingDemo.svelte`, `test/ErrorTest.svelte`), and documentation (`README.md`, `ai/error-handling.txt`, `CLAUDE.md`, `e2e/README.md`, `e2e/error-handling.spec.ts`) to drop `showToast` and point at `onError` as the toast hook.
  - **Migration:** if you were passing `showToast: true`, remove it (TypeScript will flag it). To preserve toast behavior, call your toast library inside `onError` — e.g. `onError: (error) => toast.error(error.message)`.

### Added
- **Playwright e2e test suite** — Browser-level tests for the router, run against the example app in history mode on port 5050. Dedicated, minimal fixture pages live under `example/src/routes/test/` and are kept separate from the demo routes (which are user-oriented and evolve over time) so assertions stay stable.
  - **16 specs / 98 tests** covering all 20 feature areas from `ai/INDEX.txt`: basic setup & events, navigation (push/replace/pop/goBack + array/object signatures), named routes, route params (required / optional / wildcard), permissions (RBAC + authorization), guards & conditions, hierarchical inheritance, tree structure (`createHierarchy`), link actions (`use:link`, `use:active`), error handling (GlobalErrorHandler), referrer tracking, breadcrumbs / route metadata, debug logging & `window.components` API, querystring helpers, filters, multi-zone, loading states, 404 / NotFound, `wrap()`, and `routeContext`.
  - Playwright auto-starts the example dev server and reuses an already-running one (so `make dev` in another terminal is fine).
  - Each fixture surfaces router state via `data-testid` nodes; action buttons use `data-testid="btn-<action>"`. Reload always resets fixture state.
  - New npm scripts: `test:e2e`, `test:e2e:install`, `test:e2e:ui`, `test:e2e:headed`. New Makefile targets: `test-e2e`, `test-e2e-install`, `test-e2e-ui`.
  - Documentation: `e2e/README.md` covers run instructions, the fixture/spec convention, a coverage matrix, and a 6-step recipe for adding new fixtures. A discoverable in-browser index of all fixtures lives at `/test`.

## [5.2.0-rc01] - 2026-02-18

### Fixed
- **`routeContext()` function missing / mangled name** (Issue #3) — The exported function was named `routerouteContext()` instead of `routeContext()` due to a find-replace accident during the `userData` → `routeContext` rename. The README also referenced the old name `routeUserData()`.
  - Renamed `routerouteContext()` → `routeContext()` in `route-metadata.svelte.js` (function + all internal variable references)
  - Updated `route-metadata.d.ts` type declaration to match
  - Fixed README.md: `routeUserData` → `routeContext` in all import examples and API reference

- **`wrap()` not merging title/breadcrumbs into routeContext** (Issue #3) — `routeTitle()` and `routeBreadcrumbs()` returned empty values for routes defined with `wrap({ title, breadcrumbs })` because `wrap()` never merged these into `routeContext`. The Router's `pipelineComputeMetadata()` only reads from `routeItem.routeContext`, so title and breadcrumbs were silently lost.
  - Fixed in both single-component and zones code paths in `wrap.js`
  - `createRouteDefinition()` already had the merge logic — only `wrap()` was missing it

- **Logger TypeScript errors** — Added `.d.ts` type declarations for vendored loglevel libraries
  - Created `src/lib/vendor/loglevel/index.d.ts` and `prefix.d.ts`
  - Removed `@ts-ignore` comments from `logger.ts`
  - `svelte-check` now passes with 0 errors and 0 warnings

- **Missing TypeScript declarations for GlobalErrorHandler and ErrorDisplay** (Issue #4) — `Cannot find module '@keenmate/svelte-spa-router/helpers/GlobalErrorHandler' or its corresponding type declarations`
  - Created `GlobalErrorHandler.svelte.d.ts` with `GlobalErrorHandlerProps` and `ErrorComponentProps` interfaces
  - Created `ErrorDisplay.svelte.d.ts` with `ErrorDisplayProps` interface
  - Added `types` field to `./helpers/GlobalErrorHandler` export in `package.json`
  - Added new `./helpers/ErrorDisplay` export to `package.json` (was not exported at all)

- **Missing TypeScript declarations for `setHierarchicalRoutesEnabled` and `setIncludeReferrer`** (Issue #5) — `Module has no exported member 'setHierarchicalRoutesEnabled'`
  - Added `setHierarchicalRoutesEnabled()`, `getHierarchicalRoutesEnabled()`, `setIncludeReferrer()`, and `getIncludeReferrer()` declarations to `utils.d.ts`
  - Removed phantom `active.svelte.js` re-export from `index.d.ts` (type declared an export that didn't exist at runtime)

### Added
- **`defineRoutes()` — Type-safe route definitions** (Issue #2) - Single source of truth for routes, navigation, and URL building
  - Returns `routes` (for `<Router>`), `nav` (navigation helpers), and `paths` (URL builders)
  - Full TypeScript support with IDE autocomplete on route names and parameters
  - Extracts `:param` names from path patterns at the type level — catches typos at compile time
  - `nav.X.push(params)` / `nav.X.replace(params)` — programmatic navigation with autocomplete
  - `nav.X.link(params)` — returns object for `use:link` action
  - `paths.X(params)` — builds URL string for `href` attributes
  - Smart optimization: sync components without options skip `wrap()` overhead
  - Async components and routes with options automatically use `createRoute()`
  - Automatically calls `registerRoutes()` — no separate registration step needed
  - Supports all existing route options: `conditions`, `breadcrumbs`, `permissions`, `loadingComponent`, `props`, `title`, etc.
  - Example:
    ```javascript
    import { defineRoutes } from '@keenmate/svelte-spa-router/routes'

    const { routes, nav, paths } = defineRoutes({
      home: { path: '/', component: Home },
      user: { path: '/user/:id', component: () => import('./User.svelte') }
    })

    // <Router {routes} />
    // nav.user.push({ id: 123 })       — autocomplete on 'id'
    // <a href={paths.user({ id: 123 })} use:link>
    ```

- **Route Context Demo pages** — Example pages demonstrating `routeContext()`, `routeTitle()`, and `routeBreadcrumbs()` with live output
  - `example/src/routes/RouteContextDemo.svelte` — explains routeContext, shows live values, code examples
  - `example/src/routes/RouteContextTarget.svelte` — target page reached via button, displays its own routeContext
  - Both wired into App.svelte with nav link in Routing dropdown

- **Comprehensive test suite** — Expanded from ~156 to 347 passing tests across 16 test files (0 skipped)
  - **New test files:**
    - `route-metadata.test.js` (26 tests) — `updateRouteMetadata`, `routeContext()`, `routeTitle()`, `routeBreadcrumbs()`, `updateBreadcrumb()`, `updateTitle()`, `clearBreadcrumbCache()`, loading state functions
    - `navigation-guard.test.js` (22 tests) — `NavigationCancelledError`, `registerBeforeLeave()`, `runBeforeLeaveGuards()`, `createDirtyCheckGuard()`
    - `error-handler.test.js` (23 tests) — `configureGlobalErrorHandler()`, error state, `shouldIgnoreError()`, restart loop prevention, `createErrorInfo()`, `createRecoveryHelpers()`
    - `filters.test.js` (18 tests) — `configureFilters()`, `filters()` flat/structured modes, `updateFilters()`, custom parse/stringify round-trip
    - `querystring-shared.test.js` (7 tests) — `configureQuerystring()`, `query()` with arrayFormat/arrays config
    - `zones-and-scroll.test.js` (12 tests) — `getZoneComponent()`, `setZoneComponents()`, `restoreScroll()`
    - `logger.test.js` (13 tests) — `enableLogging()`, `disableLogging()`, `setLogLevel()`, `setCategoryLevel()` for all 12 categories, `logStructured()`
  - **Extended test files:**
    - `wrap.test.js` (9 → 42 tests) — zones mode, inheritance flags, `createRouteDefinition()`, `createRoute()`, sync component wrapping, condition normalization, validation errors
    - `navigation.test.js` (10 → 27 tests) — `goBack()`, `loc()`, `routeParams()`/`setParams()`, `navigationContext()`/`setNavigationContext()`, array/object/multi-param push formats, `setIncludeReferrer()`, `setParamReplacementPlaceholder()`
    - `permissions.test.js` (13 → 33 tests) — `createProtectedRouteDefinition()`, `authorizationCallback` execution order/fail-fast, `getUnauthorizedBehavior/Route/Component/Handler()`, `hasExplicitHandler()`, `all:` permission requirement
  - **Removed 34 `it.skip` stubs** that required Svelte component rendering or real browser DOM (deleted 3 empty test files: Router.test.js, hierarchical-routes.test.js, link-action.test.js; trimmed active-action.test.js and querystring-helpers.test.js)

### Documentation
- **defineRoutes() example page** — Added interactive demo page to example app (`example/src/routes/DefineRoutesDemo.svelte`)
  - Covers basic usage, navigation helpers, path builders, and supported route options
  - Includes interactive playground with real-time output
  - Shows before/after comparison with manual route definitions
- **Example app navbar rework** — Replaced flat navigation with grouped dropdown menus
  - 5 dropdown groups: Navigation, URL & Data, Routing, Errors, Security
  - CSS hover-based dropdowns (no JavaScript state management)
- **AI Assistant Documentation** - Added 15 concise text files in `./ai` folder optimized for AI assistants
  - Plain text format (no markdown) with bullet-style structure for efficient AI parsing
  - Files organized by feature: basic-setup, navigation, named-routes, route-params, permissions, guards-conditions, hierarchical-routes, tree-structure, link-actions, error-handling, referrer-tracking, debug-logging, import-patterns, utilities, breadcrumbs
  - Includes correct/incorrect usage patterns (✅/❌) for common mistakes
  - Code examples designed for copy-paste usage
  - Complements CLAUDE.md by providing quick-reference documentation
  - Aimed at helping AI coding assistants (like Claude, Cursor, Copilot) quickly understand router functionality
- **Breadcrumbs Documentation** - Added comprehensive `ai/breadcrumbs.txt` covering breadcrumb navigation system
  - Basic breadcrumb definition and structure
  - Accessing breadcrumbs in components via `routeBreadcrumbs()` helper
  - Breadcrumb component examples with navigation and styling
  - Dynamic breadcrumb updates using `updateBreadcrumb(id, updates)` after data loads
  - Integration with route parameters for dynamic segments
  - Hierarchical breadcrumb inheritance with automatic concatenation
  - Tree structure support with `createHierarchy()`
  - Best practices and common patterns
  - Debugging with ROUTER:METADATA logging category

## [5.1.1] - 2025-11-30

### Fixed
- **Breadcrumbs preserved on querystring changes** - Fixed breadcrumbs resetting to "Loading..." when only the querystring changes (e.g., tab navigation)
  - Issue: Changing tabs via `replace('/items/1', {}, { tab: 'settings' })` would reset dynamically updated breadcrumbs back to their initial "Loading..." state
  - Root cause: `updateRouteMetadata()` was resetting the entire route context on any navigation, including querystring-only changes
  - Solution: Detect when only querystring changed (same location + params) and preserve current breadcrumbs instead of resetting
  - Also applies cached breadcrumb updates when the route context is updated

### Added
- **TabsDemo example** - New example demonstrating correct pattern for tabs with querystring state
  - Shows how to use `replace()` instead of `push()` for tab changes
  - Demonstrates dynamic breadcrumbs that persist across tab switches
  - Located at `example/src/routes/TabsDemo.svelte`

### Documentation
- **AI Documentation Index** - Added comprehensive `ai/INDEX.txt` file for quick keyword lookup
  - Organized by topic sections: Getting Started, Imports, Navigation, Named Routes, etc.
  - Includes file descriptions, reading order recommendations, and cross-references
  - Quick problem solving guide mapping common errors to solutions
  - Examples organized by use case (Simple SPA, Admin Dashboard, E-commerce, etc.)
- **Breadcrumbs with Tabs** - Added "TABS WITH QUERY STRING" section to `ai/breadcrumbs.txt`
  - Documents the pattern for tabs that use querystring for state
  - Explains why `replace()` is necessary to preserve breadcrumbs
  - Includes complete code example
- **Named Routes in Basic Setup** - Added "ENABLING NAMED ROUTES" section to `ai/basic-setup.txt`
  - Documents that `registerRoutes()` must be called for named route navigation to work
  - Shows common pattern with page definitions array
  - Explains the "Route X not found in registry" error and how to fix it

## [5.1.0] - 2025-11-20 ✅ Published

### Added
- **Global Window API:** Added runtime debugging and introspection via `window.components['svelte-spa-router']`
  - `version()` - Get library version at runtime
  - `config` - Access package metadata (name, version, author, license, repository, homepage)
  - `logging.enableLogging()` - Enable all debug logging from browser console
  - `logging.disableLogging()` - Disable all logging from browser console
  - `logging.setLogLevel(level)` - Set global log level from browser console
  - `logging.setCategoryLevel(category, level)` - Control specific logging categories from browser console
  - `logging.getCategories()` - List all available logging categories
  - TypeScript support with full autocompletion for global API
  - SSR-safe implementation (only initializes in browser)
  - Namespace-safe pattern using `window.components` (shared across all component libraries)
  - Enables debugging production issues without code changes or rebuilding
  - Example: `window.components['svelte-spa-router'].logging.setCategoryLevel('ROUTER:NAVIGATION', 'debug')`

## [5.0.0] - 2025-01-17 ✅ Published

### Changed
- **Code Quality:** Major ESLint cleanup - reduced linting issues from 161 to 11 (93% reduction)
  - Removed unused imports across multiple modules (hierarchyLogger, location, untrack, hasRoute, etc.)
  - Removed unused function parameters in test files
  - Replaced unused catch error variables with bare catch blocks
  - Added `src/lib/vendor/**` to eslint ignore list (third-party loglevel library)
  - Remaining 11 warnings are false positives from ESLint not understanding Svelte 5 runes
  - **Note:** If issues arise, this cleanup touched error-handler, hierarchy, navigation-guard, permissions, querystring-helpers, route-metadata, utils, and all test files
- **Logger API:** Renamed `enableCategory()` to `setCategoryLevel()` for better clarity
  - Old name was confusing: `enableCategory('ROUTER:SCROLL', 'silent')` reads as "enable to disable"
  - New name is explicit: `setCategoryLevel('ROUTER:SCROLL', 'silent')` clearly sets the level
  - Added `'silent'` to TypeScript type definitions for level parameter
  - No backward compatibility - clean break for clearer API

### Fixed
- **Breaking:** Standardized Router callback prop naming to camelCase (JavaScript convention)
  - `onrouteLoading` → `onRouteLoading`
  - `onrouteLoaded` → `onRouteLoaded`
  - `onconditionsFailed` → `onConditionsFailed`
  - `onNotFound` remains unchanged (already correct)
  - Updated all documentation, examples, tests, and showcase site
  - **Migration:** Update your Router component props to use camelCase naming
- **Permissions:** Completely redesigned unauthorized handling system
  - Previously required manual `/unauthorized` route definition and `onUnauthorized` callback with hash-based navigation
  - New system treats unauthorized state as special router state (like 404), not a regular route
  - `/unauthorized` route no longer needs to be defined in routes object
  - Respects configured routing mode (hash/history) instead of forcing hash navigation
  - Two behavior modes available:
    - `unauthorizedBehavior: 'component'` - Shows unauthorized component without changing URL (default)
    - `unauthorizedBehavior: 'navigate'` - Navigates to configured unauthorized route
  - Configure via `configurePermissions()` with new options: `unauthorizedBehavior`, `unauthorizedRoute`, `unauthorizedComponent`
  - Router automatically detects permission failures by checking `routeContext.permissions`
  - `createPermissionCondition()` only calls `onUnauthorized` handler if explicitly configured (backward compatibility)
  - Added internal `hasExplicitHandler()` tracking to distinguish explicit callbacks from defaults
  - **Migration:** Old `onUnauthorized` callback approach still works, new declarative config recommended
- **Referrer Tracking:** Fixed referrer not being preserved on browser back/forward navigation
  - Previously, pressing back button would show chronological previous route as referrer instead of original referrer
  - Example: `/` → `/links` (referrer: `/`) → `/query` (referrer: `/links`) → [BACK] → `/links` showed referrer `/query` (wrong!) instead of `/` (correct)
  - Root cause: navigationContext with referrer was calculated by router but never saved to history.state
  - Solution: Router now saves calculated navigationContext (with referrer) back to history.state after route loads
  - Added serialization handling for Proxy objects in params (uses JSON serialization fallback when structuredClone fails)
  - Applied to both hash mode and history mode navigation
  - Navigation sequence tracking now correctly increments on forward and decrements on back
  - `goBack()` function simplified to use native browser back (`window.history.back()`) instead of manual push
  - Referrer and scroll position now automatically restored from history.state on back/forward navigation
- **Permissions:** Fixed `createProtectedRoute()` failing with synchronous component imports
  - Error: "Cannot read properties of undefined (reading 'before')" when using sync imports like `component: AdminPanel`
  - Root cause: `createProtectedRouteDefinition()` always treated components as async, causing Router to call component constructor as function returning `undefined`
  - Solution: Detect sync vs async components - use `component` key for sync (let wrap() handle Promise wrapping) and `asyncComponent` key for async
  - Now supports both patterns: `component: AdminPanel` (sync) and `component: () => import('./Admin.svelte')` (async)
  - Async detection: `typeof component === 'function' && component.length === 0`

## [5.0.0-rc12] - 2025-02-12 ✅ Published

### Fixed
- **Critical:** Fixed missing TypeScript source files in published npm package
  - Added `src/lib/**/*.ts` to `package.json` files field
  - Fixes build error: `Rollup failed to resolve import "@keenmate/svelte-spa-router/logger"`
  - The `logger.ts` file was missing from rc11 npm package, breaking production builds
- Removed deprecated `setDebugLoggingEnabled()` and `getDebugLoggingEnabled()` type declarations from `utils.d.ts`
  - These functions were removed in rc11 but TypeScript definitions remained, causing confusion
  - Use new API: `import { enableLogging, disableLogging } from '@keenmate/svelte-spa-router/logger'`
- Added missing TypeScript definitions for `helpers/hierarchy` module
  - Created `src/lib/helpers/hierarchy.d.ts` with full type support for `createHierarchy()`
  - Includes `HierarchyNode`, `HierarchyTree`, and `CreateHierarchyOptions` interfaces
- Fixed logger type resolution in package.json exports
  - Changed `"types": "./src/lib/logger.d.ts"` to `"types": "./src/lib/logger.ts"`
  - TypeScript now correctly resolves types from the source file

## [5.0.0-rc11] - 2025-02-01

### Changed

#### BREAKING: Logging System Migration to loglevel
- **Migrated from custom logging to loglevel library** (~1KB) with hierarchical categories
  - Consistent with `@keenmate/web-multiselect` logging implementation
  - Uses vendored `loglevel` and `loglevel-plugin-prefix` libraries (ESM versions)
  - **Breaking API change**: `setDebugLoggingEnabled()` replaced with new API
    - Old: `import { setDebugLoggingEnabled } from '@keenmate/svelte-spa-router/utils'`
    - New: `import { enableLogging, disableLogging, setLogLevel, setCategoryLevel } from '@keenmate/svelte-spa-router/logger'`
  - **12 hierarchical categories** for granular control:
    - `ROUTER` - Core routing pipeline, route matching
    - `ROUTER:NAVIGATION` - push, pop, replace, goBack
    - `ROUTER:SCROLL` - Scroll restoration
    - `ROUTER:GUARDS` - Navigation guards
    - `ROUTER:CONDITIONS` - Route condition checks
    - `ROUTER:HIERARCHY` - Hierarchical route inheritance
    - `ROUTER:PERMISSIONS` - Permission checking
    - `ROUTER:ROUTES` - Named routes and URL building
    - `ROUTER:ZONES` - Multi-zone routing
    - `ROUTER:METADATA` - Breadcrumbs and route metadata
    - `ROUTER:ERROR_HANDLER` - Global error handling
    - `ROUTER:FILTERS` - Filter parsing
  - **Enhanced output format**: \`[HH:MM:SS.mmm] [LEVEL] [CATEGORY] message\`
  - **Color-coded by log level**: Blue (debug), Green (info), Orange (warn), Red (error)
  - **Per-category control**: Enable specific categories at different log levels
    \`\`\`javascript
    disableLogging()  // Disable all
    setCategoryLevel('ROUTER:SCROLL', 'debug')  // Enable only scroll logs
    setCategoryLevel('ROUTER:NAVIGATION', 'info')  // Navigation at info level
    \`\`\`
  - **Global level control**: \`setLogLevel('warn')\` to set all categories at once
  - Removed \`src/lib/internal/logging.js\` (custom implementation)
  - Added \`src/lib/logger.ts\` (loglevel-based implementation)
  - Added \`src/lib/vendor/loglevel/\` with ESM library files

### Fixed
- Fixed ESM import error with loglevel library (\`Cannot set properties of undefined\`)
  - Switched from UMD to ESM versions of vendored libraries
  - Added wrapper files (\`index.js\`, \`prefix.js\`) for proper ES module imports

## [5.0.0-rc10] - 2025-02-01

### Added

#### Debug Logging System
- **Category-based debug logging** - Built-in debug logging to troubleshoot routing issues during development
  - **`setDebugLoggingEnabled()` function** - Enable/disable debug logging with a single call
    - Simple on/off control - no complex configuration needed
    - Disabled by default to keep production consoles clean
    - Example: `setDebugLoggingEnabled(import.meta.env.DEV)`
  - **`getDebugLoggingEnabled()` function** - Check current debug logging state
  - **Color-coded console output** - Easy visual distinction between log categories
    - `[Router]` logs in orange (#ff3e00) - Route matching, component loading, guard execution, metadata updates
    - `[Router:Utils]` logs in green (#10b981) - Navigation functions (push, pop, replace, goBack), scroll restoration
  - **Multiple log levels** - debug, info, warn, error for different severity
  - **Zero overhead when disabled** - If checks can be eliminated by bundlers in production
  - **Internal architecture** - Generic logging utility (`src/lib/internal/logging.js`) not exposed to users
    - `createLogger(category, prefix, color)` factory function
    - `enableLoggingCategory()` / `disableLoggingCategory()` for granular control
    - Logger instances: `routerLogger`, `utilsLogger`
  - **Configuration warnings unaffected** - Critical configuration errors always show regardless of debug setting
  - **Example output**:
    ```
    [Router] Running pipeline for: /document/123
    [Router] Route loaded successfully: /document/:id
    [Router:Utils] Called - navigationContext: { source: 'menu' }
    [Router] Scroll effect triggered - restoreScrollState: true
    ```
  - **TypeScript support** - Full type definitions with comprehensive JSDoc
  - Package export: `@keenmate/svelte-spa-router/utils` (setDebugLoggingEnabled, getDebugLoggingEnabled)

## [5.0.0-rc09] - 2025-01-30

### Added

#### Tree/Nested Route Structure (Alternative API)
- **`createHierarchy()` helper** - Define routes in a tree structure as an alternative to flat definitions
  - Child paths automatically concatenated to parent paths (relative paths)
  - Routes automatically inherit breadcrumbs, permissions, conditions, and authorization from parents
  - Optional route names - only add when needed for programmatic navigation
  - Coexists seamlessly with flat route definitions
  - Example:
    ```javascript
    import { createHierarchy } from '@keenmate/svelte-spa-router/helpers/hierarchy'

    const routes = createHierarchy({
        '/admin': {
            name: 'admin',
            component: AdminLayout,
            breadcrumbs: [{ label: 'Admin' }],
            permissions: { any: ['admin'] },
            children: {
                'users': {
                    name: 'adminUsers',
                    component: AdminUsers,
                    breadcrumbs: [{ label: 'Users' }],
                    children: {
                        ':id': {
                            name: 'adminUserDetail',
                            component: AdminUserDetail
                        }
                    }
                }
            }
        }
    })
    // Results in: /admin, /admin/users, /admin/users/:id
    ```
  - Requires hierarchical mode enabled: `setHierarchicalRoutesEnabled(true)`
  - Package export: `@keenmate/svelte-spa-router/helpers/hierarchy`

#### Named Routes Enhancement
- **`getRouteByName()` function** - Get route pattern by name
  - Returns the path pattern for a registered route name
  - Useful for testing and debugging
  - Example: `getRouteByName('documentDetail')` returns `'/documents/:documentId'`

#### Automatic Referrer Tracking System
- **Configurable referrer tracking** - Router automatically tracks previous route information and injects it into navigationContext
  - **`setIncludeReferrer()` configuration** - Control when referrer info is injected
    - `'never'` - Disable referrer tracking (default)
    - `'notfound'` - Only inject referrer for 404/NotFound routes
    - `'always'` - Inject referrer for all route navigations
  - **Referrer object structure** - Complete information about the previous route:
    - `location` - Previous route path (e.g., '/documents/123')
    - `querystring` - Previous route query string (e.g., 'tab=info&view=grid')
    - `params` - Previous route parameters object (e.g., { id: '123' })
    - `routeName` - Previous route name if it was registered (e.g., 'documentDetail'), or URL path as fallback
  - **NotFound integration** - When catch-all route (`'*'`) matches, router automatically injects:
    - `attemptedRoute` - The URL that was not found
    - `attemptedQuerystring` - Query string from the attempted route
    - `referrer` - Complete previous route information (see structure above)
  - **Zero programmer effort** - Works automatically once configured
  - **Safe "Go Back" implementation** - Using `push()` with explicit URL instead of `history.back()`
    - Safer than `history.back()` which breaks with `replace()` navigation
    - Allows conditional logic (e.g., don't go back to unauthorized routes)
    - Supports custom fallback destinations
  - **Works correctly with both `push()` and `replace()` navigation**
  - **Timing behavior** - On first navigation after referrer is updated, component $effects may run twice:
    - First run: location changes but referrer not yet injected (sees undefined)
    - Second run: navigationContext updates with referrer (sees correct value)
    - This is expected Svelte 5 behavior and doesn't affect functionality
    - Subsequent navigations are smooth with single $effect run
    - UI always renders correctly on the second run
  - **Example usage in NotFound component**:
    ```javascript
    const navContext = $derived(navigationContext())
    const referrer = $derived(navContext?.referrer)
    const canGoBack = $derived(referrer?.location && referrer.location !== '/')

    function goBack() {
        const returnPath = referrer?.location || '/'
        const returnQuery = referrer?.querystring
        const returnUrl = returnQuery ? `${returnPath}?${returnQuery}` : returnPath
        push(returnUrl)
    }
    ```
  - **Example usage in protected routes** (avoid going back to authorization failures):
    ```javascript
    const navContext = $derived(navigationContext())
    const referrer = $derived(navContext?.referrer)
    const returnPath = $derived(referrer?.location || navContext?.returnTo || '/')
    const returnQuery = $derived(referrer?.querystring || navContext?.returnQuery)

    // Referrer tracks last SUCCESSFULLY loaded route, not attempted routes that failed auth
    ```
  - Example implementations:
    - `example/src/routes/NotFound.svelte` - 404 page with "Go Back"
    - `example/src/routes/Unauthorized.svelte` - Authorization failure with safe "Go Back"
    - `example/src/routes/User.svelte` - Regular page with referrer-based navigation
    - `example/src/routes/ReferrerDemo.svelte` - Comprehensive demo with console logging

- **`setNavigationContext()` function** - Exported for advanced use cases
  - Allows manual setting of navigation context
  - Used internally by router for referrer auto-injection
  - Example: `setNavigationContext({ customData: 123 })`

### Fixed

#### Named Routes Navigation
- **Fixed `push()` and `replace()` with single-argument named routes** - Resolved "Invalid parameter location" error
  - Issue: Calling `push('routeName')` with a single named route argument threw error
  - Root cause: Legacy signature detection treated non-slash strings as href paths instead of named routes
  - Solution: Added check in legacy signature branch - strings without leading `/` or `#/` are treated as named routes
  - Now works: `push('about')`, `push('userProfile')`, `replace('home')`
  - Multi-param signature still required for routes with params: `push('userProfile', {id: 123})`

#### Hierarchical Routes & Breadcrumb System
- **Fixed infinite loop in route metadata updates** - Resolved state comparison issues causing Router to re-render continuously
  - Issue: Router's `$effect()` was triggering on every update due to `routeContext` object reference changes
  - Root cause: `updateRouteMetadata()` created new objects every call, even when values didn't change
  - Solution 1: Added `lastAssignedContext` reference tracking to only update when context reference actually changes
  - Solution 2: Implemented route key tracking (`${location}|${querystring}|${JSON.stringify(params)}`) to detect real route changes vs metadata updates
  - Fixed `$state` proxy comparison warnings by using `$state.snapshot()` for value comparisons

- **Breadcrumb cache system for preserving manual updates** - Child route navigation no longer resets dynamic breadcrumbs to "Loading..."
  - Issue: Navigating from `/documents/1` to `/documents/1/logs` reset "Document 1" breadcrumb back to "Loading..."
  - Root cause: Router composed fresh breadcrumbs on every route change, losing manual `updateBreadcrumb()` calls
  - Solution: Implemented breadcrumb cache (`updatedBreadcrumbsCache` Map) to preserve manual updates across child route navigation
  - Cache intelligently clears only when navigating to different base routes (not child routes)
  - `updateBreadcrumb(id, updates)` stores updates in cache, Router applies them during breadcrumb composition

- **Child component breadcrumb initialization pattern** - Direct child route reloads now show correct parent breadcrumbs
  - Issue: Reloading `/documents/1/logs` directly showed "Loading..." for parent breadcrumb because parent component never mounted
  - Pattern: Child components call `updateBreadcrumb()` in `onMount()` to update their parent's dynamic breadcrumbs
  - Example: DocumentLogs component updates 'documentDetail' breadcrumb with actual document name on mount
  - Works with breadcrumb cache to ensure updates persist across subsequent child navigation
  - Applied to all child components in test apps: DocumentLogs, DocumentPermissions, DocumentHistory, AdminUserPermissions, AdminUserActivity

### Documentation
- **Added comprehensive documentation showcase** - New SvelteKit-based documentation site
  - Built with @keenmate/svelte-docs for consistent styling and components
  - Complete API reference with all functions, parameters, and return types
  - Feature guides: Routing Modes, Route Configuration, Parameters, Guards, Named Routes, Programmatic Navigation, Querystring, Filters, Permissions, Multi-Zone Routing, Hierarchical Routes, Nested Routes
  - Interactive code examples with syntax highlighting
  - Live demo apps for both hash and history modes
  - Deployed at https://svelte-spa-router.keenmate.dev
  - Demo apps: https://history.svelte-spa-router.keenmate.dev and https://hash.svelte-spa-router.keenmate.dev
- **Added Multi-Zone Routing documentation** - Comprehensive guide for multi-zone layouts
  - New showcase page at `/features/multi-zone`
  - Visual diagram showing zone layout structure
  - Complete examples: route configuration, layout setup, zone components
  - Covers async loading, route parameters, guards, permissions, and metadata in zones
  - Use cases: admin dashboards, email clients, music players, document editors
  - Best practices and responsive layout patterns
- **Updated CLAUDE.md** - Added comprehensive section on tree/nested route structure
- **Added examples** - Tree structure examples in main example app

## [5.0.0-rc08] - 2025-10-26

### Breaking Changes
- **BREAKING: Renamed `params` to `routeParams`** for clarity
  - Component prop: `let { params } = $props()` → `let { routeParams } = $props()`
  - Function call: `params()` → `routeParams()`
  - This makes it immediately clear these are route parameters from URL patterns
  - Update all route components to use `routeParams` instead of `params`
  - TypeScript: `params<T>()` → `routeParams<T>()`

## [5.0.0-rc07] - 2025-10-26

### Fixed
- **Critical: Tree-shaking issue in production builds** - Added `sideEffects` field to package.json to prevent Vite from incorrectly tree-shaking `.svelte` and `.svelte.js` files during production builds
  - Fixes "link is not defined" and similar errors in production builds with npm package
  - `.svelte.js` files contain Svelte 5 runes (`$state`, `$derived`, `$effect`) at module level which have side effects and must not be tree-shaken
  - Issue only affected production builds, not development mode

## [5.0.0-rc06] - 2025-10-26

### Added

#### Multi-Parameter Navigation & Strict Parameter Replacement
- **Multi-parameter signature for `push()` and `replace()`** - Natural function call style
  - `push(route, routeParams, queryString, navigationContext)`
  - `replace(route, routeParams, queryString, navigationContext)`
  - Route resolution: Starts with `/` = exact path, otherwise = named route lookup
  - Examples: `push('userProfile', { userId: 123 }, { tab: 'settings' })`
  - Backward compatible with all existing formats (string, array, object)

- **4-element array support** - Navigation context in arrays
  - `push(['route', params, query, navigationContext])`
  - `link={['route', params, query, navigationContext]}`
  - Example: `<a use:link={['bookDetail', {bookId: 123}, {tab: 'reviews'}, {source: 'list'}]}>`

- **Strict parameter replacement with placeholder**
  - `setParamReplacementPlaceholder(value)` - Configure placeholder for missing params (default: 'N-A')
  - Missing params replaced with placeholder instead of being removed
  - Predictable URLs: `/users/:userId/:section` with missing section → `/users/123/N-A`
  - Triggers `onNotFound` callback for error tracking

#### Resource-Based Authorization
- **`authorizationCallback` parameter for `createProtectedRoute()`** - Combine role + resource checks
  - Supports both role-based (permissions) and resource-based (authorizationCallback) authorization
  - Conditions execute in order: permissions first (fast), then authorizationCallback (API call)
  - Example: Check if user has 'editor' role, then check if they can access specific document
  - Perfect for document access, resource ownership, dynamic permissions
  - Callback receives full route detail: `{ route, location, params, query, routeContext, navigationContext }`

#### Global Error Handler System
- **Production-ready global error handler** for catching and recovering from unhandled errors
  - `configureGlobalErrorHandler()` - Configure error handling behavior in `main.js`
  - `GlobalErrorHandler` component - Wraps your app and catches all errors
  - `ErrorDisplay` component - Beautiful default error UI with recovery options
  - **Recovery Strategies**: `navigateSafe`, `restart`, `showError`, `custom`
  - **Loop Prevention**: SessionStorage-based restart tracking prevents infinite reload loops
  - **Custom Callbacks**: `onError` for logging/monitoring, `onRecover` for custom recovery logic
  - **Helper Functions**: `restart()`, `navigate()`, `showError()`, `canRestart()`, `getRestartCount()`
  - **Error Filtering**: Ignore known non-critical errors (ResizeObserver, etc.)
  - **UI Options**: Toast notifications, full-page error component, or custom error component
  - **TypeScript Support**: Full type definitions for all APIs
  - **Example Integration**: Working demo with Sentry integration example

#### 404 Not Found Tracking
- **`onNotFound` callback on Router component** - Track 404s for analytics/monitoring
  - Fires when catch-all route (`'*'`) matches (user sees 404 page)
  - Fires when no route matches at all (no 404 page defined)
  - Perfect for logging to Sentry, Google Analytics, or other monitoring services
  - Event detail includes `{ location, querystring }`
  - Example: `<Router {routes} onNotFound={(e) => Sentry.captureMessage('404', { extra: e.detail })} />`

#### Convenient Route Creation API
- **New `createRoute()` and `createRouteDefinition()` functions** for easier route configuration
  - `createRoute()` - Returns already wrapped component (most convenient, no `wrap()` needed)
  - `createRouteDefinition()` - Returns route definition for use with `wrap()` (advanced use)
  - Consistent API pattern matching `createProtectedRoute()` / `createProtectedRouteDefinition()`
  - Support for `title` and `breadcrumbs` metadata directly in route options
  - Automatic detection of sync vs async components

- **Enhanced Permission System**
  - `createProtectedRoute()` - Now returns already wrapped component (breaking change from definition-only)
  - `createProtectedRouteDefinition()` - New function that returns definition (replaces old `createProtectedRoute()` behavior)
  - Maintains backward compatibility for existing `wrap(createProtectedRoute(...))` usage

- **Route Metadata Support**
  - `title` - Set page title for routes
  - `breadcrumbs` - Define breadcrumb trail with `{ label, path? }` structure
  - Metadata stored in `routeContext` object, accessible in route events and components

#### Dynamic Metadata & Loading Control
- **Reactive Metadata Helpers**: `helpers/route-metadata.svelte.js`
  - `routeTitle()` - Get current route title reactively
  - `routeBreadcrumbs()` - Get current breadcrumb trail reactively
  - `routeContext()` - Get full route context reactively
  - `updateRouteMetadata(routeContext)` - Update metadata after data loads (e.g., change title from "Document" to "Invoice.pdf")
  - **`updateTitle(title)` - Update just the title** (simpler than updateRouteMetadata)
  - **`updateBreadcrumb(id, updates)` - Partial breadcrumb updates** (update specific segments by ID)
  - Automatically updated by Router on route changes

- **Partial Breadcrumb Updates** (NEW!)
  - Add `id` property to breadcrumb items in route config: `{ id: 'docDetail', label: 'Loading...', path: '/doc/:id' }`
  - Update specific breadcrumbs after data loads: `updateBreadcrumb('docDetail', { label: 'Invoice.pdf', path: '/doc/123' })`
  - **No need to replace the entire breadcrumbs array** - only update what changes!
  - Perfect for nested paths: `/documents/:id/logs/:logId` where each segment needs dynamic data
  - Static segments (Home, Documents, etc.) stay unchanged

- **Flexible Loading Control** with `shouldDisplayLoadingOnRouteLoad` flag
  - **Pattern 1 (Router-managed with loadingComponent)**: Set `shouldDisplayLoadingOnRouteLoad: true` - Router keeps loading component visible until component calls `hideLoading()`
  - **Pattern 2 (Component-managed)**: Default behavior - component handles its own loading state
  - **Pattern 3 (Global overlay)**: User-defined global loading UI in App.svelte that reacts to `routeIsLoading()`
  - `showLoading()` - Manually show loading state (triggers global overlay if defined)
  - `hideLoading()` - Component signals data is loaded (hides loading component/overlay)
  - `routeIsLoading()` - Check if route is currently loading (reactive state)
  - Perfect for routes that fetch data and need dynamic titles/breadcrumbs
  - Supports multi-zone layouts (toolpanel + content) with different loading UIs per zone

**Use cases**:
- Document detail page: Show "Document" while loading, then "Invoice template.pdf" after data loads
- User profile: Show "User Profile" while loading, then "John Doe" after data loads
- Product page: Show "Product" while loading, then "iPhone 15 Pro" after data loads
- Nested paths: `/documents/:id/logs` where both document name and "Logs" need to be in breadcrumbs

#### Named Routes Enhancement
- **Array/Object Syntax for Navigation**: `push()` and `replace()` functions now support the same convenient array/object syntax as the `link` action
  - Array format: `push(['userProfile', { userId: 123 }, { tab: 'settings' }])`
  - Object format: `push({ route: 'userProfile', params: { userId: 123 }, query: { tab: 'settings' } })`
  - String format (legacy): `push('/about')` - still fully supported for backward compatibility
  - Eliminates the need to manually call `buildUrl()` for programmatic navigation
  - See `example-history/src/routes/LinksDemo.svelte` for interactive demos

### Added - Querystring & Filter System

#### Querystring Helpers
- **Shared Reactive State**: `helpers/querystring.svelte.js`
  - `configureQuerystring(options)` - Configure querystring parsing for entire app
  - `query<T>()` - Get reactive parsed querystring with TypeScript generics
  - Auto-detection of array formats (repeat vs comma-separated)
  - Configure once, use everywhere pattern

- **Querystring Utilities**: `helpers/querystring-helpers.svelte.js`
  - `parseQuerystring(qs, options)` - Parse querystring with array format support
  - `stringifyQuerystring(obj, options)` - Convert object to querystring
  - `getParsedQuerystring(options)` - Get parsed querystring (non-reactive)
  - `updateQuerystring(updates, options)` - Update URL querystring (partial or full)
  - `createQuerystringHelpers(parser, stringifier)` - Custom parser support

- **Array Format Support**:
  - `'auto'` (default) - Auto-detects both repeat and comma formats
  - `'repeat'` - `?tags=foo&tags=bar` (multiple parameters with same key)
  - `'comma'` - `?tags=foo,bar,baz` (comma-separated values)

#### Filter System
- **Flexible Filters**: `helpers/filters.svelte.js`
  - `configureFilters(options)` - Configure filter mode and parsing
  - `filters<T>()` - Get reactive parsed filters with TypeScript generics
  - `updateFilters<T>(updates, options)` - Update filters with type safety
  - `getFiltersConfig()` - Get current filter configuration

- **Dual Mode Support**:
  - **Flat Mode** (default): Each filter as separate query parameter
    - Example: `?search=java&category=books&status=active`
  - **Structured Mode**: Single parameter with custom syntax
    - Example: `?$filter=search eq 'java' AND category eq 'books'`
    - Supports custom parse/stringify functions for OData, Microsoft Graph API, etc.

#### TypeScript Support
- Full generic support for type-safe parameter access:
  - `params<T>()` - Route parameters with intellisense
  - `query<T>()` - Query parameters with intellisense
  - `filters<T>()` - Filter parameters with intellisense
  - `updateFilters<T>(updates, options)` - Type-safe filter updates

#### Value Handling
- **Filters**:
  - `undefined` - Always removes the parameter
  - `null` - Keeps parameter with empty value
- **Querystring**:
  - `undefined` - Always removes the parameter
  - `null` - Controlled by `dropNull` option (default: true removes it)
  - Empty string - Controlled by `dropEmpty` option (default: false keeps it)

#### Example Applications
- `example-history/src/routes/QuerystringDemo.svelte` - Interactive querystring demo
- `example-history/src/routes/FiltersDemo.svelte` - Filter system with products demo
- `example-history/src/routes/RouteDataDemo.svelte` - Route data extraction examples

### Fixed

#### Router Core Fixes
- **Router Initialization**: Fixed location state initialization to be reactive to config changes
  - Issue: Direct URL access (e.g., `http://localhost:5050/querystring-demo`) showed homepage
  - Solution: Changed from `$state(getLocation())` to `$derived.by()` to react to config changes
  - Now correctly reads `setHashRoutingEnabled()` before initializing location state

#### Loading State Fixes
- **Component Double Mounting**: Fixed race condition causing components to mount twice
  - Issue: Router template had component in two separate `{:else if}` blocks - one hidden, one visible
  - When `isWaitingForData` changed, Svelte unmounted from first block and remounted in second
  - Resulted in `onMount()` running twice, causing duplicate data fetches and delays
  - Solution: Refactored template to keep component in single block with `style:display` toggle
  - Component now mounts once and visibility is controlled via CSS

- **Component Params Not Available on Mount**: Fixed params being empty when component loads
  - Issue: Router set `isWaitingForData = true` and waited for `hideLoading()` BEFORE setting `componentParams`
  - Component mounted without params, causing "params not ready" errors
  - Solution: Moved `componentParams`, `componentProps`, `componentrouteContext` assignment BEFORE waiting logic
  - Component now has access to params immediately on mount

- **Global vs Route Loading Conflict**: Fixed overlapping loading indicators
  - Issue: Both global loader and route-specific loader showed simultaneously
  - Solution: Added `shouldShowGlobalLoading()` helper that only returns true when route doesn't have custom loading
  - Added `hasCustomLoadingComponent` flag set by `startRouteLoading(hasCustomComponent)`
  - Global loader now only shows for routes without custom loading components

- **Manual Loading Not Showing**: Fixed `showLoading()` not displaying global loader
  - Issue: `showLoading()` set `isRouteLoading = true` but didn't reset `hasCustomLoadingComponent` flag
  - If current route had custom loading, `shouldShowGlobalLoading()` returned false
  - Solution: Made `showLoading()` also set `hasCustomLoadingComponent = false`
  - Manual loading triggers now correctly show global loader

#### Authorization & Navigation Context Fixes
- **"Go Back" After Unauthorized**: Fixed return navigation after authorization failures
  - Issue: Unauthorized page's "Return to Home" button always went to home instead of previous location
  - Root cause: Using `push('/unauthorized', { data })` was ambiguous - interpreted as routeParams instead of navigationContext
  - Solution: Changed all unauthorized redirects to use explicit 4-parameter signature: `push(route, {}, {}, navContext)`
  - Added `returnTo` and `returnQuery` to navigation context for proper "Go Back" functionality
  - Unauthorized page now displays "Go Back" button when `returnTo` is available

- **Document Authorization Navigation**: Fixed document access redirects
  - Updated `authorizationCallback` to pass `returnTo` and `returnQuery` via navigationContext
  - Fixed "View Document" buttons to pass navigation context for proper back navigation
  - All authorization demo flows now preserve return path for better UX

#### Protected Route Fixes
- **Async Component Params Empty**: Fixed params not being passed to protected routes
  - Issue: `createProtectedRouteDefinition` was using `asyncComponent: component` which caused wrap() to double-wrap async imports
  - Solution: Kept `asyncComponent: component` which properly passes async imports to wrap()
  - Protected routes now receive params correctly when using `() => import('./Component.svelte')`

#### Example Application Fixes
- **Missing Routes**: Added missing example routes
  - Added `/about` route (About component)
  - Added `/user/:first/:last?` route (User component with optional last name)
  - Links in LinksDemo now work correctly

- **Navigation Context Demo**: Fixed incorrect route paths and push signatures
  - Changed `/context-demo` references to correct `/navigation-context-demo` route
  - Fixed `backToList()` function to navigate to correct route
  - Updated code examples to show proper 4-parameter signature
  - Fixed "View" and "Edit" buttons to use correct navigation context syntax

- **HTML Entity Escaping**: Fixed Svelte parse errors
  - Changed unescaped `{}` in code examples to HTML entities `&#123;&#125;`
  - Prevents Svelte from treating them as reactive expressions

### Documentation
- Updated `README.md` with comprehensive querystring and filter system documentation
- Added TypeScript generic examples throughout
- Added Quick Reference section with all available imports
- Updated main features list to highlight TypeScript and URL helpers

## [1.0.0] - 2024

### Package Information

- **Package Name:** @keenmate/svelte-spa-router
- **Publisher:** KeenMate (https://keenmate.com)
- **Repository:** https://github.com/keenmate/svelte-spa-router

### Added - Svelte 5 Conversion

#### Core Router
- Complete rewrite using Svelte 5 runes (`$state`, `$props`, `$effect`)
- Reactive location tracking with rune-based state management
- Event handlers converted from `on:` directives to callback props
- Maintained full backward compatibility in route definition syntax

#### Dual-Mode Routing System
- **Hash Mode (Default)**: Traditional hash-based routing (`#/path`)
  - No configuration required
  - Works everywhere, including `file://` protocol
  - Perfect for static hosting

- **History Mode (New)**: Clean URL routing (`/path`)
  - Uses History API for clean URLs without hash
  - Supports modifier keys (Ctrl+Click to open in new tab)
  - Respects `target` attribute on links
  - Requires server configuration to serve index.html for all routes

#### Configuration Functions
- `setHashRoutingEnabled(boolean)` - Toggle between hash and history mode
- `setBasePath(string)` - Set base path for history mode
- `getHashRoutingEnabled()` - Get current routing mode
- `getBasePath()` - Get current base path

#### Permission System (New)
- `helpers/permissions.svelte.js` - Comprehensive RBAC system
- `configurePermissions(config)` - Setup permission checking logic
- `createPermissionCondition(requirements)` - Create route guards
- `createProtectedRoute(options)` - Helper for protected routes
- `hasPermission(requirements)` - UI-level permission checking
- Support for `any` (OR) and `all` (AND) permission logic
- Flexible integration with existing route guards

#### URL Helpers
- `helpers/url-helpers.svelte.js` - Path manipulation utilities
- `joinPaths(...paths)` - Intelligent path joining with slash handling

#### Enhanced Active Link Detection
- Updated to work with both hash and history modes
- Automatic CSS class application on matching routes
- Pattern matching support

### Changed

#### Naming Changes (Non-Breaking in Usage, Breaking for Type Imports)
- **`userData` → `routeContext`**: Renamed for clarity
  - Refers to static route-level configuration data
  - `wrap({ routeContext: { ... } })`
  - `routeContext()` helper function
  - All TypeScript interfaces updated

- **`context` → `navigationContext`**: Renamed for clarity
  - Refers to dynamic data passed during navigation (doesn't appear in URL)
  - `push('/path', { orderId: 123 })` - second parameter is navigationContext
  - `navigationContext()` accessor function
  - `wrap({ navigationContext: { ... } })`

These changes clarify the distinction between:
- **routeContext**: Static metadata defined in route configuration
- **navigationContext**: Dynamic data passed at navigation time (WinForms-like experience)

#### API Changes (Breaking)
- **Stores → Functions**:
  - `$location` → `location()`
  - `$querystring` → `querystring()`
  - `$params` → `params()`
  - `$loc` → `loc()`

- **Events → Props**:
  - `on:routeLoading` → `onrouteLoading`
  - `on:routeLoaded` → `onrouteLoaded`
  - `on:conditionsFailed` → `onconditionsFailed`
  - `on:routeEvent` → `onrouteEvent`

- **Component Props**:
  - `export let params` → `let { params } = $props()`

- **Reactive Subscriptions**:
  - `.subscribe()` → `$effect(() => { ... })`

### Unchanged (Backward Compatible)

- ✅ Route definition syntax (same object/Map structure)
- ✅ `push()`, `pop()`, `replace()` navigation functions
- ✅ `link` action for anchor tags
- ✅ `active` action for link highlighting
- ✅ `wrap()` utility for async components and conditions
- ✅ Route guards/pre-conditions
- ✅ Dynamic imports and code-splitting
- ✅ Nested routers with prefix
- ✅ Scroll restoration
- ✅ Loading components

### Documentation

#### New Files
- `CONTEXT.md` - Comprehensive project overview
- `CHANGELOG.md` - This file
- `DEVELOPMENT.md` - Development workflow guide
- `MIGRATION.md` - Detailed v4 → v5 migration guide
- `HASHLESS_MERGE_PLAN.md` - Technical implementation notes

#### Updated Files
- `README.md` - Added routing modes and permission system documentation
- `package.json` - Updated exports for new modules

### Examples

- `example/` - Hash mode example (updated for Svelte 5)
- `example-history/` - History mode example (new)

### Infrastructure

- ESLint configuration for Svelte 5
- Makefile for cross-platform development commands
- Package exports for all modules

## Migration Guide

See [MIGRATION.md](./MIGRATION.md) for detailed instructions on upgrading from v4 to v5.

### Quick Migration Checklist

1. ✅ Update imports: `svelte-spa-router` → `@keenmate/svelte-spa-router`
2. ✅ Change stores to functions: `$location` → `location()`
3. ✅ Update event handlers: `on:routeLoaded` → `onrouteLoaded`
4. ✅ Convert component props: `export let params` → `let { params } = $props()`
5. ✅ Replace subscriptions with `$effect`
6. ✅ Test all routes and navigation

### Optional: Enable History Mode

```javascript
// main.js
import { setHashRoutingEnabled, setBasePath } from '@keenmate/svelte-spa-router/utils'

setHashRoutingEnabled(false)
setBasePath('/')

mount(App, { target: document.body })
```

### Optional: Add Permission System

```javascript
// main.js
import { configurePermissions } from '@keenmate/svelte-spa-router/helpers/permissions'

configurePermissions({
  checkPermissions: (user, requirements) => {
    // Your permission logic
  },
  getCurrentUser: () => getCurrentUser(),
  onUnauthorized: (detail) => push('/unauthorized')
})
```

## Browser Compatibility

- **Svelte 5**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Hash Mode**: All browsers including IE10+
- **History Mode**: All browsers with History API support (IE10+)
- **Permissions**: All modern browsers

## Dependencies

### Runtime
- `regexparam@2.0.2` - Route pattern matching

### Peer Dependencies
- `svelte@^5.0.0` - Required

### Dev Dependencies
- `eslint@^9.0.0` - Code linting

## Credits

- **Publisher:** KeenMate (https://keenmate.com)
- **Original svelte-spa-router:** Alessandro Segala (@ItalyPaleAle)
- **Svelte 5 Conversion:** KeenMate team
- **History Mode:** Adapted from svelte-spa-router-hashless
- **Permission System:** KeenMate team

## License

MIT License - See [LICENSE.md](./LICENSE.md)
