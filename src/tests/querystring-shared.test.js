import { describe, it, expect, beforeEach } from 'vitest'
import { push } from '../lib/utils.svelte.js'
import { configureQuerystring, query } from '../lib/helpers/querystring.svelte.js'

describe('Shared Querystring State', () => {
  beforeEach(async () => {
    // Reset config
    configureQuerystring({ arrayFormat: 'auto', arrays: true })
    window.location.hash = '#/'
    await new Promise(r => setTimeout(r, 50))
  })

  describe('configureQuerystring', () => {
    it('should have default config', async () => {
      push('/page?a=1')
      await new Promise(r => setTimeout(r, 50))

      // Default config should parse basic params
      const q = query()
      expect(q.a).toBe('1')
    })

    it('should apply arrayFormat config', async () => {
      configureQuerystring({ arrayFormat: 'comma' })

      push('/page?tags=a,b,c')
      await new Promise(r => setTimeout(r, 50))

      const q = query()
      expect(q.tags).toEqual(['a', 'b', 'c'])
    })

    it('should respect arrays=false', async () => {
      configureQuerystring({ arrays: false })

      push('/page?tag=a&tag=b')
      await new Promise(r => setTimeout(r, 50))

      const q = query()
      // With arrays=false, repeated params should not be treated as arrays
      expect(typeof q.tag).toBe('string')
    })
  })

  describe('query()', () => {
    it('should return empty object when no querystring', () => {
      const q = query()
      expect(q).toEqual({})
    })

    it('should parse simple key-value pairs', async () => {
      push('/page?name=john&age=30')
      await new Promise(r => setTimeout(r, 50))

      const q = query()
      expect(q.name).toBe('john')
      expect(q.age).toBe('30')
    })

    it('should parse repeated params as arrays with default config', async () => {
      push('/page?color=red&color=blue')
      await new Promise(r => setTimeout(r, 50))

      const q = query()
      expect(q.color).toEqual(['red', 'blue'])
    })

    it('should update reactively on navigation', async () => {
      push('/page?step=1')
      await new Promise(r => setTimeout(r, 50))

      expect(query().step).toBe('1')

      push('/page?step=2')
      await new Promise(r => setTimeout(r, 50))

      expect(query().step).toBe('2')
    })
  })
})
