import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  configurePermissions,
  createPermissionCondition,
  createProtectedRoute,
  hasPermission
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
          userData: expect.objectContaining({
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
      expect(route).toHaveProperty('userData')
      expect(route.userData.permissions).toEqual({ any: ['read'] })
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

    it('should support custom userData', () => {
      const component = () => import('../lib/Router.svelte')
      const userData = { role: 'admin' }

      const route = createProtectedRoute({
        component,
        permissions: { any: ['read'] },
        userData
      })

      expect(route.userData).toMatchObject({
        role: 'admin',
        permissions: { any: ['read'] }
      })
    })
  })
})
