import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  push, pop, replace, goBack,
  location, querystring, routeParams, loc,
  navigationContext, setNavigationContext,
  setIncludeReferrer, getIncludeReferrer,
  setParamReplacementPlaceholder, getParamReplacementPlaceholder,
  setParams,
  revalidateCurrentRoute, registerRevalidationListener
} from '../lib/utils.svelte.js'
import { registerRoutes, clearRoutes } from '../lib/routes.svelte.js'

describe('Navigation Functions', () => {
  beforeEach(() => {
    window.location.hash = '#/'
    window.history.replaceState(null, '', '#/')
    setNavigationContext(null)
  })

  describe('push', () => {
    it('should navigate to a new route', async () => {
      push('/about')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/about')
    })

    it('should navigate with query parameters', async () => {
      push('/search?q=test')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('/search')
      expect(window.location.hash).toContain('q=test')
    })

    it('should add entry to history', async () => {
      const initialLength = window.history.length

      push('/page1')
      await new Promise(resolve => setTimeout(resolve, 50))

      push('/page2')
      await new Promise(resolve => setTimeout(resolve, 50))

      // History should have grown
      expect(window.history.length).toBeGreaterThan(initialLength)
    })

    it('should throw for invalid location', async () => {
      await expect(push('')).rejects.toThrow('Invalid parameter location')
    })

    it('should accept array format [route, params, query, navigationContext]', async () => {
      registerRoutes({ 'testRoute': '/test-array/:id' })

      push(['testRoute', { id: '42' }, {}, null])
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/test-array/42')

      clearRoutes()
    })

    it('should accept object format { route, params, query }', async () => {
      registerRoutes({ 'objRoute': '/test-obj/:id' })

      push({ route: 'objRoute', params: { id: '99' }, query: {} })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/test-obj/99')

      clearRoutes()
    })

    it('should accept multi-parameter signature with named route and query', async () => {
      registerRoutes({ 'multiTest': '/multi-test' })

      push('multiTest', {}, { tab: 'settings' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('/multi-test')
      expect(window.location.hash).toContain('tab=settings')

      clearRoutes()
    })

    it('should serialize query object when called with a path (multi-param)', async () => {
      push('/path-query', {}, { foo: 'bar', baz: 'qux' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('/path-query')
      expect(window.location.hash).toContain('foo=bar')
      expect(window.location.hash).toContain('baz=qux')
    })

    it('should URL-encode keys and values from query object', async () => {
      push('/encode', {}, { 'k ey': 'v&l=ue' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('k%20ey=v%26l%3Due')
    })

    it('should skip null/undefined values in query object', async () => {
      push('/null-skip', {}, { keep: 'yes', skip: null, gone: undefined })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('keep=yes')
      expect(window.location.hash).not.toContain('skip=')
      expect(window.location.hash).not.toContain('gone=')
    })

    it('should merge path-embedded query with query object using &', async () => {
      push('/both?existing=1', {}, { added: '2' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('existing=1')
      expect(window.location.hash).toContain('added=2')
      // Exactly one '?', the rest joined with '&'
      const hash = window.location.hash
      const questionMarks = (hash.match(/\?/g) || []).length
      expect(questionMarks).toBe(1)
    })

    it('should leave path untouched when query object is empty', async () => {
      push('/no-query', {}, {})
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/no-query')
    })
  })

  describe('pop', () => {
    it('should navigate back in history', async () => {
      push('/page1')
      await new Promise(resolve => setTimeout(resolve, 50))

      push('/page2')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/page2')

      pop()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/page1')
    })
  })

  describe('goBack', () => {
    it('should navigate back (alias for pop)', async () => {
      push('/step1')
      await new Promise(resolve => setTimeout(resolve, 50))

      push('/step2')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/step2')

      goBack()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/step1')
    })
  })

  describe('replace', () => {
    it('should replace current route without adding to history', async () => {
      push('/page1')
      await new Promise(resolve => setTimeout(resolve, 50))

      const historyLength = window.history.length

      replace('/page2')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/page2')
      expect(window.history.length).toBe(historyLength)
    })

    it('should serialize query object when called with a path (multi-param)', async () => {
      replace('/replace-query', {}, { foo: 'bar' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('/replace-query')
      expect(window.location.hash).toContain('foo=bar')
    })
  })

  describe('location', () => {
    it('should return current location path', async () => {
      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(location()).toBe('/about')
    })

    it('should return location without query string', async () => {
      push('/search?q=test')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(location()).toBe('/search')
    })
  })

  describe('loc', () => {
    it('should return full location object with location and querystring', async () => {
      push('/page?key=val')
      await new Promise(resolve => setTimeout(resolve, 50))

      const l = loc()
      expect(l.location).toBe('/page')
      expect(l.querystring).toBe('key=val')
    })
  })

  describe('querystring', () => {
    it('should return query string', async () => {
      push('/search?q=test&page=1')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(querystring()).toBe('q=test&page=1')
    })

    it('should return empty string when no query string', async () => {
      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(querystring()).toBe('')
    })
  })

  describe('routeParams', () => {
    it('should be callable and return current params', () => {
      expect(typeof routeParams).toBe('function')
    })

    it('should reflect values set via setParams', () => {
      setParams({ id: '42', name: 'test' })

      expect(routeParams()).toEqual({ id: '42', name: 'test' })

      // Clean up
      setParams(undefined)
    })
  })

  describe('navigationContext', () => {
    it('should be null by default', () => {
      expect(navigationContext()).toBeNull()
    })

    it('setNavigationContext should update context', () => {
      setNavigationContext({ orderId: 123, source: 'menu' })

      expect(navigationContext()).toEqual({ orderId: 123, source: 'menu' })
    })

    it('setNavigationContext(null) should clear context', () => {
      setNavigationContext({ data: 'test' })
      expect(navigationContext()).not.toBeNull()

      setNavigationContext(null)
      expect(navigationContext()).toBeNull()
    })

    it('push should pass navigation context (4-param style)', async () => {
      push('/target', {}, {}, { customData: 'hello' })
      await new Promise(resolve => setTimeout(resolve, 50))

      const ctx = navigationContext()
      expect(ctx).toBeTruthy()
      expect(ctx.customData).toBe('hello')
    })

    it('push multi-param should pass navigation context as 4th arg', async () => {
      push('/ctx-test', {}, {}, { fromPage: 'dashboard' })
      await new Promise(resolve => setTimeout(resolve, 50))

      const ctx = navigationContext()
      expect(ctx).toBeTruthy()
      expect(ctx.fromPage).toBe('dashboard')
    })

    it('navigationContext() returns null after push() with no user context', async () => {
      // push() internally injects _routeName for referrer tracking. That key
      // must not leak into the public navigationContext() — if the user
      // didn't pass any context, they should see null, not { _routeName }.
      // This was the bug behind the broken NavigationContextDemo "back to list"
      // path where the list view never re-rendered after a backToList push().
      push('/no-context-route')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(navigationContext()).toBeNull()
    })

    it('navigationContext() filters out internal _routeName but keeps user keys', async () => {
      push('/some-route', {}, {}, { foo: 'bar' })
      await new Promise(resolve => setTimeout(resolve, 50))

      const ctx = navigationContext()
      expect(ctx).toEqual({ foo: 'bar' }) // no _routeName visible
      expect(ctx._routeName).toBeUndefined()
    })
  })

  describe('setIncludeReferrer', () => {
    it('should default to never', () => {
      expect(getIncludeReferrer()).toBe('never')
    })

    it('should accept valid values', () => {
      setIncludeReferrer('always')
      expect(getIncludeReferrer()).toBe('always')

      setIncludeReferrer('notfound')
      expect(getIncludeReferrer()).toBe('notfound')

      setIncludeReferrer('never')
      expect(getIncludeReferrer()).toBe('never')
    })

    it('should reject invalid values', () => {
      setIncludeReferrer('always')
      setIncludeReferrer('invalid') // should warn and not change

      expect(getIncludeReferrer()).toBe('always') // unchanged
    })
  })

  describe('setParamReplacementPlaceholder', () => {
    it('should default to N-A', () => {
      expect(getParamReplacementPlaceholder()).toBe('N-A')
    })

    it('should update placeholder', () => {
      setParamReplacementPlaceholder('MISSING')
      expect(getParamReplacementPlaceholder()).toBe('MISSING')

      // Reset
      setParamReplacementPlaceholder('N-A')
    })
  })

  describe('revalidateCurrentRoute', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('invokes registered listeners after the debounce window', () => {
      const listener = vi.fn()
      const unregister = registerRevalidationListener(listener)

      revalidateCurrentRoute()
      expect(listener).not.toHaveBeenCalled() // debounced

      vi.advanceTimersByTime(60)
      expect(listener).toHaveBeenCalledTimes(1)

      unregister()
    })

    it('coalesces rapid-fire calls into a single listener invocation', () => {
      const listener = vi.fn()
      const unregister = registerRevalidationListener(listener)

      revalidateCurrentRoute()
      revalidateCurrentRoute()
      revalidateCurrentRoute()
      revalidateCurrentRoute()

      vi.advanceTimersByTime(60)
      expect(listener).toHaveBeenCalledTimes(1)

      unregister()
    })

    it('notifies multiple registered listeners (multi-router scenario)', () => {
      const listenerA = vi.fn()
      const listenerB = vi.fn()
      const unregA = registerRevalidationListener(listenerA)
      const unregB = registerRevalidationListener(listenerB)

      revalidateCurrentRoute()
      vi.advanceTimersByTime(60)

      expect(listenerA).toHaveBeenCalledTimes(1)
      expect(listenerB).toHaveBeenCalledTimes(1)

      unregA()
      unregB()
    })

    it('unregister stops the listener from firing on subsequent calls', () => {
      const listener = vi.fn()
      const unregister = registerRevalidationListener(listener)

      revalidateCurrentRoute()
      vi.advanceTimersByTime(60)
      expect(listener).toHaveBeenCalledTimes(1)

      unregister()
      revalidateCurrentRoute()
      vi.advanceTimersByTime(60)
      expect(listener).toHaveBeenCalledTimes(1) // not called again
    })

    it('a throwing listener does not prevent other listeners from running', () => {
      const thrower = vi.fn(() => { throw new Error('boom') })
      const survivor = vi.fn()
      const unregA = registerRevalidationListener(thrower)
      const unregB = registerRevalidationListener(survivor)

      revalidateCurrentRoute()
      vi.advanceTimersByTime(60)

      expect(thrower).toHaveBeenCalledTimes(1)
      expect(survivor).toHaveBeenCalledTimes(1)

      unregA()
      unregB()
    })
  })
})
