import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  configurePermissions,
  createPermissionCondition,
  createProtectedRoute,
  createProtectedRouteDefinition,
  hasPermission,
  getUnauthorizedBehavior,
  getUnauthorizedRoute,
  getUnauthorizedComponent,
  getUnauthorizedHandler,
  hasExplicitHandler
} from '../lib/helpers/permissions.svelte.js'

describe('Permissions Helper', () => {
  beforeEach(() => {
    // Reset permissions configuration
    configurePermissions({
      checkPermissions: () => true,
      getCurrentUser: () => null,
      onUnauthorized: () => {}
    })
  })

  describe('configurePermissions', () => {
    it('should configure permission checker', () => {
      const checkPermissions = vi.fn(() => true)

      configurePermissions({
        checkPermissions,
        getCurrentUser: () => ({ id: 1 }),
        onUnauthorized: () => {}
      })

      // Use hasPermission to trigger the configured checker
      hasPermission({ any: ['read'] })

      expect(checkPermissions).toHaveBeenCalled()
    })

    it('should configure user getter', () => {
      const getCurrentUser = vi.fn(() => ({ id: 1, name: 'John' }))

      configurePermissions({
        checkPermissions: () => true,
        getCurrentUser,
        onUnauthorized: () => {}
      })

      hasPermission({ any: ['read'] })

      expect(getCurrentUser).toHaveBeenCalled()
    })

    it('should configure unauthorized handler', async () => {
      const onUnauthorized = vi.fn()

      configurePermissions({
        checkPermissions: () => false,
        getCurrentUser: () => ({ id: 1 }),
        onUnauthorized
      })

      const condition = createPermissionCondition({ any: ['admin'] })
      const result = await condition({ location: '/admin', route: '/admin' })

      expect(result).toBe(false)
      expect(onUnauthorized).toHaveBeenCalled()
    })
  })

  describe('createPermissionCondition', () => {
    it('should create a condition function', () => {
      const condition = createPermissionCondition({ any: ['read'] })

      expect(typeof condition).toBe('function')
    })

    it('should return true when permission check passes', async () => {
      configurePermissions({
        checkPermissions: () => true,
        getCurrentUser: () => ({ id: 1 })
      })

      const condition = createPermissionCondition({ any: ['read'] })
      const result = await condition({ location: '/data', route: '/data' })

      expect(result).toBe(true)
    })

    it('should return false when permission check fails', async () => {
      const onUnauthorized = vi.fn()

      configurePermissions({
        checkPermissions: () => false,
        getCurrentUser: () => ({ id: 1 }),
        onUnauthorized
      })

      const condition = createPermissionCondition({ any: ['admin'] })
      const result = await condition({ location: '/admin', route: '/admin' })

      expect(result).toBe(false)
    })

    it('should call unauthorized handler with route detail', async () => {
      const onUnauthorized = vi.fn()

      configurePermissions({
        checkPermissions: () => false,
        getCurrentUser: () => ({ id: 1 }),
        onUnauthorized
      })

      const condition = createPermissionCondition({ any: ['admin'] })
      const detail = { location: '/admin', route: '/admin' }

      await condition(detail)

      expect(onUnauthorized).toHaveBeenCalledWith(
        expect.objectContaining({
          location: '/admin',
          routeContext: expect.objectContaining({
            deniedRoute: '/admin'
          })
        })
      )
    })
  })

  describe('hasPermission', () => {
    it('should check permissions using configured checker', () => {
      const checkPermissions = vi.fn(() => true)

      configurePermissions({
        checkPermissions,
        getCurrentUser: () => ({ id: 1 })
      })

      const result = hasPermission({ any: ['read'] })

      expect(checkPermissions).toHaveBeenCalledWith(
        { id: 1 },
        { any: ['read'] }
      )
      expect(result).toBe(true)
    })

    it('should return false when no permissions', () => {
      configurePermissions({
        checkPermissions: () => false,
        getCurrentUser: () => ({ id: 1 })
      })

      const result = hasPermission({ any: ['admin'] })

      expect(result).toBe(false)
    })
  })

  describe('createProtectedRoute', () => {
    it('should create a wrapped route with permissions', () => {
      const component = () => import('../lib/Router.svelte')

      const route = createProtectedRoute({
        component,
        permissions: { any: ['read'] }
      })

      expect(route).toHaveProperty('component')
      expect(route).toHaveProperty('conditions')
      expect(route).toHaveProperty('routeContext')
      expect(route.routeContext.permissions).toEqual({ any: ['read'] })
      expect(route.conditions).toHaveLength(1)
    })

    it('should support loading component', () => {
      const component = () => import('../lib/Router.svelte')
      const LoadingComponent = { name: 'Loading' }

      const route = createProtectedRoute({
        component,
        permissions: { any: ['read'] },
        loadingComponent: LoadingComponent
      })

      // Loading component is attached to the async component function
      expect(route.component.loading).toBe(LoadingComponent)
    })

    it('should support custom props', () => {
      const component = () => import('../lib/Router.svelte')
      const props = { foo: 'bar' }

      const route = createProtectedRoute({
        component,
        permissions: { any: ['read'] },
        props
      })

      expect(route.props).toEqual(props)
    })

    it('should support custom routeContext', () => {
      const component = () => import('../lib/Router.svelte')
      const routeContext = { role: 'admin' }

      const route = createProtectedRoute({
        component,
        permissions: { any: ['read'] },
        routeContext
      })

      expect(route.routeContext).toMatchObject({
        role: 'admin',
        permissions: { any: ['read'] }
      })
    })

    it('should include authorizationCallback as a condition', () => {
      const component = () => import('../lib/Router.svelte')
      const authCallback = vi.fn(async () => true)

      const route = createProtectedRoute({
        component,
        permissions: { any: ['read'] },
        authorizationCallback: authCallback
      })

      // Should have 2 conditions: permission check + authorization callback
      expect(route.conditions).toHaveLength(2)
      expect(route.conditions[1]).toBe(authCallback)
    })

    it('should support authorizationCallback without permissions', () => {
      const component = () => import('../lib/Router.svelte')
      const authCallback = vi.fn(async () => true)

      const route = createProtectedRoute({
        component,
        authorizationCallback: authCallback
      })

      // Should have 1 condition: just the authorization callback
      expect(route.conditions).toHaveLength(1)
      expect(route.conditions[0]).toBe(authCallback)
    })

    it('should run permission check before authorizationCallback', async () => {
      const callOrder = []

      configurePermissions({
        checkPermissions: () => {
          callOrder.push('permissions')
          return true
        },
        getCurrentUser: () => ({ id: 1 })
      })

      const authCallback = vi.fn(async () => {
        callOrder.push('authorization')
        return true
      })

      const route = createProtectedRoute({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['read'] },
        authorizationCallback: authCallback
      })

      // Execute conditions in order (as Router would)
      const detail = { location: '/test', route: '/test' }
      for (const condition of route.conditions) {
        await condition(detail)
      }

      expect(callOrder).toEqual(['permissions', 'authorization'])
    })

    it('should not run authorizationCallback when permissions fail', async () => {
      configurePermissions({
        checkPermissions: () => false,
        getCurrentUser: () => ({ id: 1 }),
        onUnauthorized: () => {}
      })

      const authCallback = vi.fn(async () => true)

      const route = createProtectedRoute({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['admin'] },
        authorizationCallback: authCallback
      })

      // Execute first condition (permissions) - should fail
      const detail = { location: '/admin', route: '/admin' }
      const permResult = await route.conditions[0](detail)

      expect(permResult).toBe(false)
      // Authorization callback should NOT have been called
      expect(authCallback).not.toHaveBeenCalled()
    })
  })

  describe('permission requirements', () => {
    it('should support all: requirement (AND logic)', () => {
      const checkPermissions = vi.fn((user, requirements) => {
        // Simulate: user has 'read' and 'write' but not 'admin'
        const userPerms = ['read', 'write']
        if (requirements.all) {
          return requirements.all.every(p => userPerms.includes(p))
        }
        return false
      })

      configurePermissions({
        checkPermissions,
        getCurrentUser: () => ({ id: 1 })
      })

      // User has both 'read' and 'write'
      expect(hasPermission({ all: ['read', 'write'] })).toBe(true)

      // User is missing 'admin'
      expect(hasPermission({ all: ['read', 'admin'] })).toBe(false)
    })
  })

  describe('configuration getters', () => {
    it('getUnauthorizedBehavior should return default "component"', () => {
      expect(getUnauthorizedBehavior()).toBe('component')
    })

    it('getUnauthorizedBehavior should reflect configured value', () => {
      configurePermissions({ unauthorizedBehavior: 'navigate' })
      expect(getUnauthorizedBehavior()).toBe('navigate')
    })

    it('getUnauthorizedRoute should return default "/unauthorized"', () => {
      expect(getUnauthorizedRoute()).toBe('/unauthorized')
    })

    it('getUnauthorizedRoute should reflect configured value', () => {
      configurePermissions({ unauthorizedRoute: '/login' })
      expect(getUnauthorizedRoute()).toBe('/login')
    })

    it('getUnauthorizedComponent should return null by default', () => {
      expect(getUnauthorizedComponent()).toBeNull()
    })

    it('getUnauthorizedComponent should reflect configured value', () => {
      const MyComponent = { name: 'Forbidden' }
      configurePermissions({ unauthorizedComponent: MyComponent })
      expect(getUnauthorizedComponent()).toBe(MyComponent)
    })

    it('getUnauthorizedHandler should return a function', () => {
      expect(typeof getUnauthorizedHandler()).toBe('function')
    })

    it('hasExplicitHandler should be true after configuring onUnauthorized', () => {
      configurePermissions({ onUnauthorized: () => {} })
      expect(hasExplicitHandler()).toBe(true)
    })
  })

  describe('createProtectedRouteDefinition', () => {
    it('should return unwrapped route options', () => {
      const def = createProtectedRouteDefinition({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['read'] }
      })

      // Should NOT have _sveltesparouter (not wrapped yet)
      expect(def._sveltesparouter).toBeUndefined()
      // Should have asyncComponent set
      expect(def.asyncComponent).toBeDefined()
      // Should have conditions array with permission condition
      expect(def.conditions).toHaveLength(1)
      // Should have permissions in routeContext
      expect(def.routeContext.permissions).toEqual({ any: ['read'] })
    })

    it('should include loadingComponent', () => {
      const Loading = { name: 'Loading' }
      const def = createProtectedRouteDefinition({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['read'] },
        loadingComponent: Loading
      })

      expect(def.loadingComponent).toBe(Loading)
    })

    it('should include props', () => {
      const def = createProtectedRouteDefinition({
        component: () => import('../lib/Router.svelte'),
        props: { color: 'blue' }
      })

      expect(def.props).toEqual({ color: 'blue' })
    })

    it('should merge custom routeContext with permissions', () => {
      const def = createProtectedRouteDefinition({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['admin'] },
        routeContext: { section: 'admin', level: 2 }
      })

      expect(def.routeContext).toEqual({
        section: 'admin',
        level: 2,
        permissions: { any: ['admin'] }
      })
    })

    it('should include both permission and auth conditions', () => {
      const authCallback = vi.fn(async () => true)

      const def = createProtectedRouteDefinition({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['read'] },
        authorizationCallback: authCallback
      })

      expect(def.conditions).toHaveLength(2)
      expect(def.conditions[1]).toBe(authCallback)
    })

    it('should pass through inheritance flags', () => {
      const def = createProtectedRouteDefinition({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['read'] },
        inheritPermissions: false,
        inheritBreadcrumbs: false
      })

      expect(def.inheritPermissions).toBe(false)
      expect(def.inheritBreadcrumbs).toBe(false)
    })

    it('should produce a valid input for wrap()', () => {
      const { wrap } = require('../lib/wrap.js')

      const def = createProtectedRouteDefinition({
        component: () => import('../lib/Router.svelte'),
        permissions: { any: ['read'] }
      })

      const wrapped = wrap(def)

      expect(wrapped._sveltesparouter).toBe(true)
      expect(wrapped.conditions).toHaveLength(1)
      expect(wrapped.routeContext.permissions).toEqual({ any: ['read'] })
    })
  })
})
