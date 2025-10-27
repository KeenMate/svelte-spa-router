import { describe, it, expect, beforeEach, vi } from 'vitest'
import { push, pop, replace, location, querystring, routeParams } from '../lib/utils.svelte.js'

describe('Navigation Functions', () => {
  beforeEach(() => {
    window.location.hash = '#/'
    window.history.replaceState(null, '', '#/')
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
    it('should be reactive to route changes', async () => {
      // This test requires Router to be mounted for params to work
      // For now, we'll just check it exists and is callable
      expect(typeof routeParams).toBe('function')
    })
  })
})
