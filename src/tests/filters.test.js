import { describe, it, expect, beforeEach } from 'vitest'
import { push } from '../lib/utils.svelte.js'
import {
  configureFilters,
  getFiltersConfig,
  filters,
  updateFilters
} from '../lib/helpers/filters.svelte.js'

describe('Filters', () => {
  beforeEach(() => {
    // Reset to defaults
    configureFilters({
      mode: 'flat',
      paramName: '$filter',
      parse: null,
      stringify: null
    })
    // Reset URL
    window.location.hash = '#/'
  })

  describe('configureFilters', () => {
    it('should have flat mode by default', () => {
      const config = getFiltersConfig()
      expect(config.mode).toBe('flat')
      expect(config.paramName).toBe('$filter')
      expect(config.parse).toBeNull()
      expect(config.stringify).toBeNull()
    })

    it('should merge options', () => {
      configureFilters({ mode: 'structured', paramName: '$f' })

      const config = getFiltersConfig()
      expect(config.mode).toBe('structured')
      expect(config.paramName).toBe('$f')
    })

    it('should accept custom parse and stringify functions', () => {
      const parse = (s) => ({ raw: s })
      const stringify = (o) => JSON.stringify(o)

      configureFilters({ parse, stringify })

      const config = getFiltersConfig()
      expect(config.parse).toBe(parse)
      expect(config.stringify).toBe(stringify)
    })
  })

  describe('filters() - flat mode', () => {
    it('should return empty object when no querystring', () => {
      expect(filters()).toEqual({})
    })

    it('should parse flat querystring parameters', async () => {
      push('/page?search=java&categoryId=123')
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.search).toBe('java')
      expect(f.categoryId).toBe('123')
    })

    it('should handle encoded values', async () => {
      push('/page?q=hello%20world&tag=c%2B%2B')
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.q).toBe('hello world')
      expect(f.tag).toBe('c++')
    })
  })

  describe('filters() - structured mode', () => {
    beforeEach(() => {
      configureFilters({ mode: 'structured' })
    })

    it('should return empty object when no filter param', async () => {
      push('/page?other=value')
      await new Promise(r => setTimeout(r, 50))

      expect(filters()).toEqual({})
    })

    it('should parse default structured filter syntax', async () => {
      const filterStr = encodeURIComponent("name eq 'john' AND status eq 'active'")
      push(`/page?$filter=${filterStr}`)
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.name).toBe('john')
      expect(f.status).toBe('active')
    })

    it('should use custom parse function when provided', async () => {
      configureFilters({
        mode: 'structured',
        parse: (str) => {
          // Simple custom parser: comma-separated key=value
          const result = {}
          str.split(',').forEach(pair => {
            const [k, v] = pair.split('=')
            result[k.trim()] = v.trim()
          })
          return result
        }
      })

      const filterStr = encodeURIComponent('name=john,age=30')
      push(`/page?$filter=${filterStr}`)
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.name).toBe('john')
      expect(f.age).toBe('30')
    })

    it('should handle custom paramName', async () => {
      configureFilters({ mode: 'structured', paramName: 'filter' })

      const filterStr = encodeURIComponent("role eq 'admin'")
      push(`/page?filter=${filterStr}`)
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.role).toBe('admin')
    })

    it('should return empty object if custom parse throws', async () => {
      configureFilters({
        mode: 'structured',
        parse: () => { throw new Error('parse error') }
      })

      push('/page?$filter=anything')
      await new Promise(r => setTimeout(r, 50))

      expect(filters()).toEqual({})
    })
  })

  describe('updateFilters', () => {
    it('should navigate with new filter params in flat mode', async () => {
      await updateFilters({ search: 'java', status: 'active' })
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.search).toBe('java')
      expect(f.status).toBe('active')
    })

    it('should merge with existing filters by default', async () => {
      push('/page?existing=value')
      await new Promise(r => setTimeout(r, 50))

      await updateFilters({ newFilter: 'added' })
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.existing).toBe('value')
      expect(f.newFilter).toBe('added')
    })

    it('should replace all filters when merge=false', async () => {
      push('/page?old=value')
      await new Promise(r => setTimeout(r, 50))

      await updateFilters({ new: 'only' }, { merge: false })
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.new).toBe('only')
      expect(f.old).toBeUndefined()
    })

    it('should remove filter when value is undefined', async () => {
      push('/page?a=1&b=2')
      await new Promise(r => setTimeout(r, 50))

      await updateFilters({ a: undefined })
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      expect(f.a).toBeUndefined()
      expect(f.b).toBe('2')
    })

    it('should keep filter with empty string when value is null', async () => {
      push('/page?search=test')
      await new Promise(r => setTimeout(r, 50))

      await updateFilters({ search: null })
      await new Promise(r => setTimeout(r, 50))

      const f = filters()
      // null becomes empty string, but key is preserved
      expect('search' in f).toBe(true)
    })
  })

  describe('updateFilters - structured mode with custom stringify', () => {
    beforeEach(() => {
      configureFilters({
        mode: 'structured',
        paramName: '$filter',
        parse: (str) => {
          // Parse "key:value,key:value"
          const result = {}
          str.split(',').forEach(pair => {
            const [k, v] = pair.split(':')
            if (k && v) result[k.trim()] = v.trim()
          })
          return result
        },
        stringify: (obj) => {
          // Stringify to "key:value,key:value"
          return Object.entries(obj)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}:${v}`)
            .join(',')
        }
      })
    })

    it('should use custom stringify in structured mode', async () => {
      await updateFilters({ name: 'john', status: 'active' })
      await new Promise(r => setTimeout(r, 50))

      // The $filter param gets URL-encoded (%24filter) in hash mode
      const hash = decodeURIComponent(window.location.hash)
      expect(hash).toContain('$filter=')

      // Round-trip: parse it back using our custom parse
      const f = filters()
      expect(f.name).toBe('john')
      expect(f.status).toBe('active')
    })

    it('should use default OData stringify when no custom stringify', async () => {
      configureFilters({
        mode: 'structured',
        parse: null,
        stringify: null
      })

      await updateFilters({ role: 'admin' })
      await new Promise(r => setTimeout(r, 50))

      // Round-trip: parse back with default parser
      const f = filters()
      expect(f.role).toBe('admin')
    })
  })
})
