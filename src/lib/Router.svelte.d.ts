/**
 * Type definitions for Router.svelte component
 */

import type { Component } from 'svelte';

/**
 * Event detail for route events
 */
export interface RouteEventDetail {
    /** The matched route pattern */
    route?: string;
    /** Current location */
    location: string;
    /** Query string */
    querystring?: string;
    /** Route parameters */
    params?: Record<string, string> | null;
    /** route context attached to the route */
    routeContext?: any;
    /** Component being loaded */
    component?: any;
    /** Component name */
    name?: string;
}

/**
 * Event detail for notFound event
 */
export interface NotFoundEventDetail {
    /** Current location that was not found */
    location: string;
    /** Query string */
    querystring?: string;
}

/**
 * Router component props
 */
export interface RouterProps {
    /**
     * Dictionary of all routes, in the format `'/path': component`.
     */
    routes?: Record<string, any>;

    /**
     * Optional prefix for the routes in this router. This is useful for example in the case of nested routers.
     */
    prefix?: string;

    /**
     * Optional zone name for multi-zone routing. When set, this router instance only renders the component for this zone.
     */
    zone?: string;

    /**
     * If set to true, the router will restore scroll positions on back navigation
     * and scroll to top on forward navigation.
     */
    restoreScrollState?: boolean;

    /**
     * Event handler called when any route event occurs
     */
    onrouteEvent?: (event: { detail: RouteEventDetail }) => void;

    /**
     * Event handler called when a route starts loading
     */
    onrouteLoading?: (event: { detail: RouteEventDetail }) => void;

    /**
     * Event handler called when a route finishes loading
     */
    onrouteLoaded?: (event: { detail: RouteEventDetail }) => void;

    /**
     * Event handler called when route conditions fail
     */
    onconditionsFailed?: (event: { detail: RouteEventDetail }) => void;

    /**
     * Event handler called when no route matches the current location (404)
     * Useful for logging 404s to analytics or error tracking services like Sentry
     *
     * @example
     * ```svelte
     * <Router
     *     {routes}
     *     onNotFound={(e) => {
     *         Sentry.captureMessage('404 Not Found', {
     *             extra: {
     *                 path: e.detail.location,
     *                 querystring: e.detail.querystring
     *             }
     *         })
     *     }}
     * />
     * ```
     */
    onNotFound?: (event: { detail: NotFoundEventDetail }) => void;
}

declare const Router: Component<RouterProps>;
export default Router;
