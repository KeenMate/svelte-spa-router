/**
 * Route metadata helpers for accessing title and breadcrumbs
 *
 * This module provides reactive access to the current route's metadata
 * (title and breadcrumbs) that updates automatically on route changes.
 * It also provides loading control for routes that need to fetch data.
 */

/**
 * Current route metadata state
 */
let currentRouteTitle = $state('')
let currentRouteBreadcrumbs = $state([])
let currentRouterouteContext = $state({})

/**
 * Loading control state
 */
let routeReadyResolvers = []
let isRouteLoading = $state(false)
let hasCustomLoadingComponent = $state(false)

/**
 * Update route metadata (called by Router or user code)
 * @param {Object} routeContext - route context from the route
 */
export function updateRouteMetadata(routeContext = {}) {
    currentRouteTitle = routeContext.title || ''
    currentRouteBreadcrumbs = routeContext.breadcrumbs || []
    currentRouterouteContext = routeContext
}

/**
 * Get current route title reactively
 * @returns {string} Current route title
 *
 * @example
 * ```javascript
 * import { routeTitle } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * const title = $derived(routeTitle())
 * ```
 */
export function routeTitle() {
    return currentRouteTitle
}

/**
 * Get current route breadcrumbs reactively
 * @returns {Array<{label: string, path?: string}>} Current route breadcrumbs
 *
 * @example
 * ```javascript
 * import { routeBreadcrumbs } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * const breadcrumbs = $derived(routeBreadcrumbs())
 * ```
 */
export function routeBreadcrumbs() {
    return currentRouteBreadcrumbs
}

/**
 * Get full route route context reactively
 * @returns {Object} Current route's routeContext
 *
 * @example
 * ```javascript
 * import { routerouteContext } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * const routeContext = $derived(routerouteContext())
 * const customData = $derived(routeContext.myCustomField)
 * ```
 */
export function routerouteContext() {
    return currentRouterouteContext
}

/**
 * Update a specific breadcrumb by ID without replacing the entire breadcrumbs array
 * This is useful when you want to update dynamic segments after data loads
 *
 * @param {string} id - The ID of the breadcrumb to update
 * @param {Object} updates - Object containing label and/or path updates
 * @param {string} [updates.label] - New label for the breadcrumb
 * @param {string} [updates.path] - New path for the breadcrumb
 *
 * @example
 * ```javascript
 * // Initial breadcrumbs in route config with IDs:
 * breadcrumbs: [
 *   { label: 'Home', path: '/' },
 *   { label: 'Documents', path: '/documents' },
 *   { id: 'documentDetail', label: 'Loading...', path: '/documents/:id' },
 *   { label: 'Logs', path: '/documents/:id/logs' }
 * ]
 *
 * // After loading data, update just the document name:
 * updateBreadcrumb('documentDetail', {
 *   label: 'Invoice_Q4_2024.pdf',
 *   path: '/documents/123'
 * })
 * ```
 */
export function updateBreadcrumb(id, updates) {
    const breadcrumbs = [...currentRouteBreadcrumbs]
    const index = breadcrumbs.findIndex(crumb => crumb.id === id)

    if (index !== -1) {
        breadcrumbs[index] = {
            ...breadcrumbs[index],
            ...updates
        }
        currentRouteBreadcrumbs = breadcrumbs

        // Also update routeContext to keep it in sync
        currentRouterouteContext = {
            ...currentRouterouteContext,
            breadcrumbs
        }
    }
}

/**
 * Update the current route title
 *
 * @param {string} title - New title for the route
 *
 * @example
 * ```javascript
 * import { updateTitle } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * // After loading data
 * updateTitle('Invoice_Q4_2024.pdf')
 * ```
 */
export function updateTitle(title) {
    currentRouteTitle = title

    // Also update routeContext to keep it in sync
    currentRouterouteContext = {
        ...currentRouterouteContext,
        title
    }
}

/**
 * Hide the loading screen
 * Call this from your component after fetching data to hide the loading component
 *
 * @example
 * ```javascript
 * import { hideLoading, updateRouteMetadata } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * // In your component
 * onMount(async () => {
 *   const data = await fetchDocument(params.id)
 *
 *   // Update metadata with real data
 *   updateRouteMetadata({
 *     title: data.filename,
 *     breadcrumbs: [
 *       { label: 'Home', path: '/' },
 *       { label: 'Documents', path: '/documents' },
 *       { label: data.filename }
 *     ]
 *   })
 *
 *   // Hide loading screen
 *   hideLoading()
 * })
 * ```
 */
export function hideLoading() {
    isRouteLoading = false
    // Resolve any waiting promises
    routeReadyResolvers.forEach(resolve => resolve())
    routeReadyResolvers = []
}

/**
 * Wait for route to be ready (internal - used by Router)
 * Returns a promise that resolves when hideLoading() is called
 * @returns {Promise<void>}
 */
export function waitForRouteReady() {
    if (!isRouteLoading) {
        return Promise.resolve()
    }

    return new Promise(resolve => {
        routeReadyResolvers.push(resolve)
    })
}

/**
 * Start route loading (internal - used by Router)
 * Sets the loading state to true
 * @param {boolean} hasCustomComponent - Whether the route has a custom loading component
 */
export function startRouteLoading(hasCustomComponent = false) {
    isRouteLoading = true
    hasCustomLoadingComponent = hasCustomComponent
    routeReadyResolvers = []
}

/**
 * Check if route is currently loading
 * @returns {boolean} True if route is loading
 *
 * @example
 * ```javascript
 * import { routeIsLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * const loading = $derived(routeIsLoading())
 * ```
 */
export function routeIsLoading() {
    return isRouteLoading
}

/**
 * Check if route should use global loading indicator
 * Returns true only if route is loading AND doesn't have a custom loading component
 * @returns {boolean} True if global loading should be shown
 *
 * @example
 * ```javascript
 * import { shouldShowGlobalLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * const showGlobalLoader = $derived(shouldShowGlobalLoading())
 * ```
 */
export function shouldShowGlobalLoading() {
    return isRouteLoading && !hasCustomLoadingComponent
}

/**
 * Manually show the loading screen
 * Use this when you want to show a loading state outside of navigation,
 * such as during form submissions, data refetching, or any async operation.
 *
 * Make sure to call hideLoading() when done to hide the loading screen.
 *
 * @example
 * ```javascript
 * import { showLoading, hideLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * async function handleFormSubmit() {
 *   // Show loading screen
 *   showLoading()
 *
 *   try {
 *     await submitForm(formData)
 *     // Navigate or update UI
 *   } finally {
 *     // Hide loading screen
 *     hideLoading()
 *   }
 * }
 * ```
 *
 * @example
 * ```javascript
 * // Refetch data with loading screen
 * async function refetchData() {
 *   showLoading()
 *   const newData = await fetchData()
 *   updatePageData(newData)
 *   hideLoading()
 * }
 * ```
 */
export function showLoading() {
    isRouteLoading = true
    hasCustomLoadingComponent = false // Reset flag so global loader shows
}
