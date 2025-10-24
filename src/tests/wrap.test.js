import { describe, it, expect, vi } from 'vitest'
import wrap from '../lib/wrap.js'

describe('wrap function', () => {
  it('should wrap a component for dynamic import', () => {
    const asyncComponent = () => import('../lib/Router.svelte')

    const wrapped = wrap({
      asyncComponent
    })

    expect(wrapped).toHaveProperty('_sveltesparouter', true)
    expect(wrapped).toHaveProperty('component')
    expect(typeof wrapped.component).toBe('function')
  })

  it('should attach conditions to wrapped component', () => {
    const component = () => import('../lib/Router.svelte')
    const condition1 = vi.fn(() => true)
    const condition2 = vi.fn(() => true)

    const wrapped = wrap({
      asyncComponent: component,
      conditions: [condition1, condition2]
    })

    expect(wrapped.conditions).toHaveLength(2)
    expect(wrapped.conditions[0]).toBe(condition1)
    expect(wrapped.conditions[1]).toBe(condition2)
  })

  it('should attach props to wrapped component', () => {
    const component = () => import('../lib/Router.svelte')
    const props = { foo: 'bar', baz: 123 }

    const wrapped = wrap({
      asyncComponent: component,
      props
    })

    expect(wrapped.props).toEqual(props)
  })

  it('should attach routeContext to wrapped component', () => {
    const component = () => import('../lib/Router.svelte')
    const routeContext = { role: 'admin' }

    const wrapped = wrap({
      asyncComponent: component,
      routeContext
    })

    expect(wrapped.routeContext).toEqual(routeContext)
  })

  it('should support loading component', () => {
    const LoadingComponent = { name: 'Loading' }
    const component = () => import('../lib/Router.svelte')

    const wrapped = wrap({
      asyncComponent: component,
      loadingComponent: LoadingComponent
    })

    expect(wrapped.component).toHaveProperty('loading', LoadingComponent)
  })

  it('should throw error if asyncComponent is not provided', () => {
    expect(() => {
      wrap({})
    }).toThrow()
  })

  it('should support all options together', () => {
    const component = () => import('../lib/Router.svelte')
    const condition = vi.fn(() => true)
    const props = { foo: 'bar' }
    const routeContext = { role: 'admin' }
    const LoadingComponent = { name: 'Loading' }

    const wrapped = wrap({
      asyncComponent: component,
      conditions: [condition],
      props,
      routeContext,
      loadingComponent: LoadingComponent
    })

    expect(wrapped._sveltesparouter).toBe(true)
    expect(wrapped.conditions).toHaveLength(1)
    expect(wrapped.props).toEqual(props)
    expect(wrapped.routeContext).toEqual(routeContext)
    expect(wrapped.component.loading).toBe(LoadingComponent)
  })
})
