<script>
import Router, {link, location, querystring, push, navigationContext} from '@keenmate/svelte-spa-router'
import active from '@keenmate/svelte-spa-router/active'
import wrap from '@keenmate/svelte-spa-router/wrap'
import { createHierarchy } from '@keenmate/svelte-spa-router/helpers/hierarchy'
import { configurePermissions, createPermissionCondition, createProtectedRoute } from '@keenmate/svelte-spa-router/helpers/permissions'
import { shouldShowGlobalLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import { registerRoutes } from '@keenmate/svelte-spa-router/routes'
import GlobalErrorHandler from '@keenmate/svelte-spa-router/helpers/GlobalErrorHandler'
import { user, toggleUser, getCurrentUser, checkPermissions, hasDocumentAccess } from './stores/userStore.svelte.js'

import Home from './routes/Home.svelte'
import About from './routes/About.svelte'
import User from './routes/User.svelte'
import Book from './routes/Book.svelte'
import LinksDemo from './routes/LinksDemo.svelte'
import NotFound from './routes/NotFound.svelte'
import Unauthorized from './routes/Unauthorized.svelte'
import AdminPanel from './routes/AdminPanel.svelte'
import Settings from './routes/Settings.svelte'
import QuerystringDemo from './routes/QuerystringDemo.svelte'
import FiltersDemo from './routes/FiltersDemo.svelte'
import RouteDataDemo from './routes/RouteDataDemo.svelte'
import NavigationGuardDemo from './routes/NavigationGuardDemo.svelte'
import MetadataDemo from './routes/MetadataDemo.svelte'
import LoadingDemo from './routes/LoadingDemo.svelte'
import DocumentLogs from './routes/DocumentLogs.svelte'
import ProductDetail from './routes/ProductDetail.svelte'
import MultiZoneDemo from './routes/MultiZoneDemo.svelte'
import ProductSidebar from './routes/zones/ProductSidebar.svelte'
import ProductMain from './routes/zones/ProductMain.svelte'
import ProductPanel from './routes/zones/ProductPanel.svelte'
import ProductsMenu from './routes/zones/ProductsMenu.svelte'
import ProductsMain from './routes/zones/ProductsMain.svelte'
import ProductsToolbar from './routes/zones/ProductsToolbar.svelte'
import UsersMenu from './routes/zones/UsersMenu.svelte'
import UsersMain from './routes/zones/UsersMain.svelte'
import UsersToolbar from './routes/zones/UsersToolbar.svelte'
import OrdersMenu from './routes/zones/OrdersMenu.svelte'
import OrdersMain from './routes/zones/OrdersMain.svelte'
import OrdersToolbar from './routes/zones/OrdersToolbar.svelte'
import ErrorHandlingDemo from './routes/ErrorHandlingDemo.svelte'
import NotFoundDemo from './routes/NotFoundDemo.svelte'
import NavigationContextDemo from './routes/NavigationContextDemo.svelte'
import AuthorizationDemo from './routes/AuthorizationDemo.svelte'
import ReferrerDemo from './routes/ReferrerDemo.svelte'
import TabsDemo from './routes/TabsDemo.svelte'
import DefineRoutesDemo from './routes/DefineRoutesDemo.svelte'
import RouteContextDemo from './routes/RouteContextDemo.svelte'
import RouteContextTarget from './routes/RouteContextTarget.svelte'
import NavTreeDemo from './routes/NavTreeDemo.svelte'
import { navTree, walkTree } from './routes/nav-tree.svelte.js'
import TestIndex from './routes/test/TestIndex.svelte'
import NavigationTest from './routes/test/NavigationTest.svelte'
import NamedRoutesTest from './routes/test/NamedRoutesTest.svelte'
import RouteParamsTest from './routes/test/RouteParamsTest.svelte'
import LinkActionsTest from './routes/test/LinkActionsTest.svelte'
import PermissionsTest from './routes/test/PermissionsTest.svelte'
import PermissionsProtected from './routes/test/PermissionsProtected.svelte'
import RevalidateTest from './routes/test/RevalidateTest.svelte'
import RevalidateProtected from './routes/test/RevalidateProtected.svelte'
import GuardsTest from './routes/test/GuardsTest.svelte'
import GuardsProtected from './routes/test/GuardsProtected.svelte'
import MetadataTest from './routes/test/MetadataTest.svelte'
import EmbeddedRouterTest from './routes/test/EmbeddedRouterTest.svelte'
import TreeStructureTest from './routes/test/TreeStructureTest.svelte'
import WrapTest from './routes/test/WrapTest.svelte'
import WrapLoading from './routes/test/WrapLoading.svelte'
import MultiZoneTest from './routes/test/MultiZoneTest.svelte'
import QuerystringTest from './routes/test/QuerystringTest.svelte'
import FiltersTest from './routes/test/FiltersTest.svelte'
import ReferrerTest from './routes/test/ReferrerTest.svelte'
import ErrorTest from './routes/test/ErrorTest.svelte'

// Initialize the e2e scaffold used by /test/guards/* — conditions push to this
// array so the spec can assert call order + short-circuit behavior.
if (typeof window !== 'undefined') {
    window.__guardCalls = window.__guardCalls || []
}
const recordGuardCall = (entry) => {
    if (typeof window !== 'undefined') {
        window.__guardCalls = window.__guardCalls || []
        window.__guardCalls.push(entry)
    }
}
import Loading from './components/Loading.svelte'

// Configure permissions system
configurePermissions({
    checkPermissions,
    getCurrentUser,

    // Use component mode (shows unauthorized without changing URL)
    unauthorizedBehavior: 'component',
    unauthorizedComponent: Unauthorized,

    // E2E test scaffold: record onRevalidationFailure invocations so the
    // revalidate spec can assert. Production apps would typically push() to
    // an unauthorized route or show a confirmation dialog here.
    onRevalidationFailure: (detail) => {
        if (typeof window !== 'undefined') {
            window.__revalidationFailureCalls = window.__revalidationFailureCalls || []
            window.__revalidationFailureCalls.push(detail)
        }
    }

    // For navigate mode (changes URL to /unauthorized):
    // unauthorizedBehavior: 'navigate',
    // unauthorizedRoute: '/unauthorized',
    // unauthorizedComponent: Unauthorized
})

// Register named routes for referrer tracking demo
registerRoutes({
    'home': '/',
    'about': '/about',
    'userProfile': '/user/:first/:last',
    'referrerDemo': '/referrer-demo',
    'linksDemo': '/links-demo',
    'metadataDemo': '/metadata-demo',
    'navigationContextDemo': '/navigation-context-demo'
})

// E2E test fixture: tree-structure / createHierarchy
const treeFixtureRoutes = createHierarchy({
    '/test/tree': {
        name: 'testTreeRoot',
        component: TreeStructureTest,
        title: 'Tree Root',
        breadcrumbs: [{ label: 'Tree' }],
        children: {
            ':id': {
                name: 'testTreeItem',
                component: TreeStructureTest,
                title: 'Tree Item',
                breadcrumbs: [{ label: 'Item' }],
                children: {
                    'logs': {
                        name: 'testTreeItemLogs',
                        component: TreeStructureTest,
                        title: 'Item Logs',
                        breadcrumbs: [{ label: 'Logs' }]
                    }
                }
            }
        }
    }
})

// NESTED ROUTES EXAMPLE (Tree Structure)
// This demonstrates using createHierarchy() to define routes in a tree structure
// Child paths are automatically concatenated to parent paths
// Routes automatically inherit breadcrumbs, permissions, and authorization from parents
const adminRoutes = createHierarchy({
    '/admin-tree': {
        name: 'adminTree',
        component: AdminPanel,
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Admin (Tree Example)' }
        ],
        permissions: { any: ['admin'] },
        children: {
            'users': {
                name: 'adminTreeUsers',
                component: Settings,
                breadcrumbs: [{ label: 'Users' }],
                // Inherits 'admin' permission from parent
                // Effective breadcrumbs: [Home, Admin (Tree Example), Users]
                children: {
                    ':id': {
                        name: 'adminTreeUserDetail',
                        component: Settings,
                        breadcrumbs: [{ label: 'User Detail' }]
                        // Inherits 'admin' permission from ancestors
                        // Effective path: /admin-tree/users/:id
                        // Effective breadcrumbs: [Home, Admin (Tree Example), Users, User Detail]
                    }
                }
            },
            'settings': {
                component: Settings,
                breadcrumbs: [{ label: 'Settings' }],
                permissions: { any: ['settings:manage'] }
                // Requires BOTH 'admin' (from parent) AND 'settings:manage'
            }
        }
    }
})

// Define routes with permissions (Flat Structure)
const routes = {
    '/': Home,
    '/about': About,
    '/user/:first/:last?': User,
    '/book/*': Book,
    '/links-demo': LinksDemo,
    '/querystring-demo': QuerystringDemo,
    '/filters-demo': FiltersDemo,
    '/route-data-demo': RouteDataDemo,
    // Static prefix routes must come before generic parameter routes
    '/route-data-demo/project-:projectCode': RouteDataDemo,
    '/route-data-demo/user-:id': RouteDataDemo,
    '/route-data-demo/project-:code/task-:taskId': RouteDataDemo,
    // Generic parameter routes
    '/route-data-demo/:projectId/:taskId/:commentId': RouteDataDemo,
    '/route-data-demo/:docId/:versionId': RouteDataDemo,
    '/route-data-demo/:userId': RouteDataDemo,
    '/navigation-guard-demo': NavigationGuardDemo,
    '/metadata-demo': MetadataDemo,
    '/loading-demo': LoadingDemo,
    '/error-handling-demo': ErrorHandlingDemo,
    '/not-found-demo': NotFoundDemo,
    '/navigation-context-demo': NavigationContextDemo,
    '/authorization-demo': AuthorizationDemo,
    '/referrer-demo': ReferrerDemo,
    '/define-routes-demo': DefineRoutesDemo,
    '/route-context-demo': wrap({
        component: RouteContextDemo,
        title: 'Route Context Demo',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Route Context Demo' }
        ],
        routeContext: {
            section: 'demos',
            customField: 'Hello from routeContext!',
            featureFlag: true
        }
    }),
    '/route-context-target': wrap({
        component: RouteContextTarget,
        title: 'Route Context Target',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Route Context Demo', path: '/route-context-demo' },
            { label: 'Target Page' }
        ],
        routeContext: {
            section: 'examples',
            pageType: 'target',
            showSidebar: false,
            maxItems: 25
        }
    }),

    // TABS WITH QUERYSTRING EXAMPLE
    // Demonstrates how to use tabs with query string state while preserving breadcrumbs
    // Key: Use replace() instead of push() for tab changes to avoid breadcrumb reset
    '/tabs/:id': wrap({
        component: TabsDemo,
        loadingComponent: Loading,
        shouldDisplayLoadingOnRouteLoad: true,
        title: 'Tabs Demo',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Demos', path: '/metadata-demo' },
            { id: 'itemName', label: 'Loading...' }
        ]
    }),

    // HIERARCHICAL ROUTES EXAMPLE
    // With hierarchical mode enabled (see main.js), these routes demonstrate automatic inheritance
    // The /document/:id/logs route inherits breadcrumbs and permissions from /document/:id

    '/document/:id': createProtectedRoute({
        component: () => import('./routes/DocumentDetail.svelte'),
        permissions: { any: ['read'] },
        authorizationCallback: async (detail) => {
            const documentId = detail.params.id
            const hasAccess = hasDocumentAccess(documentId)

            if (!hasAccess) {
                // Use returnTo from navigationContext if available (passed when navigating to this route)
                // Otherwise fall back to current location (though this will be /document/:id)
                const returnTo = detail.navigationContext?.returnTo || location()
                const returnQuery = detail.navigationContext?.returnQuery || querystring()

                // push(route, routeParams, queryString, navigationContext)
                await push('/unauthorized', {}, {}, {
                    resource: 'document',
                    id: documentId,
                    user: getCurrentUser().name,
                    returnTo,
                    returnQuery
                })
                return false
            }

            return true
        },
        loadingComponent: Loading,
        shouldDisplayLoadingOnRouteLoad: true,
        title: 'Document Detail',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents', path: '/metadata-demo' },
            { id: 'documentDetail', label: 'Loading...', path: '/document/:id' }
        ]
    }),

    // This child route automatically inherits:
    // - Parent breadcrumbs: [Home, Documents, Document Detail]
    // - Parent permissions: { any: ['read'] }
    // - Parent authorization callback
    // The final breadcrumbs will be: [Home, Documents, Document Detail, Loading...]
    // User must pass BOTH parent 'read' permission AND parent authorization check
    '/document/:id/logs': wrap({
        component: DocumentLogs,
        title: 'Document Logs',
        breadcrumbs: [
            { id: 'documentLogs', label: 'Loading...', path: '/document/:id/logs' }
        ]
        // Note: In hierarchical mode, parent breadcrumbs are automatically prepended
        // If you want to start fresh, use: inheritBreadcrumbs: false
    }),
    '/product/:id': wrap({
        component: ProductDetail,
        title: 'Product Detail',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Products', path: '/metadata-demo' },
            { label: 'Product Detail' }
        ]
    }),
    '/unauthorized': Unauthorized,
    '/admin': createProtectedRoute({
        component: AdminPanel,
        permissions: { any: ['admin'] }
    }),
    '/settings': createProtectedRoute({
        component: Settings,
        permissions: { any: ['settings:manage'] }
    }),
    '/multi-zone-demo': MultiZoneDemo,
    '/product-zones/:productId': wrap({
        zones: {
            'sidebar': ProductSidebar,
            'main': ProductMain,
            'panel': ProductPanel
        },
        title: 'Product Details (Multi-Zone)',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Multi-Zone Demo', path: '/multi-zone-demo' },
            { label: 'Product' }
        ]
    }),
    '/products': wrap({
        zones: {
            'sidebar': ProductsMenu,
            'main': ProductsMain,
            'panel': ProductsToolbar
        },
        title: 'Products',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Multi-Zone Demo', path: '/multi-zone-demo' },
            { label: 'Products' }
        ]
    }),
    '/users': wrap({
        zones: {
            'sidebar': UsersMenu,
            'main': UsersMain,
            'panel': UsersToolbar
        },
        title: 'Users',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Multi-Zone Demo', path: '/multi-zone-demo' },
            { label: 'Users' }
        ]
    }),
    '/orders': wrap({
        zones: {
            'sidebar': OrdersMenu,
            'main': OrdersMain,
            'panel': OrdersToolbar
        },
        title: 'Orders',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Multi-Zone Demo', path: '/multi-zone-demo' },
            { label: 'Orders' }
        ]
    }),
    // E2E test fixtures (deterministic, minimal — see example/src/routes/test/)
    '/test': TestIndex,
    '/test/navigation': NavigationTest,
    '/test/navigation/:id': NavigationTest,
    '/test/named': NamedRoutesTest,
    '/test/named/:id': NamedRoutesTest,
    '/test/named/:id/edit': NamedRoutesTest,
    '/test/params': RouteParamsTest,
    '/test/params/:id': RouteParamsTest,
    '/test/params/optional/:first/:last?': RouteParamsTest,
    '/test/params/wild/*': RouteParamsTest,
    '/test/links': LinkActionsTest,
    '/test/links/target': LinkActionsTest,
    // Sidebar/submenu fixture — see e2e/link-actions.spec.ts "sidebar with submenu"
    '/test/links/sidebar': LinkActionsTest,
    '/test/links/sidebar/users': LinkActionsTest,
    '/test/links/sidebar/users/list': LinkActionsTest,
    '/test/links/sidebar/users/:id': LinkActionsTest,
    '/test/links/sidebar/users/:id/edit': LinkActionsTest,

    // Tree-driven nav demo — registers one route per node in nav-tree.js,
    // all pointing at the same demo component. The component reads location()
    // to render the active page content.
    ...Object.fromEntries(
        Array.from(walkTree(navTree)).map((node) => [node.path, NavTreeDemo])
    ),
    '/test/perms': PermissionsTest,
    '/test/perms/needs-read': createProtectedRoute({
        component: PermissionsProtected,
        permissions: { any: ['read'] }
    }),
    '/test/perms/needs-admin': createProtectedRoute({
        component: PermissionsProtected,
        permissions: { any: ['admin'] }
    }),
    '/test/perms/document/:id': createProtectedRoute({
        component: PermissionsProtected,
        authorizationCallback: async (detail) => hasDocumentAccess(detail.params.id)
    }),
    '/test/revalidate': RevalidateTest,
    '/test/revalidate/protected': createProtectedRoute({
        component: RevalidateProtected,
        permissions: { any: ['admin'] }
    }),
    '/test/guards': GuardsTest,
    '/test/guards/allow': wrap({
        component: GuardsProtected,
        conditions: [() => { recordGuardCall({ name: 'allow' }); return true }]
    }),
    '/test/guards/deny': wrap({
        component: GuardsProtected,
        conditions: [() => { recordGuardCall({ name: 'deny' }); return false }]
    }),
    '/test/guards/pass-then-fail': wrap({
        component: GuardsProtected,
        conditions: [
            () => { recordGuardCall({ name: 'first-pass' }); return true },
            () => { recordGuardCall({ name: 'then-fail' }); return false }
        ]
    }),
    '/test/guards/fail-then-skip': wrap({
        component: GuardsProtected,
        conditions: [
            () => { recordGuardCall({ name: 'first-fail' }); return false },
            () => { recordGuardCall({ name: 'should-not-run' }); return true }
        ]
    }),
    '/test/guards/async-allow': wrap({
        component: GuardsProtected,
        conditions: [async () => {
            await Promise.resolve()
            recordGuardCall({ name: 'async-allow' })
            return true
        }]
    }),
    '/test/guards/async-deny': wrap({
        component: GuardsProtected,
        conditions: [async () => {
            await Promise.resolve()
            recordGuardCall({ name: 'async-deny' })
            return false
        }]
    }),
    '/test/guards/echo/:id': wrap({
        component: GuardsProtected,
        conditions: [(detail) => {
            recordGuardCall({
                name: 'echo',
                location: detail.location,
                params: detail.params
            })
            return true
        }]
    }),
    '/test/meta': wrap({
        component: MetadataTest,
        title: 'Meta',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Meta' }
        ]
    }),
    '/test/meta/items': wrap({
        component: MetadataTest,
        title: 'Items',
        breadcrumbs: [{ label: 'Items' }]
    }),
    '/test/meta/items/:id': wrap({
        component: MetadataTest,
        title: 'Item Detail',
        breadcrumbs: [{ id: 'itemDetail', label: 'Loading...' }]
    }),
    // Wildcard so the nested Router inside EmbeddedRouterTest sees the rest of the path.
    '/test/embed/*': EmbeddedRouterTest,
    '/test/wrap': wrap({
        component: WrapTest,
        title: 'Wrap Root',
        routeContext: {
            section: 'wrap-fixture',
            customField: 'Hello from routeContext!'
        }
    }),
    '/test/wrap/async': wrap({
        asyncComponent: async () => {
            // Small delay so the loading component is observable by Playwright.
            await new Promise((resolve) => setTimeout(resolve, 250))
            return (await import('./routes/test/WrapAsyncTarget.svelte')).default
        },
        loadingComponent: WrapLoading,
        shouldDisplayLoadingOnRouteLoad: true
    }),
    '/test/wrap/with-props': wrap({
        component: WrapTest,
        title: 'Wrap With Props',
        props: { staticGreeting: 'hello from props' },
        routeContext: { section: 'wrap-props' }
    }),
    // Wildcard so the nested Routers inside MultiZoneTest see the sub-path.
    '/test/zones/*': MultiZoneTest,
    '/test/querystring': QuerystringTest,
    '/test/filters': FiltersTest,
    '/test/referrer/from/:source': ReferrerTest,
    '/test/referrer/to/:dest': ReferrerTest,
    '/test/error': ErrorTest,
    '*': NotFound
}

// Combine tree-structured routes with flat routes
const allRoutes = {
    ...adminRoutes,        // Tree-structured admin routes
    ...treeFixtureRoutes,  // E2E fixture tree (createHierarchy)
    ...routes              // Flat routes
}

// Check if current location is a zone route
const isZoneRoute = $derived(
    location().startsWith('/product-zones/') ||
    location().startsWith('/products') ||
    location().startsWith('/users') ||
    location().startsWith('/orders')
)

const currentUser = $derived(user())
const showGlobalLoader = $derived(shouldShowGlobalLoading())
const navContext = $derived(navigationContext())
const referrer = $derived(navContext?.referrer)

// Log router activity
function handleRouteLoading(event) {
    if (typeof window !== 'undefined') {
        window.__routeLoadingEvents = window.__routeLoadingEvents || []
        window.__routeLoadingEvents.push({
            location: event.detail?.location,
            relativeLocation: event.detail?.relativeLocation,
            route: event.detail?.route
        })
    }
}

function handleRouteLoaded(event) {
    console.log('[Router] Route loaded:', event.detail)
    if (typeof window !== 'undefined') {
        window.__routeLoadedEvents = window.__routeLoadedEvents || []
        window.__routeLoadedEvents.push({
            location: event.detail?.location,
            relativeLocation: event.detail?.relativeLocation,
            route: event.detail?.route,
            params: event.detail?.params
        })
    }
}

// E2E test scaffold: record conditionsFailed events for /test/guards/* assertions.
function handleConditionsFailed(event) {
    if (typeof window !== 'undefined') {
        window.__conditionsFailedEvents = window.__conditionsFailedEvents || []
        window.__conditionsFailedEvents.push({
            location: event.detail?.location,
            relativeLocation: event.detail?.relativeLocation,
            route: event.detail?.route
        })
    }
}

function handleNotFound(event) {
    console.log('[Router] 404 Not Found:', event.detail)
    if (typeof window !== 'undefined') {
        window.__notFoundEvents = window.__notFoundEvents || []
        window.__notFoundEvents.push({
            location: event.detail?.location,
            relativeLocation: event.detail?.relativeLocation,
            querystring: event.detail?.querystring
        })
    }
    // Example: Send to Sentry or other monitoring service
    // Sentry.captureMessage('404 Not Found', {
    //     extra: {
    //         path: event.detail.location,
    //         querystring: event.detail.querystring
    //     }
    // })
}

function handleToggleUser() {
    toggleUser()
}
</script>

<GlobalErrorHandler>
<div class="app">
    <!-- Global Loading Overlay (only shown when route doesn't have custom loading component) -->
    {#if showGlobalLoader}
    <div class="global-loading-overlay">
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    </div>
    {/if}

    <header>
        <h1>@keenmate/svelte-spa-router Example</h1>
        <nav>
            <a href="/" use:link use:active>Home</a>
            <div class="nav-group">
                <span class="nav-trigger">Navigation ▾</span>
                <div class="nav-dropdown">
                    <a href="/links-demo" use:link use:active>Links</a>
                    <a href="/navigation-guard-demo" use:link use:active>Nav Guard</a>
                    <a href="/navigation-context-demo" use:link use:active>Nav Context</a>
                    <a href="/referrer-demo" use:link use:active>Referrer</a>
                </div>
            </div>
            <div class="nav-group">
                <span class="nav-trigger">URL & Data ▾</span>
                <div class="nav-dropdown">
                    <a href="/querystring-demo" use:link use:active>Querystring</a>
                    <a href="/filters-demo" use:link use:active>Filters</a>
                    <a href="/route-data-demo" use:link use:active>Route Data</a>
                    <a href="/tabs/1" use:link use:active>Tabs</a>
                </div>
            </div>
            <div class="nav-group">
                <span class="nav-trigger">Routing ▾</span>
                <div class="nav-dropdown">
                    <a href="/define-routes-demo" use:link use:active>defineRoutes</a>
                    <a href="/route-context-demo" use:link use:active>Route Context</a>
                    <a href="/metadata-demo" use:link use:active>Metadata</a>
                    <a href="/loading-demo" use:link use:active>Loading</a>
                    <a href="/multi-zone-demo" use:link use:active>Zones</a>
                    <a href="/nav-tree-demo" use:link use:active={/^\/nav-tree-demo(\/|$)/}>Tree-driven nav</a>
                </div>
            </div>
            <div class="nav-group">
                <span class="nav-trigger">Errors ▾</span>
                <div class="nav-dropdown">
                    <a href="/error-handling-demo" use:link use:active>Error Handling</a>
                    <a href="/not-found-demo" use:link use:active>404 Demo</a>
                </div>
            </div>
            <div class="nav-group">
                <span class="nav-trigger">Security ▾</span>
                <div class="nav-dropdown">
                    <a href="/authorization-demo" use:link use:active>Authorization</a>
                    <a href="/admin" use:link use:active>Admin</a>
                    <a href="/admin-tree" use:link use:active>Admin (Tree)</a>
                    <a href="/settings" use:link use:active>Settings</a>
                </div>
            </div>
        </nav>
        <div class="user-controls">
            <button onclick={handleToggleUser} class="toggle-btn" title="Switch user">
                Toggle <span class="user-icon">👤</span>
            </button>
            <span class="user-name">{currentUser.name}</span>
        </div>
    </header>

    <!-- Route info bar -->
    <div class="route-info">
        <div class="route-info-content">
            <div class="route-info-section">
                <strong>Current route:</strong> <code>{location()}</code>
            </div>
            <div class="route-info-section">
                <strong>Referrer:</strong>
                {#if referrer}
                    <code>{referrer.routeName || referrer.location}</code>
                    {#if referrer.querystring}
                        <span class="route-info-qs">?{referrer.querystring}</span>
                    {/if}
                    {#if referrer.params && Object.keys(referrer.params).length > 0}
                        <span class="route-info-params">(params: {JSON.stringify(referrer.params)})</span>
                    {/if}
                {:else}
                    <span class="route-info-none">(none)</span>
                {/if}
            </div>
        </div>
    </div>

    {#if isZoneRoute}
        <!-- Multi-zone layout -->
        <div class="zone-layout">
            <aside class="zone-sidebar">
                <div class="zone-header">Zone: "sidebar"</div>
                <Router routes={allRoutes} zone="sidebar" onRouteLoading={handleRouteLoading} onRouteLoaded={handleRouteLoaded} onNotFound={handleNotFound} onConditionsFailed={handleConditionsFailed} />
            </aside>
            <main class="zone-main">
                <div class="zone-header">Zone: "main"</div>
                <Router routes={allRoutes} zone="main" onRouteLoading={handleRouteLoading} onRouteLoaded={handleRouteLoaded} onNotFound={handleNotFound} onConditionsFailed={handleConditionsFailed} />
            </main>
            <aside class="zone-panel">
                <div class="zone-header">Zone: "panel"</div>
                <Router routes={allRoutes} zone="panel" onRouteLoading={handleRouteLoading} onRouteLoaded={handleRouteLoaded} onNotFound={handleNotFound} onConditionsFailed={handleConditionsFailed} />
            </aside>
        </div>
    {:else}
        <!-- Single component layout -->
        <main>
            <Router routes={allRoutes} onRouteLoading={handleRouteLoading} onRouteLoaded={handleRouteLoaded} onNotFound={handleNotFound} onConditionsFailed={handleConditionsFailed} />
        </main>
    {/if}
</div>
</GlobalErrorHandler>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    header {
        background: #2563eb;
        color: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    header h1 {
        margin: 0;
        font-size: 1.5rem;
    }

    nav {
        display: flex;
        gap: 0.25rem;
        flex: 1;
        align-items: center;
    }

    nav > a {
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background 0.2s;
    }

    nav > a:hover {
        background: rgba(255,255,255,0.1);
    }

    nav :global(a.active) {
        background: rgba(255,255,255,0.2);
        font-weight: bold;
    }

    /* Dropdown nav groups */
    .nav-group {
        position: relative;
    }

    .nav-trigger {
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: default;
        user-select: none;
        font-size: 0.9rem;
        transition: background 0.2s;
        display: inline-block;
    }

    .nav-group:hover .nav-trigger {
        background: rgba(255,255,255,0.15);
    }

    .nav-dropdown {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: #1e40af;
        border-radius: 0 0 6px 6px;
        min-width: 170px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        z-index: 200;
        padding: 0.25rem 0;
    }

    .nav-group:hover .nav-dropdown {
        display: flex;
        flex-direction: column;
    }

    .nav-dropdown a {
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        transition: background 0.15s;
        white-space: nowrap;
        font-size: 0.9rem;
    }

    .nav-dropdown a:hover {
        background: rgba(255,255,255,0.1);
    }

    .nav-dropdown :global(a.active) {
        background: rgba(255,255,255,0.2);
        font-weight: bold;
    }

    .user-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-left: auto;
        position: absolute;
        top: 1rem;
        right: 2rem;
    }

    .toggle-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
    }

    .toggle-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
    }

    .user-icon {
        font-size: 1.2rem;
    }

    .user-name {
        font-weight: 500;
        font-size: 1rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    main {
        flex: 1;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
    }

    /* Route info bar (moved from footer to top) */
    .route-info {
        background: #f0f9ff;
        padding: 0.75rem 2rem;
        border-bottom: 2px solid #0ea5e9;
        position: sticky;
        top: 70px;
        z-index: 99;
    }

    .route-info-content {
        display: flex;
        gap: 2rem;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        font-size: 0.9rem;
    }

    .route-info-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .route-info code {
        background: white;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-family: monospace;
        color: #2563eb;
        font-weight: 600;
    }

    .route-info-qs {
        color: #059669;
        font-family: monospace;
        font-size: 0.85rem;
    }

    .route-info-params {
        color: #7c3aed;
        font-family: monospace;
        font-size: 0.8rem;
    }

    .route-info-none {
        color: #999;
        font-style: italic;
    }

    /* Multi-zone layout styles */
    .zone-layout {
        display: grid;
        grid-template-columns: 250px 1fr 320px;
        gap: 1.5rem;
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        flex: 1;
    }

    .zone-header {
        background: #2563eb;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        text-align: center;
        border-radius: 6px 6px 0 0;
        margin: -1rem -1rem 1rem -1rem;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.5px;
    }

    .zone-main .zone-header {
        margin: 0 0 1rem 0;
        border-radius: 6px 6px 0 0;
    }

    .zone-panel .zone-header {
        margin: 0 0 1rem 0;
        border-radius: 6px 6px 0 0;
    }

    .zone-sidebar,
    .zone-main,
    .zone-panel {
        overflow-y: auto;
        position: relative;
    }

    .zone-sidebar {
        background: #f9f9f9;
        border-radius: 8px;
        padding: 1rem;
    }

    .zone-main {
        background: white;
        border-radius: 8px;
        padding: 1rem;
    }

    .zone-panel {
        background: white;
        border-radius: 8px;
        padding: 1rem;
    }

    /* Responsive layout for zones */
    @media (max-width: 1200px) {
        .zone-layout {
            grid-template-columns: 200px 1fr 280px;
            gap: 1rem;
            padding: 1rem;
        }
    }

    @media (max-width: 900px) {
        .zone-layout {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr auto;
        }

        .zone-sidebar,
        .zone-panel {
            max-height: 300px;
        }
    }
</style>
