import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import Router from '../lib/Router.svelte'
import { push, location } from '../lib/utils.svelte.js'

// Simple test components
const Home = `
<script>
  export let params = {}
</script>
<div>Home Page</div>
`

const About = `
<script>
  export let params = {}
</script>
<div>About Page</div>
`

const User = `
<script>
  export let params = {}
</script>
<div>User: {params.id || 'unknown'}</div>
`

const NotFound = `
<script>
  export let params = {}
</script>
<div>404 Not Found</div>
`

describe('Router Component', () => {
  beforeEach(() => {
    // Reset location to root
    window.location.hash = '#/'
  })

  it('should render the home route by default', async () => {
    const routes = {
      '/': Home,
      '/about': About,
      '*': NotFound
    }

    render(Router, { routes })

    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })

  it('should render about page when navigating to /about', async () => {
    const routes = {
      '/': Home,
      '/about': About,
      '*': NotFound
    }

    render(Router, { routes })

    push('/about')

    // Wait for route to update
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(screen.getByText('About Page')).toBeInTheDocument()
  })

  it('should extract route parameters', async () => {
    const routes = {
      '/': Home,
      '/user/:id': User,
      '*': NotFound
    }

    render(Router, { routes })

    push('/user/123')

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(screen.getByText('User: 123')).toBeInTheDocument()
  })

  it('should render 404 for unknown routes', async () => {
    const routes = {
      '/': Home,
      '/about': About,
      '*': NotFound
    }

    render(Router, { routes })

    push('/unknown')

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(screen.getByText('404 Not Found')).toBeInTheDocument()
  })

  it('should handle route events', async () => {
    const routes = {
      '/': Home,
      '/about': About
    }

    const onrouteLoaded = vi.fn()
    const onrouteLoading = vi.fn()

    render(Router, {
      routes,
      onrouteLoaded: (e) => onrouteLoaded(e.detail),
      onrouteLoading: (e) => onrouteLoading(e.detail)
    })

    push('/about')

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(onrouteLoading).toHaveBeenCalled()
    expect(onrouteLoaded).toHaveBeenCalled()

    const loadedEvent = onrouteLoaded.mock.calls[0][0]
    expect(loadedEvent.location).toBe('/about')
  })

  it('should support optional route parameters', async () => {
    const UserProfile = `
    <script>
      export let params = {}
    </script>
    <div>User: {params.name || 'Guest'} {params.surname || ''}</div>
    `

    const routes = {
      '/': Home,
      '/user/:name/:surname?': UserProfile,
      '*': NotFound
    }

    render(Router, { routes })

    // With surname
    push('/user/John/Doe')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(screen.getByText(/User: John Doe/)).toBeInTheDocument()

    // Without surname
    push('/user/Jane')
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(screen.getByText(/User: Jane/)).toBeInTheDocument()
  })

  it('should support wildcard routes', async () => {
    const Wildcard = `
    <script>
      export let params = {}
    </script>
    <div>Wildcard: {params.wild || 'none'}</div>
    `

    const routes = {
      '/': Home,
      '/files/*': Wildcard,
      '*': NotFound
    }

    render(Router, { routes })

    push('/files/documents/report.pdf')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(screen.getByText(/Wildcard: documents\/report\.pdf/)).toBeInTheDocument()
  })

  it('should work with route prefix', async () => {
    const routes = {
      '/': Home,
      '/about': About
    }

    render(Router, {
      routes,
      prefix: '/app'
    })

    push('/app/about')
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(screen.getByText('About Page')).toBeInTheDocument()
  })
})
