/**
 * Router.test.js — RouteItem validator contract.
 *
 * Locks the validator's accept contract: bare function-valued route
 * components AND wrap()-ed objects both mount and render. If anyone
 * accidentally narrows the validator (or "simplifies" the named-locals
 * form back into a nested boolean that's vulnerable to the Svelte
 * compiler's paren-drop bug at the source level), these tests fail.
 *
 * IMPORTANT: vitest uses Vite's SSR/transform pipeline, which does NOT
 * apply the same dev-mode reactive helper wrapping that triggers the
 * compiler regression in real browser builds. So these tests CANNOT
 * catch the compiler-output mismatch that motivated v5.2.1 on their own
 * — for that, the example app's e2e suite (running against a real
 * vite-plugin-svelte transform with the consumer-floor dep versions)
 * is the safety net. See docs/pitfalls.md for the full story.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import Router from '../lib/Router.svelte'
import wrap from '../lib/wrap.js'
import { setHashRoutingEnabled } from '../lib/utils.svelte.js'
import Home from './components/Home.svelte'
import About from './components/About.svelte'

// Router's pipeline is async — `tick()` alone isn't enough; the existing
// routing-modes tests use a ~50ms wait for the same reason.
const flush = () => new Promise((resolve) => setTimeout(resolve, 50))

describe('Router component validator', () => {
    beforeEach(() => {
        setHashRoutingEnabled(true)
        window.location.hash = '#/'
    })

    it('accepts a bare-function route component and renders it', async () => {
        render(Router, { props: { routes: { '/': Home } } })
        await flush()
        expect(screen.getByText('Home Page')).toBeInTheDocument()
    })

    it("accepts a wrap()'d route and renders the wrapped component", async () => {
        render(Router, { props: { routes: { '/': wrap({ component: Home }) } } })
        await flush()
        expect(screen.getByText('Home Page')).toBeInTheDocument()
    })

    it('accepts a routes map mixing bare and wrap()-ed shapes', async () => {
        // The mixed-map case is what real consumer apps look like — some
        // routes use bare components, some use wrap() for code-splitting or
        // conditions. Both must pass the validator.
        const routes = {
            '/': Home,
            '/about': wrap({ component: About })
        }
        render(Router, { props: { routes } })
        await flush()
        expect(screen.getByText('Home Page')).toBeInTheDocument()
    })
})
