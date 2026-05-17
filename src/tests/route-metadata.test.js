import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  updateRouteMetadata,
  routeContext,
  routeTitle,
  routeBreadcrumbs,
  updateBreadcrumb,
  updateTitle,
  getUpdatedBreadcrumb,
  clearBreadcrumbCache,
  startRouteLoading,
  hideLoading,
  showLoading,
  routeIsLoading,
  shouldShowGlobalLoading,
  waitForRouteReady
} from '../lib/helpers/route-metadata.svelte.js'

describe('Route Metadata', () => {
  beforeEach(() => {
    // Reset state between tests by updating to empty context with a unique location
    clearBreadcrumbCache()
    updateRouteMetadata({}, '/reset-' + Date.now(), '', {})
    hideLoading()
  })

  describe('updateRouteMetadata and accessors', () => {
    it('should update routeContext()', () => {
      updateRouteMetadata(
        { title: 'Test Page', breadcrumbs: [{ label: 'Home' }], custom: 'value' },
        '/test', '', {}
      )

      const ctx = routeContext()
      expect(ctx.title).toBe('Test Page')
      expect(ctx.breadcrumbs).toEqual([{ label: 'Home' }])
      expect(ctx.custom).toBe('value')
    })

    it('should update routeTitle()', () => {
      updateRouteMetadata({ title: 'My Title' }, '/title-test', '', {})

      expect(routeTitle()).toBe('My Title')
    })

    it('should return empty string for missing title', () => {
      updateRouteMetadata({}, '/no-title', '', {})

      expect(routeTitle()).toBe('')
    })

    it('should update routeBreadcrumbs()', () => {
      const crumbs = [
        { label: 'Home', path: '/' },
        { label: 'About' }
      ]
      updateRouteMetadata({ breadcrumbs: crumbs }, '/breadcrumb-test', '', {})

      expect(routeBreadcrumbs()).toEqual(crumbs)
    })

    it('should return empty array for missing breadcrumbs', () => {
      updateRouteMetadata({}, '/no-crumbs', '', {})

      expect(routeBreadcrumbs()).toEqual([])
    })

    it('should ignore duplicate updates (same route key)', () => {
      updateRouteMetadata({ title: 'First' }, '/same', 'q=1', { id: '1' })
      updateRouteMetadata({ title: 'Second' }, '/same', 'q=1', { id: '1' })

      // Should still be 'First' because same key is ignored
      expect(routeTitle()).toBe('First')
    })

    it('should preserve breadcrumbs on querystring-only change', () => {
      updateRouteMetadata(
        { title: 'Page', breadcrumbs: [{ label: 'Home' }, { label: 'Page' }] },
        '/page', '', {}
      )

      // Change only querystring
      updateRouteMetadata(
        { title: 'Page Updated', breadcrumbs: [{ label: 'Different' }] },
        '/page', 'tab=2', {}
      )

      // Breadcrumbs should be preserved from the original
      expect(routeBreadcrumbs()).toEqual([{ label: 'Home' }, { label: 'Page' }])
    })

    it('should update context on actual route change', () => {
      updateRouteMetadata({ title: 'Page A' }, '/page-a', '', {})
      expect(routeTitle()).toBe('Page A')

      updateRouteMetadata({ title: 'Page B' }, '/page-b', '', {})
      expect(routeTitle()).toBe('Page B')
    })
  })

  describe('updateTitle', () => {
    it('should update the title in routeContext', () => {
      updateRouteMetadata({ title: 'Original' }, '/update-title', '', {})
      expect(routeTitle()).toBe('Original')

      updateTitle('Updated Title')
      expect(routeTitle()).toBe('Updated Title')
    })

    it('should preserve other context fields when updating title', () => {
      updateRouteMetadata({ title: 'Old', custom: 'data' }, '/title-preserve', '', {})

      updateTitle('New Title')

      expect(routeTitle()).toBe('New Title')
      expect(routeContext().custom).toBe('data')
    })
  })

  describe('updateBreadcrumb', () => {
    it('should update a breadcrumb by ID', () => {
      updateRouteMetadata({
        breadcrumbs: [
          { label: 'Home', path: '/' },
          { id: 'detail', label: 'Loading...' }
        ]
      }, '/breadcrumb-update', '', {})

      updateBreadcrumb('detail', { label: 'Document.pdf', path: '/doc/1' })

      const crumbs = routeBreadcrumbs()
      expect(crumbs[1].label).toBe('Document.pdf')
      expect(crumbs[1].path).toBe('/doc/1')
    })

    it('should not throw for non-existent breadcrumb ID', () => {
      updateRouteMetadata({
        breadcrumbs: [{ label: 'Home' }]
      }, '/crumb-missing', '', {})

      // Should not throw
      updateBreadcrumb('nonexistent', { label: 'Test' })

      // Breadcrumbs unchanged
      expect(routeBreadcrumbs()).toEqual([{ label: 'Home' }])
    })

    it('should cache update for reapplication', () => {
      updateRouteMetadata({
        breadcrumbs: [{ id: 'doc', label: 'Loading...' }]
      }, '/cache-test', '', {})

      updateBreadcrumb('doc', { label: 'Cached' })

      expect(getUpdatedBreadcrumb('doc')).toEqual({ label: 'Cached' })
    })
  })

  describe('breadcrumb cache', () => {
    it('should return null for uncached breadcrumb', () => {
      expect(getUpdatedBreadcrumb('nothing')).toBeNull()
    })

    it('should clear cache', () => {
      updateRouteMetadata({
        breadcrumbs: [{ id: 'test', label: 'Old' }]
      }, '/clear-cache', '', {})

      updateBreadcrumb('test', { label: 'Updated' })
      expect(getUpdatedBreadcrumb('test')).not.toBeNull()

      clearBreadcrumbCache()
      expect(getUpdatedBreadcrumb('test')).toBeNull()
    })

    it('should apply cached updates when navigating to new route with same breadcrumb IDs', () => {
      // Set up initial route and cache an update
      updateRouteMetadata({
        breadcrumbs: [{ id: 'doc', label: 'Loading...' }]
      }, '/doc/1', '', {})

      updateBreadcrumb('doc', { label: 'Invoice.pdf' })

      // Navigate to child route that has the same breadcrumb ID
      updateRouteMetadata({
        breadcrumbs: [{ id: 'doc', label: 'Loading...' }, { label: 'Logs' }]
      }, '/doc/1/logs', '', {})

      // The cached update should be applied
      const crumbs = routeBreadcrumbs()
      expect(crumbs[0].label).toBe('Invoice.pdf')
      expect(crumbs[1].label).toBe('Logs')
    })
  })

  describe('loading state', () => {
    it('should not be loading by default', () => {
      expect(routeIsLoading()).toBe(false)
    })

    it('startRouteLoading should set loading to true', () => {
      startRouteLoading()
      expect(routeIsLoading()).toBe(true)
    })

    it('hideLoading should set loading to false', () => {
      startRouteLoading()
      expect(routeIsLoading()).toBe(true)

      hideLoading()
      expect(routeIsLoading()).toBe(false)
    })

    it('showLoading should set loading to true', () => {
      showLoading()
      expect(routeIsLoading()).toBe(true)
    })

    it('shouldShowGlobalLoading should be true when loading without custom component', () => {
      startRouteLoading(false)
      expect(shouldShowGlobalLoading()).toBe(true)
    })

    it('shouldShowGlobalLoading should be false when loading with custom component', () => {
      startRouteLoading(true)
      expect(shouldShowGlobalLoading()).toBe(false)
    })

    it('shouldShowGlobalLoading should be false when not loading', () => {
      expect(shouldShowGlobalLoading()).toBe(false)
    })

    it('showLoading should reset custom component flag (show global loader)', () => {
      startRouteLoading(true) // has custom component
      expect(shouldShowGlobalLoading()).toBe(false)

      showLoading() // manual show resets the flag
      expect(shouldShowGlobalLoading()).toBe(true)
    })

    it('waitForRouteReady should resolve immediately when not loading', async () => {
      const result = await waitForRouteReady()
      expect(result).toBeUndefined() // resolved
    })

    it('waitForRouteReady should resolve when hideLoading is called', async () => {
      startRouteLoading()

      let resolved = false
      waitForRouteReady().then(() => { resolved = true })

      // Not resolved yet
      await new Promise(r => setTimeout(r, 10))
      expect(resolved).toBe(false)

      hideLoading()

      await new Promise(r => setTimeout(r, 10))
      expect(resolved).toBe(true)
    })

    it('a second startRouteLoading should resolve waiters from the previous one', async () => {
      // Simulates: user navigates to route A (shouldDisplayLoadingOnRouteLoad)
      // and then navigates to route B before A's hideLoading() fires. The first
      // waiter must resolve so route A's pipeline can bail via its loadingId
      // race check, instead of leaking an unresolvable promise.
      startRouteLoading()

      let firstResolved = false
      waitForRouteReady().then(() => { firstResolved = true })

      await new Promise(r => setTimeout(r, 10))
      expect(firstResolved).toBe(false)

      // New navigation starts loading — should resolve any pending waiters
      startRouteLoading()

      await new Promise(r => setTimeout(r, 10))
      expect(firstResolved).toBe(true)

      // Cleanup so the warning timer doesn't fire during other tests
      hideLoading()
    })
  })

  describe('loading state — diagnostic warning', () => {
    let warnSpy

    beforeEach(() => {
      vi.useFakeTimers()
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      hideLoading()
      warnSpy.mockRestore()
      vi.useRealTimers()
    })

    it('console.warn fires when hideLoading is not called within the threshold', () => {
      startRouteLoading()

      // Just before threshold — no warning yet
      vi.advanceTimersByTime(9999)
      expect(warnSpy).not.toHaveBeenCalled()

      // Cross the threshold
      vi.advanceTimersByTime(2)
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toMatch(/svelte-spa-router/)
      expect(warnSpy.mock.calls[0][0]).toMatch(/hideLoading/)
    })

    it('console.warn does NOT fire when hideLoading is called in time', () => {
      startRouteLoading()
      vi.advanceTimersByTime(5000)
      hideLoading()
      vi.advanceTimersByTime(10000)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('a subsequent startRouteLoading resets the warning timer', () => {
      startRouteLoading()
      vi.advanceTimersByTime(8000)

      // New navigation — old timer should be cleared, new timer starts fresh
      startRouteLoading()
      vi.advanceTimersByTime(8000) // Total 16s — old timer would have fired by now
      expect(warnSpy).not.toHaveBeenCalled()

      // Now cross the threshold from the SECOND startRouteLoading
      vi.advanceTimersByTime(3000)
      expect(warnSpy).toHaveBeenCalledTimes(1)
    })
  })
})
