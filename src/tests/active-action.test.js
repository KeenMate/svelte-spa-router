import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import { push } from '../lib/utils.svelte.js'

const ActiveTest = `
<script>
  import active from '../lib/active.svelte.js'
</script>

<a href="/home" use:active data-testid="home-link">Home</a>
<a href="/about" use:active data-testid="about-link">About</a>
<a href="/contact" use:active={{className: 'current'}} data-testid="contact-link">Contact</a>
<a href="/users" use:active={{path: '/users/*'}} data-testid="users-link">Users</a>
`

describe('active action', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('should add active class to matching route', async () => {
    render(ActiveTest)

    const homeLink = screen.getByTestId('home-link')

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(homeLink.classList.contains('active')).toBe(true)
  })

  it('should remove active class from non-matching routes', async () => {
    render(ActiveTest)

    const aboutLink = screen.getByTestId('about-link')

    expect(aboutLink.classList.contains('active')).toBe(false)
  })

  it('should update active class when route changes', async () => {
    render(ActiveTest)

    const homeLink = screen.getByTestId('home-link')
    const aboutLink = screen.getByTestId('about-link')

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(homeLink.classList.contains('active')).toBe(true)
    expect(aboutLink.classList.contains('active')).toBe(false)

    // Navigate to about
    push('/about')
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(homeLink.classList.contains('active')).toBe(false)
    expect(aboutLink.classList.contains('active')).toBe(true)
  })

  it('should support custom className', async () => {
    render(ActiveTest)

    push('/contact')
    await new Promise(resolve => setTimeout(resolve, 100))

    const contactLink = screen.getByTestId('contact-link')

    expect(contactLink.classList.contains('current')).toBe(true)
    expect(contactLink.classList.contains('active')).toBe(false)
  })

  it('should support wildcard paths', async () => {
    render(ActiveTest)

    push('/users/123')
    await new Promise(resolve => setTimeout(resolve, 100))

    const usersLink = screen.getByTestId('users-link')

    expect(usersLink.classList.contains('active')).toBe(true)
  })
})
