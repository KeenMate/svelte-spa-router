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
})
