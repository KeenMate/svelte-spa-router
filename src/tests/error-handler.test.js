import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  configureGlobalErrorHandler,
  getConfig,
  getErrorState,
  setError,
  clearError,
  setActive,
  shouldIgnoreError,
  canRestart,
  getRestartCount,
  recordRestart,
  clearRestartHistory,
  getRestartHistory,
  createErrorInfo,
  createRecoveryHelpers,
  showError,
  restart
} from '../lib/helpers/error-handler.svelte.js'

describe('Error Handler', () => {
  beforeEach(() => {
    clearRestartHistory()
    clearError()
    setActive(false)
    // Reset config to defaults
    configureGlobalErrorHandler({
      onError: null,
      onRecover: null,
      maxRestarts: 3,
      restartWindow: 60000,
      strategy: 'navigateSafe',
      safeRoute: '/',
      showToast: true,
      showErrorComponent: false,
      autoRestart: false,
      restartDelay: 5000,
      ignoreErrors: [],
      isDevelopment: false
    })
  })

  describe('configureGlobalErrorHandler', () => {
    it('should merge options with defaults', () => {
      configureGlobalErrorHandler({ maxRestarts: 5, safeRoute: '/home' })

      const config = getConfig()
      expect(config.maxRestarts).toBe(5)
      expect(config.safeRoute).toBe('/home')
      // Defaults preserved
      expect(config.strategy).toBe('navigateSafe')
    })

    it('should allow setting all options', () => {
      const onError = vi.fn()
      configureGlobalErrorHandler({
        onError,
        strategy: 'restart',
        isDevelopment: true
      })

      const config = getConfig()
      expect(config.onError).toBe(onError)
      expect(config.strategy).toBe('restart')
      expect(config.isDevelopment).toBe(true)
    })
  })

  describe('error state', () => {
    it('should start with no error', () => {
      const state = getErrorState()
      expect(state.currentError).toBeNull()
      expect(state.errorInfo).toBeNull()
      expect(state.isActive).toBe(false)
    })

    it('setError should set current error and info', () => {
      const error = new Error('Test error')
      const info = { message: 'Test', timestamp: new Date().toISOString() }

      setError(error, info)

      const state = getErrorState()
      expect(state.currentError.message).toBe('Test error')
      expect(state.errorInfo).toEqual(info)
    })

    it('setError should accumulate session errors', () => {
      const countBefore = getErrorState().sessionErrors.length

      setError(new Error('Error 1'), { message: 'Error 1' })
      setError(new Error('Error 2'), { message: 'Error 2' })

      const state = getErrorState()
      expect(state.sessionErrors).toHaveLength(countBefore + 2)
    })

    it('clearError should clear current error', () => {
      setError(new Error('Test'), { message: 'Test' })
      clearError()

      const state = getErrorState()
      expect(state.currentError).toBeNull()
      expect(state.errorInfo).toBeNull()
    })

    it('setActive should set active state', () => {
      setActive(true)
      expect(getErrorState().isActive).toBe(true)

      setActive(false)
      expect(getErrorState().isActive).toBe(false)
    })
  })

  describe('shouldIgnoreError', () => {
    it('should return false when no ignore patterns configured', () => {
      expect(shouldIgnoreError(new Error('Any error'))).toBe(false)
    })

    it('should match string patterns', () => {
      configureGlobalErrorHandler({
        ignoreErrors: ['ResizeObserver', 'Script error']
      })

      expect(shouldIgnoreError(new Error('ResizeObserver loop limit exceeded'))).toBe(true)
      expect(shouldIgnoreError(new Error('Script error.'))).toBe(true)
      expect(shouldIgnoreError(new Error('Real error'))).toBe(false)
    })

    it('should match regex patterns', () => {
      configureGlobalErrorHandler({
        ignoreErrors: [/^Loading chunk \d+ failed/]
      })

      expect(shouldIgnoreError(new Error('Loading chunk 42 failed'))).toBe(true)
      expect(shouldIgnoreError(new Error('Something else'))).toBe(false)
    })

    it('should handle errors without message property', () => {
      configureGlobalErrorHandler({
        ignoreErrors: ['test']
      })

      // Non-Error object
      expect(shouldIgnoreError('test string error')).toBe(true)
    })
  })

  describe('restart history and loop prevention', () => {
    it('should start with empty restart history', () => {
      expect(getRestartHistory()).toEqual([])
      expect(getRestartCount()).toBe(0)
    })

    it('recordRestart should add to history', () => {
      recordRestart()
      expect(getRestartHistory()).toHaveLength(1)
      expect(getRestartCount()).toBe(1)
    })

    it('canRestart should return true when under limit', () => {
      expect(canRestart()).toBe(true)

      recordRestart()
      expect(canRestart()).toBe(true) // 1 < 3 (default maxRestarts)

      recordRestart()
      expect(canRestart()).toBe(true) // 2 < 3
    })

    it('canRestart should return false when at limit', () => {
      recordRestart()
      recordRestart()
      recordRestart()

      expect(canRestart()).toBe(false) // 3 >= 3
    })

    it('clearRestartHistory should reset history', () => {
      recordRestart()
      recordRestart()
      expect(getRestartCount()).toBe(2)

      clearRestartHistory()
      expect(getRestartCount()).toBe(0)
      expect(canRestart()).toBe(true)
    })

    it('restart should return false when too many restarts', () => {
      recordRestart()
      recordRestart()
      recordRestart()

      // Should prevent restart and return false
      const result = restart()
      expect(result).toBe(false)
    })
  })

  describe('createErrorInfo', () => {
    it('should create error info with message and stack', () => {
      const error = new Error('Test error')
      const info = createErrorInfo(error)

      expect(info.message).toBe('Test error')
      expect(info.stack).toBeDefined()
      expect(info.timestamp).toBeDefined()
      expect(info.type).toBe('error')
    })

    it('should accept custom error type', () => {
      const info = createErrorInfo(new Error('Warning'), 'warning')
      expect(info.type).toBe('warning')
    })

    it('should include restart count', () => {
      recordRestart()
      recordRestart()

      const info = createErrorInfo(new Error('Test'))
      expect(info.restartCount).toBe(2)
    })

    it('should handle non-Error objects', () => {
      const info = createErrorInfo('string error')
      expect(info.message).toBe('string error')
    })
  })

  describe('createRecoveryHelpers', () => {
    it('should return all helper functions', () => {
      const helpers = createRecoveryHelpers()

      expect(typeof helpers.restart).toBe('function')
      expect(typeof helpers.navigate).toBe('function')
      expect(typeof helpers.showError).toBe('function')
      expect(typeof helpers.canRestart).toBe('function')
      expect(typeof helpers.getRestartCount).toBe('function')
    })
  })

  describe('showError', () => {
    it('should set showErrorComponent to true in config', () => {
      expect(getConfig().showErrorComponent).toBe(false)

      showError()

      expect(getConfig().showErrorComponent).toBe(true)
    })
  })
})
