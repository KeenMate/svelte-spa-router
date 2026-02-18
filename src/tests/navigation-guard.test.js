import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  NavigationCancelledError,
  registerBeforeLeave,
  unregisterBeforeLeave,
  clearBeforeLeaveHandlers,
  getBeforeLeaveHandlers,
  runBeforeLeaveGuards,
  createDirtyCheckGuard
} from '../lib/helpers/navigation-guard.svelte.js'

describe('Navigation Guards', () => {
  beforeEach(() => {
    clearBeforeLeaveHandlers()
  })

  describe('NavigationCancelledError', () => {
    it('should be an instance of Error', () => {
      const err = new NavigationCancelledError()
      expect(err).toBeInstanceOf(Error)
    })

    it('should have correct name', () => {
      const err = new NavigationCancelledError()
      expect(err.name).toBe('NavigationCancelledError')
    })

    it('should have default message', () => {
      const err = new NavigationCancelledError()
      expect(err.message).toBe('Navigation cancelled by user')
    })

    it('should accept custom message', () => {
      const err = new NavigationCancelledError('Custom reason')
      expect(err.message).toBe('Custom reason')
    })
  })

  describe('registerBeforeLeave', () => {
    it('should register a handler', () => {
      const handler = vi.fn()
      registerBeforeLeave(handler)

      expect(getBeforeLeaveHandlers()).toHaveLength(1)
      expect(getBeforeLeaveHandlers()[0]).toBe(handler)
    })

    it('should throw for non-function handler', () => {
      expect(() => registerBeforeLeave('not a function')).toThrow('handler must be a function')
      expect(() => registerBeforeLeave(null)).toThrow('handler must be a function')
    })

    it('should not register duplicates', () => {
      const handler = vi.fn()
      registerBeforeLeave(handler)
      registerBeforeLeave(handler)

      expect(getBeforeLeaveHandlers()).toHaveLength(1)
    })

    it('should register multiple different handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      registerBeforeLeave(handler1)
      registerBeforeLeave(handler2)

      expect(getBeforeLeaveHandlers()).toHaveLength(2)
    })
  })

  describe('unregisterBeforeLeave', () => {
    it('should remove a registered handler', () => {
      const handler = vi.fn()
      registerBeforeLeave(handler)
      expect(getBeforeLeaveHandlers()).toHaveLength(1)

      unregisterBeforeLeave(handler)
      expect(getBeforeLeaveHandlers()).toHaveLength(0)
    })

    it('should not throw for unregistered handler', () => {
      const handler = vi.fn()
      // Should not throw
      unregisterBeforeLeave(handler)
      expect(getBeforeLeaveHandlers()).toHaveLength(0)
    })
  })

  describe('clearBeforeLeaveHandlers', () => {
    it('should clear all handlers', () => {
      registerBeforeLeave(vi.fn())
      registerBeforeLeave(vi.fn())
      expect(getBeforeLeaveHandlers()).toHaveLength(2)

      clearBeforeLeaveHandlers()
      expect(getBeforeLeaveHandlers()).toHaveLength(0)
    })
  })

  describe('runBeforeLeaveGuards', () => {
    it('should return true when no handlers registered', async () => {
      const result = await runBeforeLeaveGuards({ from: '/', to: '/about' })
      expect(result).toBe(true)
    })

    it('should return true when all handlers pass', async () => {
      registerBeforeLeave(async () => { /* no throw = pass */ })
      registerBeforeLeave(async () => { /* pass */ })

      const result = await runBeforeLeaveGuards({ from: '/', to: '/about' })
      expect(result).toBe(true)
    })

    it('should return false when handler throws NavigationCancelledError', async () => {
      registerBeforeLeave(async () => {
        throw new NavigationCancelledError()
      })

      const result = await runBeforeLeaveGuards({ from: '/', to: '/about' })
      expect(result).toBe(false)
    })

    it('should re-throw non-cancellation errors', async () => {
      registerBeforeLeave(async () => {
        throw new Error('Unexpected error')
      })

      await expect(
        runBeforeLeaveGuards({ from: '/', to: '/about' })
      ).rejects.toThrow('Unexpected error')
    })

    it('should pass context to handlers', async () => {
      const handler = vi.fn()
      registerBeforeLeave(handler)

      const ctx = { from: '/page1', to: '/page2', params: { id: '1' } }
      await runBeforeLeaveGuards(ctx)

      expect(handler).toHaveBeenCalledWith(ctx)
    })

    it('should run handlers sequentially and stop on cancellation', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn(async () => {
        throw new NavigationCancelledError()
      })
      const handler3 = vi.fn()

      registerBeforeLeave(handler1)
      registerBeforeLeave(handler2)
      registerBeforeLeave(handler3)

      const result = await runBeforeLeaveGuards({ from: '/', to: '/about' })

      expect(result).toBe(false)
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(handler3).not.toHaveBeenCalled() // stopped at handler2
    })
  })

  describe('createDirtyCheckGuard', () => {
    it('should return a function', () => {
      const guard = createDirtyCheckGuard(() => false)
      expect(typeof guard).toBe('function')
    })

    it('should not throw when not dirty', async () => {
      const guard = createDirtyCheckGuard(() => false)
      // Should resolve without error
      await guard()
    })

    it('should throw NavigationCancelledError when dirty and user declines', async () => {
      // Mock window.confirm to return false (user clicks "Cancel")
      vi.spyOn(window, 'confirm').mockReturnValue(false)

      const guard = createDirtyCheckGuard(() => true)

      await expect(guard()).rejects.toThrow(NavigationCancelledError)

      vi.restoreAllMocks()
    })

    it('should not throw when dirty but user confirms', async () => {
      // Mock window.confirm to return true (user clicks "OK")
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      const guard = createDirtyCheckGuard(() => true)

      // Should resolve without error
      await guard()

      vi.restoreAllMocks()
    })

    it('should use custom message in confirm dialog', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      const guard = createDirtyCheckGuard(() => true, 'Custom warning!')
      await guard()

      expect(confirmSpy).toHaveBeenCalledWith('Custom warning!')

      vi.restoreAllMocks()
    })
  })
})
