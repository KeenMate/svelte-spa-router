import { test, expect } from '@playwright/test'

/**
 * Global window API + debug logging — verifies the runtime introspection
 * surface exposed at `window.components['svelte-spa-router']`.
 *
 * No fixture page needed; any route works. Default to /test (index).
 */

const FIXTURE = '/test'

test.describe('window.components[svelte-spa-router]', () => {
    test('the namespace and version are exposed', async ({ page }) => {
        await page.goto(FIXTURE)

        const version = await page.evaluate(
            () => (window as unknown as { components: { 'svelte-spa-router': { version: () => string } } })
                .components['svelte-spa-router']
                .version()
        )
        expect(version).toMatch(/^\d+\.\d+\.\d+/)
    })

    test('config metadata is exposed', async ({ page }) => {
        await page.goto(FIXTURE)

        const config = await page.evaluate(
            () => (window as unknown as { components: { 'svelte-spa-router': { config: Record<string, string> } } })
                .components['svelte-spa-router']
                .config
        )
        expect(config.name).toBe('@keenmate/svelte-spa-router')
        expect(config.version).toMatch(/^\d+\.\d+\.\d+/)
        expect(config.license).toBe('MIT')
    })
})

test.describe('window.components[svelte-spa-router].logging', () => {
    test('getCategories returns the full hierarchical category list', async ({ page }) => {
        await page.goto(FIXTURE)

        const categories = await page.evaluate(
            () => (window as unknown as { components: { 'svelte-spa-router': { logging: { getCategories: () => string[] } } } })
                .components['svelte-spa-router']
                .logging
                .getCategories()
        )
        expect(categories).toContain('ROUTER')
        expect(categories).toContain('ROUTER:NAVIGATION')
        expect(categories).toContain('ROUTER:SCROLL')
        expect(categories).toContain('ROUTER:PERMISSIONS')
    })

    test('setLogLevel and disableLogging are callable without errors', async ({ page }) => {
        // We don't assert on console output (which is brittle) — just that the
        // API surface exists and the calls succeed.
        await page.goto(FIXTURE)

        const result = await page.evaluate(() => {
            try {
                const api = (window as unknown as {
                    components: {
                        'svelte-spa-router': {
                            logging: {
                                setLogLevel: (level: string) => void
                                disableLogging: () => void
                                enableLogging: () => void
                                setCategoryLevel: (cat: string, level: string) => void
                            }
                        }
                    }
                }).components['svelte-spa-router'].logging
                api.disableLogging()
                api.enableLogging()
                api.setLogLevel('warn')
                api.setCategoryLevel('ROUTER:NAVIGATION', 'debug')
                return 'ok'
            } catch (e) {
                return String(e)
            }
        })
        expect(result).toBe('ok')
    })
})
