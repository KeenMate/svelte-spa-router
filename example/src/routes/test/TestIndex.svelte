<script>
    import { link } from '@keenmate/svelte-spa-router'

    // Index of deterministic e2e fixtures. Each entry points at a page that is
    // targeted by exactly one spec under repo-root /e2e/. The fixtures are
    // separate from the demo routes (which double as documentation) — those
    // change over time and are too user-oriented for stable assertions.
    const fixtures = [
        { path: '/test/navigation', spec: 'e2e/navigation.spec.ts', description: 'push / replace / goBack, location, querystring, routeParams, navigationContext' },
        { path: '/test/named', spec: 'e2e/named-routes.spec.ts', description: 'registerRoutes, push/replace by name, buildUrl, hasRoute, getRouteByName, N-A placeholder' },
        { path: '/test/params', spec: 'e2e/route-params.spec.ts', description: 'required :param, optional :last?, wildcard *, URL decoding' },
        { path: '/test/links', spec: 'e2e/link-actions.spec.ts', description: 'use:link click navigation, modifier-key bypass, target=_blank; use:active default/custom/regex' },
        { path: '/test/perms', spec: 'e2e/permissions.spec.ts', description: 'createProtectedRoute (RBAC + authorizationCallback), hasPermission, Unauthorized component' },
        { path: '/test/guards', spec: 'e2e/guards-conditions.spec.ts', description: 'wrap({ conditions }) — single/multi, async, short-circuit on first fail, detail object' },
        { path: '/test/meta', spec: 'e2e/hierarchy-breadcrumbs.spec.ts', description: 'hierarchical breadcrumb inheritance, routeTitle/routeBreadcrumbs, updateBreadcrumb by id' },
        { path: '/test/embed/known', spec: 'e2e/router-events.spec.ts', description: 'router events (onRouteLoading/Loaded), NotFound catch-all, embedded Router for onNotFound' },
        { path: '/test/tree', spec: 'e2e/tree-structure.spec.ts', description: 'createHierarchy() — child-path concatenation, breadcrumb inheritance, auto-registered named routes' },
        { path: '/test/wrap', spec: 'e2e/wrap.spec.ts', description: 'wrap() — routeContext access, asyncComponent + loadingComponent, static props' },
        { path: '/test/zones/show/42', spec: 'e2e/multi-zone.spec.ts', description: 'multi-zone routing — single route definition rendered through three nested Routers' },
        { path: '/test/querystring', spec: 'e2e/querystring.spec.ts', description: 'query() reactive helper, parseQuerystring/stringifyQuerystring, comma + repeat auto-detect' },
        { path: '/test/filters', spec: 'e2e/filters.spec.ts', description: 'filters() structured mode (OData-style), updateFilters helper' },
        { path: '/test/referrer/from/origin', spec: 'e2e/referrer.spec.ts', description: 'full referrer object — location, routeName, querystring, params' },
        { path: '/test/error', spec: 'e2e/error-handling.spec.ts', description: 'GlobalErrorHandler — navigateSafe strategy, ignoreErrors pattern, onError callback' },
        { path: '/test/revalidate', spec: 'e2e/revalidate.spec.ts', description: 'revalidateCurrentRoute() — re-checks guards/conditions on the mounted route; onRevalidationFailure callback' }
    ]
</script>

<svelte:head>
    <title>Test fixtures</title>
</svelte:head>

<main>
    <h1>e2e test fixtures</h1>
    <p>
        Targeted by the Playwright suite under <code>e2e/</code>. Each page configures only
        what its spec asserts on and surfaces router state through <code>data-testid</code>
        nodes. Not part of the published demo &mdash; see <a href="/" use:link>the example app</a> for that.
    </p>

    <ul>
        {#each fixtures as { path, spec, description }}
            <li>
                <a href={path} use:link><code>{path}</code></a> &mdash; <code>{spec}</code>
                <div class="desc">{description}</div>
            </li>
        {/each}
    </ul>
</main>

<style>
    main {
        max-width: 720px;
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    ul { list-style: disc; padding-left: 1.25rem; }
    li { margin-bottom: 0.5rem; }
    .desc { font-size: 0.85rem; color: #475569; margin-top: 0.15rem; }
    code { background: #f1f5f9; padding: 0.05rem 0.3rem; border-radius: 3px; }
</style>
