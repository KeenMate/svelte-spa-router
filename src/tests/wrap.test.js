import { describe, it, expect, vi } from 'vitest'
import wrap, { createRouteDefinition, createRoute } from '../lib/wrap.js'

describe('wrap function', () => {
  it('should wrap a component for dynamic import', () => {
    const asyncComponent = () => import('../lib/Router.svelte')

    const wrapped = wrap({
      asyncComponent
    })

    expect(wrapped).toHaveProperty('_sveltesparouter', true)
    expect(wrapped).toHaveProperty('component')
    expect(typeof wrapped.component).toBe('function')
  })

  it('should attach conditions to wrapped component', () => {
    const component = () => import('../lib/Router.svelte')
    const condition1 = vi.fn(() => true)
    const condition2 = vi.fn(() => true)

    const wrapped = wrap({
      asyncComponent: component,
      conditions: [condition1, condition2]
    })

    expect(wrapped.conditions).toHaveLength(2)
    expect(wrapped.conditions[0]).toBe(condition1)
    expect(wrapped.conditions[1]).toBe(condition2)
  })

  it('should attach props to wrapped component', () => {
    const component = () => import('../lib/Router.svelte')
    const props = { foo: 'bar', baz: 123 }

    const wrapped = wrap({
      asyncComponent: component,
      props
    })

    expect(wrapped.props).toEqual(props)
  })

  it('should attach routeContext to wrapped component', () => {
    const component = () => import('../lib/Router.svelte')
    const routeContext = { role: 'admin' }

    const wrapped = wrap({
      asyncComponent: component,
      routeContext
    })

    expect(wrapped.routeContext).toEqual(routeContext)
  })

  it('should support loading component', () => {
    const LoadingComponent = { name: 'Loading' }
    const component = () => import('../lib/Router.svelte')

    const wrapped = wrap({
      asyncComponent: component,
      loadingComponent: LoadingComponent
    })

    expect(wrapped.component).toHaveProperty('loading', LoadingComponent)
  })

  it('should throw error if asyncComponent is not provided', () => {
    expect(() => {
      wrap({})
    }).toThrow()
  })

  it('should merge title and breadcrumbs into routeContext', () => {
    const component = () => import('../lib/Router.svelte')
    const breadcrumbs = [
      { label: 'Home', path: '/' },
      { label: 'My Page' }
    ]

    const wrapped = wrap({
      asyncComponent: component,
      title: 'My Page',
      breadcrumbs,
      routeContext: { section: 'demos', customField: 'hello' }
    })

    expect(wrapped.routeContext).toEqual({
      section: 'demos',
      customField: 'hello',
      title: 'My Page',
      breadcrumbs
    })
  })

  it('should merge title and breadcrumbs into routeContext without explicit routeContext', () => {
    const component = () => import('../lib/Router.svelte')

    const wrapped = wrap({
      asyncComponent: component,
      title: 'Simple Page',
      breadcrumbs: [{ label: 'Home', path: '/' }]
    })

    expect(wrapped.routeContext).toEqual({
      title: 'Simple Page',
      breadcrumbs: [{ label: 'Home', path: '/' }]
    })
  })

  it('should support all options together', () => {
    const component = () => import('../lib/Router.svelte')
    const condition = vi.fn(() => true)
    const props = { foo: 'bar' }
    const routeContext = { role: 'admin' }
    const LoadingComponent = { name: 'Loading' }

    const wrapped = wrap({
      asyncComponent: component,
      conditions: [condition],
      props,
      routeContext,
      loadingComponent: LoadingComponent
    })

    expect(wrapped._sveltesparouter).toBe(true)
    expect(wrapped.conditions).toHaveLength(1)
    expect(wrapped.props).toEqual(props)
    expect(wrapped.routeContext).toEqual(routeContext)
    expect(wrapped.component.loading).toBe(LoadingComponent)
  })

  it('should wrap sync component in Promise', async () => {
    const SyncComponent = { name: 'SyncComp' }

    const wrapped = wrap({
      component: SyncComponent
    })

    expect(wrapped._sveltesparouter).toBe(true)
    expect(typeof wrapped.component).toBe('function')

    // Calling it should resolve to the sync component
    const resolved = await wrapped.component()
    expect(resolved).toBe(SyncComponent)
  })

  it('should normalize single condition to array', () => {
    const condition = vi.fn(() => true)

    const wrapped = wrap({
      asyncComponent: () => import('../lib/Router.svelte'),
      conditions: condition
    })

    expect(wrapped.conditions).toHaveLength(1)
    expect(wrapped.conditions[0]).toBe(condition)
  })

  it('should throw if condition is not a function', () => {
    expect(() => {
      wrap({
        asyncComponent: () => import('../lib/Router.svelte'),
        conditions: ['not-a-function']
      })
    }).toThrow('Invalid parameter conditions[0]')
  })

  it('should throw when no args passed', () => {
    expect(() => wrap(null)).toThrow('Parameter args is required')
  })

  it('should throw when both component and asyncComponent provided', () => {
    expect(() => {
      wrap({
        component: { name: 'Comp' },
        asyncComponent: () => import('../lib/Router.svelte')
      })
    }).toThrow('One and only one of component and asyncComponent is required')
  })

  it('should set shouldDisplayLoadingOnRouteLoad', () => {
    const wrapped = wrap({
      asyncComponent: () => import('../lib/Router.svelte'),
      shouldDisplayLoadingOnRouteLoad: true
    })

    expect(wrapped.shouldDisplayLoadingOnRouteLoad).toBe(true)
  })

  it('should attach loadingParams to async component', () => {
    const LoadingComponent = { name: 'Loading' }
    const loadingParams = { message: 'Please wait...' }

    const wrapped = wrap({
      asyncComponent: () => import('../lib/Router.svelte'),
      loadingComponent: LoadingComponent,
      loadingParams
    })

    expect(wrapped.component.loading).toBe(LoadingComponent)
    expect(wrapped.component.loadingParams).toEqual(loadingParams)
  })
})

describe('wrap - zones mode', () => {
  it('should create zone-based route object', () => {
    const MainComponent = { name: 'Main' }
    const SidebarComponent = { name: 'Sidebar' }

    const wrapped = wrap({
      zones: {
        default: MainComponent,
        sidebar: SidebarComponent
      }
    })

    expect(wrapped._sveltesparouter).toBe(true)
    expect(wrapped._isZoneMode).toBe(true)
    expect(wrapped.zones).toBeDefined()
    expect(typeof wrapped.zones.default).toBe('function')
    expect(typeof wrapped.zones.sidebar).toBe('function')
  })

  it('should normalize sync zone components to async', async () => {
    const SyncComp = { name: 'Sync' }

    const wrapped = wrap({
      zones: { default: SyncComp }
    })

    // Should be wrapped in Promise
    const resolved = await wrapped.zones.default()
    expect(resolved).toBe(SyncComp)
  })

  it('should keep async zone components as-is', () => {
    const asyncComp = () => import('../lib/Router.svelte')

    const wrapped = wrap({
      zones: { default: asyncComp }
    })

    expect(wrapped.zones.default).toBe(asyncComp)
  })

  it('should throw if zones used with component', () => {
    expect(() => {
      wrap({
        zones: { default: { name: 'Comp' } },
        component: { name: 'Other' }
      })
    }).toThrow('Cannot use both zones and component/asyncComponent')
  })

  it('should throw if zones used with asyncComponent', () => {
    expect(() => {
      wrap({
        zones: { default: { name: 'Comp' } },
        asyncComponent: () => import('../lib/Router.svelte')
      })
    }).toThrow('Cannot use both zones and component/asyncComponent')
  })

  it('should throw if zones is empty object', () => {
    expect(() => {
      wrap({ zones: {} })
    }).toThrow('zones must be a non-empty object')
  })

  it('should attach conditions in zones mode', () => {
    const condition = vi.fn(() => true)

    const wrapped = wrap({
      zones: { default: { name: 'Comp' } },
      conditions: [condition]
    })

    expect(wrapped.conditions).toHaveLength(1)
    expect(wrapped.conditions[0]).toBe(condition)
  })

  it('should merge title and breadcrumbs into routeContext in zones mode', () => {
    const breadcrumbs = [{ label: 'Home', path: '/' }]

    const wrapped = wrap({
      zones: { default: { name: 'Comp' } },
      title: 'Zone Page',
      breadcrumbs,
      routeContext: { custom: true }
    })

    expect(wrapped.routeContext).toEqual({
      custom: true,
      title: 'Zone Page',
      breadcrumbs
    })
  })

  it('should include inheritance flags in zones mode', () => {
    const wrapped = wrap({
      zones: { default: { name: 'Comp' } },
      inheritBreadcrumbs: false,
      inheritPermissions: false,
      inheritConditions: false,
      inheritAuthorization: false
    })

    expect(wrapped.inheritBreadcrumbs).toBe(false)
    expect(wrapped.inheritPermissions).toBe(false)
    expect(wrapped.inheritConditions).toBe(false)
    expect(wrapped.inheritAuthorization).toBe(false)
  })
})

describe('wrap - inheritance flags', () => {
  it('should default all inheritance flags to true', () => {
    const wrapped = wrap({
      asyncComponent: () => import('../lib/Router.svelte')
    })

    expect(wrapped.inheritBreadcrumbs).toBe(true)
    expect(wrapped.inheritPermissions).toBe(true)
    expect(wrapped.inheritConditions).toBe(true)
    expect(wrapped.inheritAuthorization).toBe(true)
  })

  it('should allow disabling individual inheritance flags', () => {
    const wrapped = wrap({
      asyncComponent: () => import('../lib/Router.svelte'),
      inheritBreadcrumbs: false
    })

    expect(wrapped.inheritBreadcrumbs).toBe(false)
    expect(wrapped.inheritPermissions).toBe(true)
    expect(wrapped.inheritConditions).toBe(true)
    expect(wrapped.inheritAuthorization).toBe(true)
  })

  it('should allow disabling all inheritance flags', () => {
    const wrapped = wrap({
      asyncComponent: () => import('../lib/Router.svelte'),
      inheritBreadcrumbs: false,
      inheritPermissions: false,
      inheritConditions: false,
      inheritAuthorization: false
    })

    expect(wrapped.inheritBreadcrumbs).toBe(false)
    expect(wrapped.inheritPermissions).toBe(false)
    expect(wrapped.inheritConditions).toBe(false)
    expect(wrapped.inheritAuthorization).toBe(false)
  })
})

describe('createRouteDefinition', () => {
  it('should create a definition with async component', () => {
    const asyncComp = () => import('../lib/Router.svelte')

    const def = createRouteDefinition({
      component: asyncComp
    })

    // Async functions have length 0, so should be set as asyncComponent
    expect(def.asyncComponent).toBe(asyncComp)
    expect(def.component).toBeUndefined()
  })

  it('should create a definition with sync component', () => {
    const SyncComp = { name: 'Sync' }

    const def = createRouteDefinition({
      component: SyncComp
    })

    // Sync component (has no length property matching 0)
    expect(def.component).toBe(SyncComp)
    expect(def.asyncComponent).toBeUndefined()
  })

  it('should merge title and breadcrumbs into routeContext', () => {
    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte'),
      title: 'Test Page',
      breadcrumbs: [{ label: 'Test' }],
      routeContext: { custom: 'data' }
    })

    expect(def.routeContext).toEqual({
      custom: 'data',
      title: 'Test Page',
      breadcrumbs: [{ label: 'Test' }]
    })
  })

  it('should include loadingComponent', () => {
    const LoadingComp = { name: 'Loading' }

    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte'),
      loadingComponent: LoadingComp
    })

    expect(def.loadingComponent).toBe(LoadingComp)
  })

  it('should include loadingParams', () => {
    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte'),
      loadingComponent: { name: 'Loading' },
      loadingParams: { message: 'Wait' }
    })

    expect(def.loadingParams).toEqual({ message: 'Wait' })
  })

  it('should include conditions', () => {
    const guard = vi.fn(() => true)

    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte'),
      conditions: [guard]
    })

    expect(def.conditions).toHaveLength(1)
    expect(def.conditions[0]).toBe(guard)
  })

  it('should include props', () => {
    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte'),
      props: { color: 'blue' }
    })

    expect(def.props).toEqual({ color: 'blue' })
  })

  it('should include shouldDisplayLoadingOnRouteLoad', () => {
    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte'),
      shouldDisplayLoadingOnRouteLoad: true
    })

    expect(def.shouldDisplayLoadingOnRouteLoad).toBe(true)
  })

  it('should not set routeContext when no metadata provided', () => {
    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte')
    })

    expect(def.routeContext).toBeUndefined()
  })

  it('should pass through extra options (rest params)', () => {
    const def = createRouteDefinition({
      component: () => import('../lib/Router.svelte'),
      inheritBreadcrumbs: false,
      inheritPermissions: false
    })

    expect(def.inheritBreadcrumbs).toBe(false)
    expect(def.inheritPermissions).toBe(false)
  })
})

describe('createRoute', () => {
  it('should return a fully wrapped route', () => {
    const route = createRoute({
      component: () => import('../lib/Router.svelte'),
      title: 'Test'
    })

    expect(route._sveltesparouter).toBe(true)
    expect(typeof route.component).toBe('function')
    expect(route.routeContext.title).toBe('Test')
  })

  it('should produce same result as wrap(createRouteDefinition(...))', () => {
    const options = {
      component: () => import('../lib/Router.svelte'),
      title: 'Compare',
      breadcrumbs: [{ label: 'Compare' }],
      routeContext: { key: 'val' }
    }

    const viaCreateRoute = createRoute(options)
    const viaManual = wrap(createRouteDefinition(options))

    expect(viaCreateRoute.routeContext).toEqual(viaManual.routeContext)
    expect(viaCreateRoute._sveltesparouter).toBe(viaManual._sveltesparouter)
    expect(viaCreateRoute.inheritBreadcrumbs).toBe(viaManual.inheritBreadcrumbs)
  })

  it('should support conditions', () => {
    const guard = vi.fn(() => true)

    const route = createRoute({
      component: () => import('../lib/Router.svelte'),
      conditions: [guard]
    })

    expect(route.conditions).toHaveLength(1)
  })

  it('should support loadingComponent', () => {
    const Loading = { name: 'Loading' }

    const route = createRoute({
      component: () => import('../lib/Router.svelte'),
      loadingComponent: Loading
    })

    expect(route.component.loading).toBe(Loading)
  })
})
