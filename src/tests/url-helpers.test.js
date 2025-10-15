import { describe, it, expect } from 'vitest'
import { joinPaths } from '../lib/helpers/url-helpers.svelte.js'

describe('URL Helpers', () => {
  describe('joinPaths', () => {
    it('should join simple paths', () => {
      expect(joinPaths('/api', 'users')).toBe('/api/users')
    })

    it('should handle leading slashes', () => {
      expect(joinPaths('/api', '/users')).toBe('/api/users')
    })

    it('should handle trailing slashes', () => {
      expect(joinPaths('/api/', 'users')).toBe('/api/users')
    })

    it('should handle both leading and trailing slashes', () => {
      expect(joinPaths('/api/', '/users')).toBe('/api/users')
    })

    it('should handle multiple segments', () => {
      expect(joinPaths('/api', 'v1', 'users', '123')).toBe('/api/v1/users/123')
    })

    it('should handle empty strings', () => {
      expect(joinPaths('/api', '', 'users')).toBe('/api/users')
    })

    it('should handle root path', () => {
      expect(joinPaths('/', 'users')).toBe('/users')
    })

    it('should handle single segment', () => {
      expect(joinPaths('/api')).toBe('/api')
    })

    it('should handle no segments', () => {
      expect(joinPaths()).toBe('/')
    })

    it('should preserve query strings', () => {
      expect(joinPaths('/api', 'users?page=1')).toBe('/api/users?page=1')
    })

    it('should preserve hash fragments', () => {
      expect(joinPaths('/api', 'users#section')).toBe('/api/users#section')
    })

    it('should handle complex real-world paths', () => {
      expect(joinPaths('/app/', '/admin/', '/users/', '123/', '/edit'))
        .toBe('/app/admin/users/123/edit')
    })

    it('should handle paths with dots', () => {
      expect(joinPaths('/files', '../parent', './current'))
        .toBe('/files/../parent/./current')
    })

    it('should not normalize .. or . segments', () => {
      // joinPaths is a simple concatenation helper, not a full path normalizer
      expect(joinPaths('/api', '..', 'users')).toBe('/api/../users')
    })
  })
})
