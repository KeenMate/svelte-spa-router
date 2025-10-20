<script>
import Router from '@keenmate/svelte-spa-router'
import {link, location, push} from '@keenmate/svelte-spa-router/utils'
import active from '@keenmate/svelte-spa-router/active'
import wrap from '@keenmate/svelte-spa-router/wrap'
import { createRoute } from '@keenmate/svelte-spa-router/wrap'
import { configurePermissions, createPermissionCondition } from '@keenmate/svelte-spa-router/helpers/permissions'
import { routeIsLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import { user, toggleUser, getCurrentUser, checkPermissions } from './stores/userStore.svelte.js'

import Home from './routes/Home.svelte'
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
import DocumentDetail from './routes/DocumentDetail.svelte'
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
import Loading from './components/Loading.svelte'

// Configure permissions system
configurePermissions({
    checkPermissions,
    getCurrentUser,
    onUnauthorized: (detail) => {
        console.log('Unauthorized access attempt:', detail)
        push('/unauthorized')
    }
})

// Define routes with permissions
const routes = {
    '/': Home,
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
    '/document/:id': wrap({
        component: DocumentDetail,
        loadingComponent: Loading,
        shouldDisplayLoadingOnRouteLoad: true,
        title: 'Document Detail',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents', path: '/metadata-demo' },
            { id: 'documentDetail', label: 'Loading...', path: '/document/:id' }
        ]
    }),
    '/document/:id/logs': wrap({
        component: DocumentLogs,
        title: 'Document Logs',
        breadcrumbs: [
            { label: 'Home', path: '/' },
            { label: 'Documents', path: '/metadata-demo' },
            { id: 'documentDetail', label: 'Loading...', path: '/document/:id' },
            { id: 'documentLogs', label: 'Loading...', path: '/document/:id/logs' }
        ]
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
    '/admin': wrap({
        component: AdminPanel,
        conditions: [createPermissionCondition({ any: ['admin'] })]
    }),
    '/settings': wrap({
        component: Settings,
        conditions: [createPermissionCondition({ any: ['settings:manage'] })]
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
    '*': NotFound
}

// Check if current location is a zone route
const isZoneRoute = $derived(
    location().startsWith('/product-zones/') ||
    location().startsWith('/products') ||
    location().startsWith('/users') ||
    location().startsWith('/orders')
)

const currentUser = $derived(user())
const isLoading = $derived(routeIsLoading())

function handleRouteLoaded(event) {
    console.log('Route loaded:', event.detail)
}

function handleToggleUser() {
    toggleUser()
}
</script>

<div class="app">
    <!-- Global Loading Overlay -->
    {#if isLoading}
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
            <a href="/links-demo" use:link use:active>Links</a>
            <a href="/querystring-demo" use:link use:active>Querystring</a>
            <a href="/filters-demo" use:link use:active>Filters</a>
            <a href="/route-data-demo" use:link use:active>Route Data</a>
            <a href="/navigation-guard-demo" use:link use:active>Nav Guard</a>
            <a href="/metadata-demo" use:link use:active>Metadata</a>
            <a href="/loading-demo" use:link use:active>Loading</a>
            <a href="/multi-zone-demo" use:link use:active>Zones</a>
            <a href="/admin" use:link use:active>Admin</a>
            <a href="/settings" use:link use:active>Settings</a>
        </nav>
        <div class="user-controls">
            <button onclick={handleToggleUser} class="toggle-btn" title="Switch user">
                Toggle <span class="user-icon">👤</span>
            </button>
            <span class="user-name">{currentUser.name}</span>
        </div>
    </header>

    {#if isZoneRoute}
        <!-- Multi-zone layout -->
        <div class="zone-layout">
            <aside class="zone-sidebar">
                <div class="zone-header">Zone: "sidebar"</div>
                <Router {routes} zone="sidebar" onrouteLoaded={handleRouteLoaded} />
            </aside>
            <main class="zone-main">
                <div class="zone-header">Zone: "main"</div>
                <Router {routes} zone="main" onrouteLoaded={handleRouteLoaded} />
            </main>
            <aside class="zone-panel">
                <div class="zone-header">Zone: "panel"</div>
                <Router {routes} zone="panel" onrouteLoaded={handleRouteLoaded} />
            </aside>
        </div>
    {:else}
        <!-- Single component layout -->
        <main>
            <Router {routes} onrouteLoaded={handleRouteLoaded} />
        </main>
    {/if}

    <footer>
        <p>Current route: <code>{location()}</code></p>
    </footer>
</div>

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
        gap: 1rem;
        flex: 1;
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

    nav a {
        color: white;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background 0.2s;
    }

    nav a:hover {
        background: rgba(255,255,255,0.1);
    }

    nav :global(a.active) {
        background: rgba(255,255,255,0.2);
        font-weight: bold;
    }

    main {
        flex: 1;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
    }

    footer {
        background: #f5f5f5;
        padding: 1rem 2rem;
        text-align: center;
        border-top: 1px solid #ddd;
    }

    footer code {
        background: white;
        padding: 0.2rem 0.5rem;
        border-radius: 3px;
        font-family: monospace;
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
