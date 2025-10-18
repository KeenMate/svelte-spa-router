/**
 * Type definitions for route metadata helpers
 */

/**
 * Breadcrumb item structure
 */
export interface BreadcrumbItem {
    /** Optional ID for partial updates */
    id?: string;
    /** Label to display */
    label: string;
    /** Optional path for the breadcrumb link */
    path?: string;
}

/**
 * Update route metadata (called internally by Router or manually by user)
 * @param userData - User data from the route containing title, breadcrumbs, etc.
 *
 * @example
 * ```typescript
 * import { updateRouteMetadata } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * // Manually update metadata
 * updateRouteMetadata({
 *   title: 'Dashboard',
 *   breadcrumbs: [
 *     { label: 'Home', path: '/' },
 *     { label: 'Dashboard' }
 *   ]
 * })
 * ```
 */
export function updateRouteMetadata(userData?: Record<string, any>): void;

/**
 * Get current route title reactively
 * @returns Current route title
 *
 * @example
 * ```typescript
 * import { routeTitle } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * // In a component
 * const title = $derived(routeTitle())
 * ```
 */
export function routeTitle(): string;

/**
 * Get current route breadcrumbs reactively
 * @returns Array of breadcrumb items
 *
 * @example
 * ```typescript
 * import { routeBreadcrumbs } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * // In a component
 * const breadcrumbs = $derived(routeBreadcrumbs())
 * ```
 */
export function routeBreadcrumbs(): BreadcrumbItem[];

/**
 * Get full route user data reactively
 * @returns Current route's userData object
 *
 * @example
 * ```typescript
 * import { routeUserData } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * // In a component
 * const userData = $derived(routeUserData())
 * const customField = userData.myCustomField
 * ```
 */
export function routeUserData(): Record<string, any>;

/**
 * Hide the loading screen
 * Call this from your component after fetching data to hide the loading component
 * Only needed when using shouldDisplayLoadingOnRouteLoad: true
 *
 * @example
 * ```typescript
 * import { onMount } from 'svelte'
 * import { hideLoading, updateRouteMetadata } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * let { params } = $props()
 *
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
export function hideLoading(): void;

/**
 * Show the loading screen manually
 * Use this when you want to show a loading state outside of navigation,
 * such as during form submissions, data refetching, or any async operation.
 *
 * @example
 * ```typescript
 * import { showLoading, hideLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * async function handleFormSubmit() {
 *   showLoading()
 *   try {
 *     await submitForm(formData)
 *   } finally {
 *     hideLoading()
 *   }
 * }
 * ```
 */
export function showLoading(): void;

/**
 * Check if route is currently loading (waiting for data)
 * @returns True if route is loading
 *
 * @example
 * ```typescript
 * import { routeIsLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * const loading = $derived(routeIsLoading())
 * ```
 */
export function routeIsLoading(): boolean;

/**
 * Update a specific breadcrumb by ID without replacing the entire breadcrumbs array
 * This is useful when you want to update dynamic segments after data loads
 *
 * @param id - The ID of the breadcrumb to update
 * @param updates - Object containing label and/or path updates
 *
 * @example
 * ```typescript
 * import { updateBreadcrumb } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
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
export function updateBreadcrumb(
    id: string,
    updates: { label?: string; path?: string }
): void;

/**
 * Update the current route title
 *
 * @param title - New title for the route
 *
 * @example
 * ```typescript
 * import { updateTitle } from '@keenmate/svelte-spa-router/helpers/route-metadata'
 *
 * // After loading data
 * updateTitle('Invoice_Q4_2024.pdf')
 * ```
 */
export function updateTitle(title: string): void;
