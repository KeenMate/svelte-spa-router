# e2e — Playwright suite

Browser tests for `@keenmate/svelte-spa-router`, run against the example app in
history mode (`example/`, port 5050). Each spec targets a dedicated, minimal
fixture page under `example/src/routes/test/` — kept separate from the demo
routes (which double as docs and change over time) so assertions stay stable.

## Run

```bash
npm install                  # root deps (includes @playwright/test)
npm run test:e2e:install     # one-time: download chromium binary
npm run test:e2e             # headless run
npm run test:e2e:ui          # Playwright Test UI
npm run test:e2e:headed      # watch the browser
```

Or via `make test-e2e` / `make test-e2e-install` / `make test-e2e-ui`.

Playwright auto-starts the example dev server and reuses an already-running one
(so `make dev` in another terminal is fine). Requires `example/node_modules`
to exist — run `cd example && npm install` once.

## Convention

For each feature we add **one fixture page + one spec**.

- Fixture: `example/src/routes/test/<Feature>Test.svelte`
  - Configures only what the spec asserts on.
  - Surfaces router state via `data-testid` nodes (`location`, `querystring`,
    `route-params`, `nav-context`, `referrer-location`, etc.).
  - Action buttons get `data-testid="btn-<action>"` ids.
  - Reload resets state — no cross-test coupling.
- Spec: `e2e/<feature>.spec.ts`
  - Header docstring lists the fixture's testids + buttons.
  - One `test.describe()` per logical group (initial render, push, replace, …).
  - Routes for the fixture live in `example/src/App.svelte` just before the
    `*` catch-all (search for "E2E test fixtures").

## Coverage

Cross-references `ai/INDEX.txt` (the feature catalog), `src/tests/` (vitest),
`example/src/routes/*Demo.svelte` (manual demos). The "E2E" column is what
this suite covers.

Legend: ✅ full · 🟡 partial · ❌ none

| # | Topic | Vitest | Demo route | E2E fixture | E2E status |
|---|---|---|---|---|---|
|  1 | basic-setup (modes, events) | routing-modes | App.svelte | (router-events.spec.ts) | ✅ |
|  2 | navigation (push/replace/pop/goBack + array/object signatures) | navigation | LinksDemo, NavigationContextDemo | NavigationTest | ✅ |
|  3 | named-routes | named-routes | DefineRoutesDemo, ReferrerDemo | NamedRoutesTest | ✅ |
|  4 | route-params (`:id`, wildcards, N-A) | (via Router) | User, Book, RouteDataDemo | RouteParamsTest | ✅ |
|  5 | permissions (RBAC + authorization) | permissions | AdminPanel, AuthorizationDemo, Unauthorized | PermissionsTest | ✅ |
|  6 | guards/conditions (`wrap`, async) | navigation-guard | NavigationGuardDemo | GuardsTest | ✅ |
|  7 | hierarchical-routes (inheritance) | hierarchy | adminRoutes in App.svelte | MetadataTest, TreeStructureTest | ✅ |
|  8 | tree-structure (`createHierarchy`) | hierarchy | adminRoutes in App.svelte | TreeStructureTest | ✅ |
|  9 | link-actions (`use:link`, `use:active`) | active-action | LinksDemo, About | LinkActionsTest | ✅ |
| 10 | error-handling (`GlobalErrorHandler`) | error-handler | ErrorHandlingDemo | ErrorTest | ✅ |
| 11 | referrer-tracking (`setIncludeReferrer`) | (in navigation/routing-modes) | ReferrerDemo | ReferrerTest | ✅ |
| 12 | breadcrumbs / route metadata | route-metadata | MetadataDemo | MetadataTest | ✅ |
| 13 | debug-logging / window.components API | logger | main.js | (logging.spec.ts) | ✅ |
| 14 | utilities (querystring/url) | url-helpers, querystring-* | QuerystringDemo | QuerystringTest | ✅ |
| 15 | filters | filters | FiltersDemo | FiltersTest | ✅ |
| 16 | multi-zone | zones-and-scroll | MultiZoneDemo, zones/* | MultiZoneTest | ✅ |
| 17 | loading states (`loadingComponent`) | route-metadata | LoadingDemo, TabsDemo | WrapTest (async + loading) | ✅ |
| 18 | 404 / not-found | (via Router) | NotFoundDemo | EmbeddedRouterTest (router-events) | ✅ |
| 19 | wrap() (basic + dynamic import) | wrap | (used throughout) | WrapTest | ✅ |
| 20 | routeContext | (n/a) | RouteContextDemo/Target | WrapTest | ✅ |

## Adding a fixture

1. Create `example/src/routes/test/<Feature>Test.svelte` — minimal page, only
   the props/config the spec needs, state via `data-testid`.
2. Register the route(s) in `example/src/App.svelte` just before `'*': NotFound`.
3. Add a row to `example/src/routes/test/TestIndex.svelte` so the fixture is
   discoverable in the browser at `/test`.
4. Write `e2e/<feature>.spec.ts`. Start the docstring with a short summary of
   what the fixture exposes (testids + buttons).
5. Run `npm run test:e2e` until green.
6. Flip the row in the coverage table above from ❌ to 🟡 or ✅.
