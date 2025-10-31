import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { push, replace, location } from '../lib/utils.svelte.js'
import { registerRoutes, clearRoutes } from '../lib/routes.svelte.js'

describe('Named Routes Navigation', () => {
  beforeEach(() => {
    // Reset to home
    window.location.hash = '#/'
    window.history.replaceState(null, '', '#/')

    // Clear any previously registered routes
    clearRoutes()

    // Register test routes
    registerRoutes({
      'home': '/',
      'about': '/about',
      'user': '/user/:id',
      'document': '/documents/:docId',
      'search': '/search'
    })
  })

  afterEach(() => {
    clearRoutes()
  })

  describe('push with named routes', () => {
    it('should navigate using single-argument named route (no params)', async () => {
      push('about')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/about')
      expect(location()).toBe('/about')
    })

    it('should navigate to home using named route', async () => {
      // First go somewhere else
      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))

      // Then navigate home by name
      push('home')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/')
      expect(location()).toBe('/')
    })

    it('should navigate using named route with params (multi-param signature)', async () => {
      push('user', { id: '123' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/user/123')
      expect(location()).toBe('/user/123')
    })

    it('should navigate using named route with params and query', async () => {
      push('user', { id: '456' }, { tab: 'profile' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('/user/456')
      expect(window.location.hash).toContain('tab=profile')
    })

    it('should still work with path strings (backward compatibility)', async () => {
      push('/search')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/search')
      expect(location()).toBe('/search')
    })

    it('should distinguish between named routes and paths', async () => {
      // Path (starts with /)
      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(location()).toBe('/about')

      // Named route (no leading /)
      push('home')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(location()).toBe('/')

      // Named route with params
      push('document', { docId: 'test' })
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(location()).toBe('/documents/test')
    })
  })

  describe('replace with named routes', () => {
    it('should replace using single-argument named route', async () => {
      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))

      const historyLength = window.history.length

      replace('search')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/search')
      expect(location()).toBe('/search')
      expect(window.history.length).toBe(historyLength)
    })

    it('should replace using named route with params', async () => {
      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))

      const historyLength = window.history.length

      replace('user', { id: '789' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/user/789')
      expect(window.history.length).toBe(historyLength)
    })

    it('should still work with path strings (backward compatibility)', async () => {
      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))

      const historyLength = window.history.length

      replace('/search')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/search')
      expect(window.history.length).toBe(historyLength)
    })
  })

  describe('error handling', () => {
    it('should throw error for unregistered named route', async () => {
      // The buildUrl function returns the name as-is when not found
      // This should trigger an error since 'unknownRoute' doesn't start with /
      let errorThrown = false
      let errorMessage = ''

      try {
        await push('unknownRoute')
      } catch (error) {
        errorThrown = true
        errorMessage = error.message
      }

      expect(errorThrown).toBe(true)
      expect(errorMessage).toBe('Invalid parameter location')
    })
  })

  describe('mixed navigation scenarios', () => {
    it('should handle alternating between named routes and paths', async () => {
      // Named route
      push('about')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(location()).toBe('/about')

      // Path
      push('/search')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(location()).toBe('/search')

      // Named route with params
      push('user', { id: '999' })
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(location()).toBe('/user/999')

      // Path again
      push('/')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(location()).toBe('/')
    })

    it('should handle replace and push with named routes', async () => {
      push('about')
      await new Promise(resolve => setTimeout(resolve, 50))

      const historyLength = window.history.length

      replace('search')
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(window.history.length).toBe(historyLength)

      push('user', { id: '111' })
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(window.history.length).toBe(historyLength + 1)
    })
  })
})
