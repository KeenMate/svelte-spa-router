import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import ActiveTest from './components/ActiveTest.svelte'

describe('active action', () => {
  beforeEach(() => {
    window.location.hash = '#/home'
  })

  it('should remove active class from non-matching routes', async () => {
    render(ActiveTest)

    const aboutLink = screen.getByTestId('about-link')

    expect(aboutLink.classList.contains('active')).toBe(false)
  })

  describe('subtree option', () => {
    it('applies active on the exact href', () => {
      window.location.hash = '#/docs'
      render(ActiveTest)
      expect(screen.getByTestId('subtree-link').classList.contains('active')).toBe(true)
    })

    it('applies active on a descendant URL', () => {
      window.location.hash = '#/docs/guide'
      render(ActiveTest)
      expect(screen.getByTestId('subtree-link').classList.contains('active')).toBe(true)
    })

    it('does NOT apply active on an unrelated URL', () => {
      window.location.hash = '#/about'
      render(ActiveTest)
      expect(screen.getByTestId('subtree-link').classList.contains('active')).toBe(false)
    })

    it('with subtreeClassName: exact match uses className', () => {
      window.location.hash = '#/admin'
      render(ActiveTest)
      const el = screen.getByTestId('subtree-two-class-link')
      expect(el.classList.contains('link-active')).toBe(true)
      expect(el.classList.contains('sublink-active')).toBe(false)
    })

    it('with subtreeClassName: descendant uses subtreeClassName', () => {
      window.location.hash = '#/admin/users'
      render(ActiveTest)
      const el = screen.getByTestId('subtree-two-class-link')
      expect(el.classList.contains('link-active')).toBe(false)
      expect(el.classList.contains('sublink-active')).toBe(true)
    })
  })
})
