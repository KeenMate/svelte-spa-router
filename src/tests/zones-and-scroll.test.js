import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getZoneComponent,
  setZoneComponents,
  restoreScroll
} from '../lib/utils.svelte.js'

describe('Zone Components State', () => {
  beforeEach(() => {
    // Reset zone state
    setZoneComponents({})
  })

  describe('getZoneComponent', () => {
    it('should return null when zone not set', () => {
      expect(getZoneComponent('sidebar')).toBeNull()
    })

    it('should return component for set zone', () => {
      const comp = { name: 'Sidebar' }
      setZoneComponents({ sidebar: comp })

      expect(getZoneComponent('sidebar')).toEqual(comp)
    })

    it('should return null for unset zone after setting others', () => {
      setZoneComponents({ header: { name: 'Header' } })

      expect(getZoneComponent('footer')).toBeNull()
    })
  })

  describe('setZoneComponents', () => {
    it('should set multiple zone components', () => {
      const header = { name: 'Header' }
      const sidebar = { name: 'Sidebar' }

      setZoneComponents({ header, sidebar })

      expect(getZoneComponent('header')).toEqual(header)
      expect(getZoneComponent('sidebar')).toEqual(sidebar)
    })

    it('should replace all zones when called again', () => {
      setZoneComponents({ a: { name: 'A' }, b: { name: 'B' } })
      setZoneComponents({ c: { name: 'C' } })

      expect(getZoneComponent('a')).toBeNull()
      expect(getZoneComponent('b')).toBeNull()
      expect(getZoneComponent('c')).toEqual({ name: 'C' })
    })

    it('should handle null input as empty', () => {
      setZoneComponents({ test: { name: 'Test' } })
      setZoneComponents(null)

      expect(getZoneComponent('test')).toBeNull()
    })

    it('should not update when both current and new are empty', () => {
      // First call sets to empty (already empty from beforeEach)
      // This should be a no-op
      setZoneComponents({})

      expect(getZoneComponent('any')).toBeNull()
    })

    it('should detect when values change for same keys', () => {
      const comp1 = { name: 'V1' }
      const comp2 = { name: 'V2' }

      setZoneComponents({ slot: comp1 })
      expect(getZoneComponent('slot')).toEqual(comp1)

      setZoneComponents({ slot: comp2 })
      expect(getZoneComponent('slot')).toEqual(comp2)
    })
  })
})

describe('restoreScroll', () => {
  let scrollToSpy

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  it('should scroll to saved position when state provided', () => {
    restoreScroll({
      __svelte_spa_router_scrollX: 100,
      __svelte_spa_router_scrollY: 250
    })

    expect(scrollToSpy).toHaveBeenCalledWith(100, 250)
  })

  it('should scroll to top when no state provided', () => {
    restoreScroll(undefined)

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0)
  })

  it('should scroll to top when state is null', () => {
    restoreScroll(null)

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0)
  })

  it('should handle zero scroll positions', () => {
    restoreScroll({
      __svelte_spa_router_scrollX: 0,
      __svelte_spa_router_scrollY: 0
    })

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0)
  })
})
