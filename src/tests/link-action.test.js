import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { link, setHashRoutingEnabled, setBasePath, location } from '../lib/utils.svelte.js'

// Regression coverage for the `use:link` action reading the link's href.
//
// The core bug: in history mode the click handler captured the href in a
// closure at mount time. When a data grid reuses <a> DOM nodes across renders,
// Svelte updates the `href="/x/{item.id}"` attribute reactively but does NOT
// re-run the action (it has no reactive parameter), so clicks navigated to the
// stale, previously-rendered target even though the visible href was correct.
describe('link action', () => {
	let node
	let clickEvent

	function makeAnchor(href) {
		const a = document.createElement('a')
		a.setAttribute('href', href)
		document.body.appendChild(a)
		return a
	}

	function click(target) {
		const event = new MouseEvent('click', { bubbles: true, cancelable: true })
		target.dispatchEvent(event)
		return event
	}

	beforeEach(() => {
		setBasePath('/')
	})

	afterEach(() => {
		if (node && node.parentNode) node.parentNode.removeChild(node)
		node = null
		setHashRoutingEnabled(true)
		setBasePath('/')
	})

	describe('history mode', () => {
		beforeEach(() => setHashRoutingEnabled(false))

		it('navigates to the live href, not the one captured at mount', async () => {
			node = makeAnchor('/forms/20000')
			const action = link(node)

			// Simulate a reactive attribute change on a reused DOM node WITHOUT
			// re-running the action (mirrors Svelte updating href="/forms/{id}").
			node.setAttribute('href', '/forms/20002')

			clickEvent = click(node)
			await new Promise(r => setTimeout(r, 20))

			expect(clickEvent.defaultPrevented).toBe(true)
			expect(location()).toBe('/forms/20002')

			action.destroy?.()
		})

		it('respects basePath when reading the live href', async () => {
			setBasePath('/app')
			node = makeAnchor('/forms/1')
			const action = link(node)

			// updateLink prepends basePath for display
			expect(node.getAttribute('href')).toBe('/app/forms/1')

			node.setAttribute('href', '/app/forms/42')
			click(node)
			await new Promise(r => setTimeout(r, 20))

			expect(location()).toBe('/forms/42')

			action.destroy?.()
		})

		it('does not intercept modified clicks', () => {
			node = makeAnchor('/forms/7')
			const action = link(node)

			const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })
			node.dispatchEvent(event)

			expect(event.defaultPrevented).toBe(false)

			action.destroy?.()
		})

		it('removes its click handler on destroy', async () => {
			node = makeAnchor('/forms/100')
			const action = link(node)
			action.destroy()

			node.setAttribute('href', '/forms/200')
			const before = location()
			const event = click(node)
			await new Promise(r => setTimeout(r, 20))

			expect(event.defaultPrevented).toBe(false)
			expect(location()).toBe(before)
		})
	})

	describe('hash mode', () => {
		beforeEach(() => setHashRoutingEnabled(true))

		it('navigates to the live href, not the one captured at mount', async () => {
			node = makeAnchor('/forms/20000')
			const action = link(node)

			expect(node.getAttribute('href')).toBe('#/forms/20000')

			node.setAttribute('href', '#/forms/20002')
			click(node)
			await new Promise(r => setTimeout(r, 20))

			expect(window.location.hash).toBe('#/forms/20002')

			action.destroy?.()
		})
	})
})
