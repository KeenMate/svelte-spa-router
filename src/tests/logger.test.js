import { describe, it, expect, beforeEach, vi } from 'vitest'
import log, {
  enableLogging,
  disableLogging,
  setLogLevel,
  setCategoryLevel,
  logStructured,
  routerLogger,
  navigationLogger,
  scrollLogger,
  guardsLogger,
  conditionsLogger,
  hierarchyLogger,
  permissionsLogger,
  routesLogger,
  zonesLogger,
  metadataLogger,
  errorHandlerLogger,
  filtersLogger
} from '../lib/logger.ts'

describe('Logger', () => {
  beforeEach(() => {
    // Reset to silent after each test
    disableLogging()
  })

  describe('category loggers', () => {
    it('should export all 12 category loggers', () => {
      const loggers = [
        routerLogger,
        navigationLogger,
        scrollLogger,
        guardsLogger,
        conditionsLogger,
        hierarchyLogger,
        permissionsLogger,
        routesLogger,
        zonesLogger,
        metadataLogger,
        errorHandlerLogger,
        filtersLogger
      ]

      expect(loggers).toHaveLength(12)
      loggers.forEach(logger => {
        expect(logger).toBeDefined()
        expect(typeof logger.debug).toBe('function')
        expect(typeof logger.info).toBe('function')
        expect(typeof logger.warn).toBe('function')
        expect(typeof logger.error).toBe('function')
      })
    })

    it('should export default root logger', () => {
      expect(log).toBeDefined()
      expect(typeof log.setLevel).toBe('function')
      expect(typeof log.getLevel).toBe('function')
    })
  })

  describe('enableLogging', () => {
    it('should set all loggers to debug level', () => {
      enableLogging()

      // loglevel levels: TRACE=0, DEBUG=1, INFO=2, WARN=3, ERROR=4, SILENT=5
      expect(routerLogger.getLevel()).toBe(1) // debug
      expect(navigationLogger.getLevel()).toBe(1)
      expect(scrollLogger.getLevel()).toBe(1)
    })
  })

  describe('disableLogging', () => {
    it('should set all loggers to silent level', () => {
      enableLogging()
      disableLogging()

      expect(routerLogger.getLevel()).toBe(5) // silent
      expect(navigationLogger.getLevel()).toBe(5)
      expect(filtersLogger.getLevel()).toBe(5)
    })
  })

  describe('setLogLevel', () => {
    it('should set all loggers to specified level', () => {
      setLogLevel('warn')

      // WARN = 3
      expect(routerLogger.getLevel()).toBe(3)
      expect(navigationLogger.getLevel()).toBe(3)
      expect(errorHandlerLogger.getLevel()).toBe(3)
    })

    it('should accept all valid levels', () => {
      setLogLevel('trace')
      expect(routerLogger.getLevel()).toBe(0)

      setLogLevel('debug')
      expect(routerLogger.getLevel()).toBe(1)

      setLogLevel('info')
      expect(routerLogger.getLevel()).toBe(2)

      setLogLevel('warn')
      expect(routerLogger.getLevel()).toBe(3)

      setLogLevel('error')
      expect(routerLogger.getLevel()).toBe(4)

      setLogLevel('silent')
      expect(routerLogger.getLevel()).toBe(5)
    })
  })

  describe('setCategoryLevel', () => {
    it('should set level for a single category', () => {
      disableLogging()
      setCategoryLevel('ROUTER:SCROLL', 'debug')

      expect(scrollLogger.getLevel()).toBe(1) // debug
      // Others should remain silent
      expect(routerLogger.getLevel()).toBe(5)
      expect(navigationLogger.getLevel()).toBe(5)
    })

    it('should set different levels for different categories', () => {
      disableLogging()
      setCategoryLevel('ROUTER:NAVIGATION', 'info')
      setCategoryLevel('ROUTER:PERMISSIONS', 'warn')
      setCategoryLevel('ROUTER:ERROR_HANDLER', 'debug')

      expect(navigationLogger.getLevel()).toBe(2) // info
      expect(permissionsLogger.getLevel()).toBe(3) // warn
      expect(errorHandlerLogger.getLevel()).toBe(1) // debug
    })

    it('should default to debug level when no level specified', () => {
      disableLogging()
      setCategoryLevel('ROUTER:FILTERS')

      expect(filtersLogger.getLevel()).toBe(1) // debug
    })

    it('should work for all categories', () => {
      const categories = [
        ['ROUTER', routerLogger],
        ['ROUTER:NAVIGATION', navigationLogger],
        ['ROUTER:SCROLL', scrollLogger],
        ['ROUTER:GUARDS', guardsLogger],
        ['ROUTER:CONDITIONS', conditionsLogger],
        ['ROUTER:HIERARCHY', hierarchyLogger],
        ['ROUTER:PERMISSIONS', permissionsLogger],
        ['ROUTER:ROUTES', routesLogger],
        ['ROUTER:ZONES', zonesLogger],
        ['ROUTER:METADATA', metadataLogger],
        ['ROUTER:ERROR_HANDLER', errorHandlerLogger],
        ['ROUTER:FILTERS', filtersLogger]
      ]

      categories.forEach(([category, logger]) => {
        disableLogging()
        setCategoryLevel(category, 'info')
        expect(logger.getLevel()).toBe(2)
      })
    })
  })

  describe('logStructured', () => {
    it('should call logger with message and data', () => {
      enableLogging()
      const spy = vi.spyOn(routerLogger, 'debug')

      logStructured(routerLogger, 'debug', 'Test message', { key: 'value' })

      expect(spy).toHaveBeenCalledWith('Test message', { key: 'value' })
      spy.mockRestore()
    })

    it('should call logger with just message when no data', () => {
      enableLogging()
      const spy = vi.spyOn(routerLogger, 'info')

      logStructured(routerLogger, 'info', 'Just a message')

      expect(spy).toHaveBeenCalledWith('Just a message')
      spy.mockRestore()
    })

    it('should work with different log levels', () => {
      enableLogging()
      const warnSpy = vi.spyOn(navigationLogger, 'warn')
      const errorSpy = vi.spyOn(navigationLogger, 'error')

      logStructured(navigationLogger, 'warn', 'Warning!', { code: 42 })
      logStructured(navigationLogger, 'error', 'Error!', { fatal: true })

      expect(warnSpy).toHaveBeenCalledWith('Warning!', { code: 42 })
      expect(errorSpy).toHaveBeenCalledWith('Error!', { fatal: true })

      warnSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })
})
