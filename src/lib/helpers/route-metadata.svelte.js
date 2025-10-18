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
let currentRouteUserData = $state({})

/**
 * Loading control state
 */
let routeReadyResolvers = []
let isRouteLoading = $state(false)

/**
 * Update route metadata (called by Router or user code)
 * @param {Object} userData - User data from the route
 */
export function updateRouteMetadata(userData = {}) {
    currentRouteTitle = userData.title || ''
    currentRouteBreadcrumbs = userData.breadcrumbs || []
    currentRouteUserData = userData
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
 * Get full route user data reactively
 * @returns {Object} Current route's userData
 *
 * @example
 * ```javascript
 * import { routeUserData } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * const userData = $derived(routeUserData())
 * const customData = $derived(userData.myCustomField)
 * ```
 */
export function routeUserData() {
    return currentRouteUserData
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

        // Also update userData to keep it in sync
        currentRouteUserData = {
            ...currentRouteUserData,
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

    // Also update userData to keep it in sync
    currentRouteUserData = {
        ...currentRouteUserData,
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
 */
export function startRouteLoading() {
    isRouteLoading = true
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
}
