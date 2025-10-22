# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Router Initialization**: Fixed location state initialization to be reactive to config changes
  - Issue: Direct URL access (e.g., `http://localhost:5050/querystring-demo`) showed homepage
  - Solution: Changed from `$state(getLocation())` to `$derived.by()` to react to config changes
  - Now correctly reads `setHashRoutingEnabled()` before initializing location state

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
