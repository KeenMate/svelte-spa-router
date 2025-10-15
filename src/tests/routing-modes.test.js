import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setHashRoutingEnabled, setBasePath, getHashRoutingEnabled, getBasePath, push, location } from '../lib/utils.svelte.js'

describe('Routing Modes', () => {
  let originalHash
  let originalPathname

  beforeEach(() => {
    originalHash = window.location.hash
    originalPathname = window.location.pathname
    // Reset to defaults
    setHashRoutingEnabled(true)
    setBasePath('/')
  })

  afterEach(() => {
    window.location.hash = originalHash
    // Reset to defaults
    setHashRoutingEnabled(true)
    setBasePath('/')
  })

  describe('Hash Routing Mode (default)', () => {
    it('should be enabled by default', () => {
      expect(getHashRoutingEnabled()).toBe(true)
    })

    it('should navigate using hash', async () => {
      setHashRoutingEnabled(true)

      push('/about')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toBe('#/about')
    })

    it('should extract location from hash', async () => {
      setHashRoutingEnabled(true)
      window.location.hash = '#/test'

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(location()).toBe('/test')
    })

    it('should handle query strings in hash mode', async () => {
      setHashRoutingEnabled(true)

      push('/search?q=test')
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('#/search')
      expect(window.location.hash).toContain('q=test')
    })
  })

  describe('History Mode', () => {
    it('should allow switching to history mode', () => {
      setHashRoutingEnabled(false)
      expect(getHashRoutingEnabled()).toBe(false)
    })

    it('should support base path configuration', () => {
      setBasePath('/app')
      expect(getBasePath()).toBe('/app')
    })

    it('should default to "/" base path', () => {
      expect(getBasePath()).toBe('/')
    })

    it('should normalize base path with trailing slash', () => {
      setBasePath('/app/')
      expect(getBasePath()).toBe('/app')
    })

    it('should normalize base path without leading slash', () => {
      setBasePath('app')
      expect(getBasePath()).toBe('/app')
    })
  })

  describe('Mode Switching', () => {
    it('should allow switching between modes', () => {
      setHashRoutingEnabled(true)
      expect(getHashRoutingEnabled()).toBe(true)

      setHashRoutingEnabled(false)
      expect(getHashRoutingEnabled()).toBe(false)

      setHashRoutingEnabled(true)
      expect(getHashRoutingEnabled()).toBe(true)
    })

    it('should preserve base path when switching modes', () => {
      setBasePath('/app')
      setHashRoutingEnabled(false)

      expect(getBasePath()).toBe('/app')

      setHashRoutingEnabled(true)
      expect(getBasePath()).toBe('/app')
    })
  })
})
