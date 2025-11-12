import { metadataLogger } from '../logger.ts'
﻿/**
 * Route metadata helpers for accessing title and breadcrumbs
 *
 * This module provides reactive access to the current route's metadata
 * (title and breadcrumbs) that updates automatically on route changes.
 * It also provides loading control for routes that need to fetch data.
 */

import { untrack } from 'svelte'

/**
 * Current route metadata state
 * Single source of truth - other values derive from this
 */
let currentRouterouteContext = $state({})
let currentRouteTitle = $derived(currentRouterouteContext.title || '')
let currentRouteBreadcrumbs = $derived(currentRouterouteContext.breadcrumbs || [])

/**
 * Loading control state
 */
let routeReadyResolvers = []
let isRouteLoading = $state(false)
let hasCustomLoadingComponent = $state(false)

/**
 * Track the current route to detect route changes
 */
let currentRouteKey = null
let currentBasePath = null // Track base path to clear cache on major route changes

/**
 * Cache for manually updated breadcrumbs
 * Maps breadcrumb ID to updated breadcrumb data
 */
let updatedBreadcrumbsCache = new Map()

/**
 * Update route metadata (called by Router or user code)
 * @param {Object} routeContext - route context from the route
 * @param {string} location - current location
 * @param {string} querystring - current querystring
 * @param {Object} params - route params
 */
export function updateRouteMetadata(routeContext = {}, location = '', querystring = '', params = {}) {
    // Create a unique key for this route (location + querystring + params)
    const routeKey = `${location}|${querystring}|${JSON.stringify(params)}`

    // Extract base path (e.g., /documents/1 → /documents, /documents/1/logs → /documents/1)
    // This is a simple heuristic: get path up to the last segment
    const pathSegments = location.split('/').filter(Boolean)
    const basePath = pathSegments.length > 1 ? '/' + pathSegments.slice(0, -1).join('/') : location

    // Clear cache if navigating to a different base path (e.g., /documents/1 → /documents/2)
    if (currentBasePath && currentBasePath !== basePath && !location.startsWith(currentBasePath + '/')) {
        metadataLogger.debug('[updateRouteMetadata] Base path changed from', currentBasePath, 'to', basePath, '- clearing cache')
        clearBreadcrumbCache()
    }

    // Only update if route actually changed
    if (currentRouteKey !== routeKey) {
        currentRouterouteContext = routeContext
        currentRouteKey = routeKey
        currentBasePath = basePath
        metadataLogger.debug('[updateRouteMetadata] Route changed to:', routeKey)
    } else {
        metadataLogger.debug('[updateRouteMetadata] Same route, ignoring update')
    }
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
    // Store the update in cache
    updatedBreadcrumbsCache.set(id, updates)
    metadataLogger.debug('[updateBreadcrumb] Cached update for id:', id, 'updates:', updates)

    // Get snapshot to work with plain values (not proxies)
    const currentContext = $state.snapshot(currentRouterouteContext)
    const breadcrumbs = [...(currentContext.breadcrumbs || [])]
    const index = breadcrumbs.findIndex(crumb => crumb.id === id)
    metadataLogger.debug('[updateBreadcrumb] Found at index:', index)

    if (index !== -1) {
        breadcrumbs[index] = {
            ...breadcrumbs[index],
            ...updates
        }
        metadataLogger.debug('[updateBreadcrumb] Updated breadcrumb to:', breadcrumbs[index])
        currentRouterouteContext = {
            ...currentContext,
            breadcrumbs
        }
    } else {
        metadataLogger.debug('[updateBreadcrumb] Breadcrumb with id not found!')
    }
}

/**
 * Get a cached breadcrumb update by ID
 * Used by Router to apply manual updates when composing breadcrumbs
 *
 * @param {string} id - The breadcrumb ID
 * @returns {Object|null} The cached update or null if not found
 */
export function getUpdatedBreadcrumb(id) {
    return updatedBreadcrumbsCache.get(id) || null
}

/**
 * Clear the breadcrumb cache
 * Called when navigating to a different route (not child routes)
 */
export function clearBreadcrumbCache() {
    metadataLogger.debug('[clearBreadcrumbCache] Clearing cache')
    updatedBreadcrumbsCache.clear()
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
    currentRouterouteContext = {
        ...currentRouterouteContext,
        title
    }
    // Title updates don't affect breadcrumbs flag
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
