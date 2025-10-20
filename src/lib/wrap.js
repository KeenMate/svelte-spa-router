/**
 * @typedef {Object} WrappedComponent Object returned by the `wrap` method
 * @property {SvelteComponent} component - Component to load (this is always asynchronous)
 * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
 * @property {Object} [props] - Optional dictionary of static props
 * @property {Object} [userData] - Optional user data dictionary
 * @property {bool} _sveltesparouter - Internal flag; always set to true
 */

/**
 * @callback AsyncSvelteComponent
 * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
 */

/**
 * @callback RoutePrecondition
 * @param {RouteDetail} detail - Route detail object
 * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
 */

/**
 * @typedef {Object} WrapOptions Options object for the call to `wrap`
 * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent` and `zones`)
 * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`) (incompatible with `zones`)
 * @property {Object.<string, SvelteComponent|AsyncSvelteComponent>} [zones] - Dictionary of zone names to components (incompatible with `component` and `asyncComponent`)
 * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
 * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
 * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
 * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
 * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
 * @property {string} [title] - Page title for this route
 * @property {Array<{label: string, path?: string}>} [breadcrumbs] - Breadcrumb trail for this route
 * @property {boolean} [shouldDisplayLoadingOnRouteLoad] - If true, keeps loading component visible until component calls hideLoading()
 */

/**
 * @typedef {Object} RouteOptions Options for creating a route
 * @property {Function|SvelteComponent} component - Component (sync) or async import function
 * @property {SvelteComponent} [loadingComponent] - Loading placeholder component
 * @property {object} [loadingParams] - Props for loading component
 * @property {object} [userData] - Custom user data
 * @property {object} [props] - Static props for the component
 * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route guards/pre-conditions
 * @property {string} [title] - Page title
 * @property {Array<{label: string, path?: string}>} [breadcrumbs] - Breadcrumb trail
 * @property {boolean} [shouldDisplayLoadingOnRouteLoad] - If true, keeps loading component visible until component calls hideLoading()
 */

/**
 * Wraps a component to enable multiple capabilities:
 * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
 * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
 * 3. Adding static props that are passed to the component
 * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
 *
 * @param {WrapOptions} args - Arguments object
 * @returns {WrappedComponent} Wrapped component
 */
export function wrap(args) {
    if (!args) {
        throw Error('Parameter args is required')
    }

    // Check if zones mode
    const isZoneMode = !!args.zones

    if (isZoneMode) {
        // Zones mode: validate zones
        if (args.component || args.asyncComponent) {
            throw Error('Cannot use both zones and component/asyncComponent')
        }
        if (!args.zones || typeof args.zones !== 'object' || Object.keys(args.zones).length === 0) {
            throw Error('zones must be a non-empty object')
        }

        // Normalize each zone component to async function
        const asyncZones = {}
        for (const [zoneName, zoneComponent] of Object.entries(args.zones)) {
            if (typeof zoneComponent === 'function' && zoneComponent.length === 0) {
                // Already async (import function)
                asyncZones[zoneName] = zoneComponent
            } else {
                // Sync component - wrap in Promise
                asyncZones[zoneName] = () => Promise.resolve(zoneComponent)
            }
        }

        // Validate conditions if provided
        if (args.conditions) {
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions]
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Return zone-based route object
        return {
            zones: asyncZones,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            shouldDisplayLoadingOnRouteLoad: args.shouldDisplayLoadingOnRouteLoad || false,
            _sveltesparouter: true,
            _isZoneMode: true
        }
    }

    // Single component mode (original behavior)
    // We need to have one and only one of component and asyncComponent
    // This does a "XNOR"
    if (!args.component == !args.asyncComponent) {
        throw Error('One and only one of component and asyncComponent is required')
    }

    // If the component is not async, wrap it into a function returning a Promise
    if (args.component) {
        args.asyncComponent = () => Promise.resolve(args.component)
    }

    // Parameter asyncComponent and each item of conditions must be functions
    if (typeof args.asyncComponent != 'function') {
        throw Error('Parameter asyncComponent must be a function')
    }
    if (args.conditions) {
        // Ensure it's an array
        if (!Array.isArray(args.conditions)) {
            args.conditions = [args.conditions]
        }
        for (let i = 0; i < args.conditions.length; i++) {
            if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                throw Error('Invalid parameter conditions[' + i + ']')
            }
        }
    }

    // Check if we have a placeholder component
    if (args.loadingComponent) {
        args.asyncComponent.loading = args.loadingComponent
        args.asyncComponent.loadingParams = args.loadingParams || undefined
    }

    // Returns an object that contains all the functions to execute too
    // The _sveltesparouter flag is to confirm the object was created by this router
    const obj = {
        component: args.asyncComponent,
        userData: args.userData,
        conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
        props: (args.props && Object.keys(args.props).length) ? args.props : {},
        shouldDisplayLoadingOnRouteLoad: args.shouldDisplayLoadingOnRouteLoad || false,
        _sveltesparouter: true
    }

    return obj
}

/**
 * Creates a route definition (without wrap)
 * Returns a configuration object that must be passed to wrap()
 *
 * @param {RouteOptions} options - Route configuration options
 * @returns {WrapOptions} Route definition (pass to wrap())
 *
 * @example
 * ```javascript
 * import { wrap, createRouteDefinition } from '@keenmate/svelte-spa-router/wrap'
 *
 * const routes = {
 *   '/admin': wrap(createRouteDefinition({
 *     component: () => import('./Admin.svelte'),
 *     title: 'Admin Panel',
 *     loadingComponent: Loading
 *   }))
 * }
 * ```
 */
export function createRouteDefinition(options) {
    const {
        component,
        loadingComponent,
        loadingParams,
        userData,
        props,
        conditions,
        title,
        breadcrumbs,
        shouldDisplayLoadingOnRouteLoad,
        ...restOptions
    } = options

    // Determine if component is async or sync
    const isAsync = typeof component === 'function' && component.length === 0

    const definition = {
        ...restOptions
    }

    if (isAsync) {
        definition.asyncComponent = component
    } else {
        definition.component = component
    }

    if (loadingComponent) {
        definition.loadingComponent = loadingComponent
    }

    if (loadingParams) {
        definition.loadingParams = loadingParams
    }

    // Merge title and breadcrumbs into userData
    const mergedUserData = {
        ...(userData || {})
    }

    if (title) {
        mergedUserData.title = title
    }

    if (breadcrumbs) {
        mergedUserData.breadcrumbs = breadcrumbs
    }

    if (Object.keys(mergedUserData).length > 0) {
        definition.userData = mergedUserData
    }

    if (props) {
        definition.props = props
    }

    if (conditions) {
        definition.conditions = conditions
    }

    if (shouldDisplayLoadingOnRouteLoad) {
        definition.shouldDisplayLoadingOnRouteLoad = shouldDisplayLoadingOnRouteLoad
    }

    return definition
}

/**
 * Creates a route (already wrapped)
 * This is the most convenient way to create routes - no wrap() needed!
 *
 * @param {RouteOptions} options - Route configuration options
 * @returns {WrappedComponent} Wrapped route component (ready to use)
 *
 * @example
 * ```javascript
 * import { createRoute } from '@keenmate/svelte-spa-router/wrap'
 *
 * const routes = {
 *   // No wrap() needed!
 *   '/': createRoute({
 *     component: () => import('./Home.svelte'),
 *     title: 'Home'
 *   }),
 *   '/admin': createRoute({
 *     component: () => import('./Admin.svelte'),
 *     title: 'Admin Panel',
 *     breadcrumbs: [
 *       { label: 'Home', path: '/' },
 *       { label: 'Admin' }
 *     ],
 *     loadingComponent: Loading,
 *     conditions: [checkAuth]
 *   })
 * }
 * ```
 */
export function createRoute(options) {
    const definition = createRouteDefinition(options)
    return wrap(definition)
}

export default wrap
