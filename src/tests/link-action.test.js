import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import { location } from '../lib/utils.svelte.js'

const LinkTest = `
<script>
  import { link } from '../lib/utils.svelte.js'
</script>

<a href="/test" use:link data-testid="basic-link">Basic Link</a>
<a href="/external" target="_blank" use:link data-testid="external-link">External</a>
<a href="https://example.com" use:link data-testid="absolute-link">Absolute</a>
`

describe('link action', () => {
  beforeEach(() => {
    window.location.hash = '#/'
  })

  it('should intercept clicks on internal links', async () => {
    render(LinkTest)

    const link = screen.getByTestId('basic-link')
    await fireEvent.click(link)

    expect(window.location.hash).toBe('#/test')
  })

  it('should not intercept clicks with target="_blank"', async () => {
    render(LinkTest)

    const link = screen.getByTestId('external-link')

    // Mock window.open to prevent actual navigation
    const originalOpen = window.open
    window.open = () => null

    await fireEvent.click(link)

    // Should not change hash
    expect(window.location.hash).toBe('#/')

    window.open = originalOpen
  })

  it('should not intercept clicks on absolute URLs', async () => {
    render(LinkTest)

    const link = screen.getByTestId('absolute-link')

    // Prevent default to avoid navigation in tests
    link.addEventListener('click', (e) => {
      e.preventDefault()
    })

    await fireEvent.click(link)

    // Should not change hash
    expect(window.location.hash).toBe('#/')
  })

  it('should respect Ctrl/Cmd + Click', async () => {
    render(LinkTest)

    const link = screen.getByTestId('basic-link')

    await fireEvent.click(link, { ctrlKey: true })

    // Should not intercept
    expect(window.location.hash).toBe('#/')
  })

  it('should respect middle mouse button click', async () => {
    render(LinkTest)

    const link = screen.getByTestId('basic-link')

    await fireEvent.click(link, { button: 1 })

    // Should not intercept
    expect(window.location.hash).toBe('#/')
  })
})
