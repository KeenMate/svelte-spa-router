import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { push, replace, location } from '../lib/utils.svelte.js'
import { registerRoutes, clearRoutes, defineRoutes, hasRoute } from '../lib/routes.svelte.js'

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

describe('defineRoutes', () => {
  // Mock components
  const HomeComponent = { name: 'Home' }
  const AboutComponent = { name: 'About' }
  const asyncUserComponent = () => Promise.resolve({ default: { name: 'User' } })
  const asyncContactsComponent = () => Promise.resolve({ default: { name: 'Contacts' } })
  const checkAuth = () => true

  beforeEach(() => {
    window.location.hash = '#/'
    window.history.replaceState(null, '', '#/')
    clearRoutes()
  })

  afterEach(() => {
    clearRoutes()
  })

  describe('route generation', () => {
    it('should generate routes object with correct path-to-component mapping', () => {
      const { routes } = defineRoutes({
        home: { path: '/', component: HomeComponent },
        about: { path: '/about', component: AboutComponent }
      })

      expect(routes['/']).toBe(HomeComponent)
      expect(routes['/about']).toBe(AboutComponent)
    })

    it('should use component directly for simple sync components (no wrap overhead)', () => {
      const { routes } = defineRoutes({
        home: { path: '/', component: HomeComponent }
      })

      // Simple sync component without options should NOT be wrapped
      expect(routes['/']).toBe(HomeComponent)
      expect(routes['/']._sveltesparouter).toBeUndefined()
    })

    it('should wrap async components', () => {
      const { routes } = defineRoutes({
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      // Async component should be wrapped
      expect(routes['/user/:id']._sveltesparouter).toBe(true)
    })

    it('should wrap sync components that have options', () => {
      const { routes } = defineRoutes({
        home: {
          path: '/',
          component: HomeComponent,
          conditions: [checkAuth]
        }
      })

      // Sync component with options should be wrapped
      expect(routes['/']._sveltesparouter).toBe(true)
    })
  })

  describe('named route registration', () => {
    it('should register all routes as named routes', () => {
      defineRoutes({
        home: { path: '/', component: HomeComponent },
        about: { path: '/about', component: AboutComponent },
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      expect(hasRoute('home')).toBe(true)
      expect(hasRoute('about')).toBe(true)
      expect(hasRoute('user')).toBe(true)
    })

    it('should not register non-existent route names', () => {
      defineRoutes({
        home: { path: '/', component: HomeComponent }
      })

      expect(hasRoute('nonexistent')).toBe(false)
    })
  })

  describe('nav helpers', () => {
    it('should provide push/replace/link/path for each route', () => {
      const { nav } = defineRoutes({
        home: { path: '/', component: HomeComponent },
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      expect(typeof nav.home.push).toBe('function')
      expect(typeof nav.home.replace).toBe('function')
      expect(typeof nav.home.link).toBe('function')
      expect(nav.home.path).toBe('/')

      expect(typeof nav.user.push).toBe('function')
      expect(typeof nav.user.replace).toBe('function')
      expect(typeof nav.user.link).toBe('function')
      expect(nav.user.path).toBe('/user/:id')
    })

    it('nav.X.push() should navigate to the named route', async () => {
      const { nav } = defineRoutes({
        about: { path: '/about', component: AboutComponent }
      })

      nav.about.push()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(location()).toBe('/about')
    })

    it('nav.X.push() should navigate with params', async () => {
      const { nav } = defineRoutes({
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      nav.user.push({ id: 42 })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(location()).toBe('/user/42')
    })

    it('nav.X.push() should navigate with params and query', async () => {
      const { nav } = defineRoutes({
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      nav.user.push({ id: 42 }, { tab: 'settings' })
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(window.location.hash).toContain('/user/42')
      expect(window.location.hash).toContain('tab=settings')
    })

    it('nav.X.replace() should replace current location', async () => {
      const { nav } = defineRoutes({
        about: { path: '/about', component: AboutComponent },
        home: { path: '/', component: HomeComponent }
      })

      nav.about.push()
      await new Promise(resolve => setTimeout(resolve, 50))

      const historyLength = window.history.length

      nav.home.replace()
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(location()).toBe('/')
      expect(window.history.length).toBe(historyLength)
    })

    it('nav.X.link() should return link action object', () => {
      const { nav } = defineRoutes({
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      const linkObj = nav.user.link({ id: 123 })

      expect(linkObj).toEqual({
        route: 'user',
        params: { id: 123 },
        query: undefined
      })
    })

    it('nav.X.link() should include query when provided', () => {
      const { nav } = defineRoutes({
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      const linkObj = nav.user.link({ id: 123 }, { tab: 'profile' })

      expect(linkObj).toEqual({
        route: 'user',
        params: { id: 123 },
        query: { tab: 'profile' }
      })
    })
  })

  describe('path builders', () => {
    it('should build URL for simple route', () => {
      const { paths } = defineRoutes({
        home: { path: '/', component: HomeComponent },
        about: { path: '/about', component: AboutComponent }
      })

      expect(paths.home()).toBe('/')
      expect(paths.about()).toBe('/about')
    })

    it('should build URL with params', () => {
      const { paths } = defineRoutes({
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      expect(paths.user({ id: 123 })).toBe('/user/123')
    })

    it('should build URL with params and query', () => {
      const { paths } = defineRoutes({
        user: { path: '/user/:id', component: asyncUserComponent }
      })

      const url = paths.user({ id: 456 }, { tab: 'settings' })
      expect(url).toBe('/user/456?tab=settings')
    })
  })

  describe('options forwarding', () => {
    it('should forward conditions to wrapped route', () => {
      const condition1 = () => true
      const condition2 = () => false

      const { routes } = defineRoutes({
        admin: {
          path: '/admin',
          component: asyncUserComponent,
          conditions: [condition1, condition2]
        }
      })

      const wrappedRoute = routes['/admin']
      expect(wrappedRoute._sveltesparouter).toBe(true)
      expect(wrappedRoute.conditions).toContain(condition1)
      expect(wrappedRoute.conditions).toContain(condition2)
    })

    it('should forward breadcrumbs via routeContext', () => {
      const breadcrumbs = [{ label: 'Home', path: '/' }, { label: 'Admin' }]

      const { routes } = defineRoutes({
        admin: {
          path: '/admin',
          component: asyncUserComponent,
          breadcrumbs
        }
      })

      const wrappedRoute = routes['/admin']
      expect(wrappedRoute._sveltesparouter).toBe(true)
      expect(wrappedRoute.routeContext.breadcrumbs).toEqual(breadcrumbs)
    })

    it('should forward static props', () => {
      const { routes } = defineRoutes({
        info: {
          path: '/info',
          component: HomeComponent,
          props: { version: '1.0' }
        }
      })

      const wrappedRoute = routes['/info']
      expect(wrappedRoute._sveltesparouter).toBe(true)
      expect(wrappedRoute.props).toEqual({ version: '1.0' })
    })
  })

  describe('multiple routes together', () => {
    it('should handle a full route definition set', () => {
      const { routes, nav, paths } = defineRoutes({
        home: { path: '/', component: HomeComponent },
        about: { path: '/about', component: AboutComponent },
        user: { path: '/user/:id', component: asyncUserComponent, conditions: [checkAuth] },
        contacts: { path: '/contacts', component: asyncContactsComponent }
      })

      // All routes should be generated
      expect(Object.keys(routes)).toHaveLength(4)
      expect(routes['/']).toBeDefined()
      expect(routes['/about']).toBeDefined()
      expect(routes['/user/:id']).toBeDefined()
      expect(routes['/contacts']).toBeDefined()

      // All nav helpers should be generated
      expect(nav.home).toBeDefined()
      expect(nav.about).toBeDefined()
      expect(nav.user).toBeDefined()
      expect(nav.contacts).toBeDefined()

      // All path builders should be generated
      expect(typeof paths.home).toBe('function')
      expect(typeof paths.about).toBe('function')
      expect(typeof paths.user).toBe('function')
      expect(typeof paths.contacts).toBe('function')

      // All named routes should be registered
      expect(hasRoute('home')).toBe(true)
      expect(hasRoute('about')).toBe(true)
      expect(hasRoute('user')).toBe(true)
      expect(hasRoute('contacts')).toBe(true)
    })
  })
})
