import { test, expect } from '@playwright/test'

/**
 * Multi-zone routing fixture — exercises wrap({ zones: { … } }) where a single
 * route definition contributes one component per zone, with three nested
 * Router instances (each with a different `zone` prop) rendering them.
 *
 * The MultiZoneTest fixture renders the nested Routers; visiting
 *   /test/zones/show/:id
 * causes each zone Router to mount its zone-specific component:
 *   zone="menu"  → ZoneMenu.svelte    (testid zone-menu-content)
 *   zone="main"  → ZoneMain.svelte    (testid zone-main-content)
 *   zone="aside" → ZoneAside.svelte   (testid zone-aside-content)
 *
 * Each zone component displays routeParams.id so we can confirm route params
 * propagate identically to every zone.
 */

test.describe('zone mounting', () => {
    test('all three zone components render for a multi-zone route', async ({ page }) => {
        await page.goto('/test/zones/show/42')

        await expect(page.getByTestId('zone-menu-heading')).toHaveText('Menu zone')
        await expect(page.getByTestId('zone-main-heading')).toHaveText('Main zone')
        await expect(page.getByTestId('zone-aside-heading')).toHaveText('Aside zone')
    })

    test('each zone is mounted inside its own outer container', async ({ page }) => {
        await page.goto('/test/zones/show/42')

        // zone-menu container only contains the menu zone's content.
        await expect(page.getByTestId('zone-menu').getByTestId('zone-menu-content')).toBeVisible()
        await expect(page.getByTestId('zone-menu').getByTestId('zone-main-content')).toHaveCount(0)
        await expect(page.getByTestId('zone-menu').getByTestId('zone-aside-content')).toHaveCount(0)

        // And likewise for main.
        await expect(page.getByTestId('zone-main').getByTestId('zone-main-content')).toBeVisible()
        await expect(page.getByTestId('zone-main').getByTestId('zone-menu-content')).toHaveCount(0)
    })
})

test.describe('zone routeParams', () => {
    test('the same :id reaches every zone component', async ({ page }) => {
        await page.goto('/test/zones/show/42')

        await expect(page.getByTestId('zone-menu-id')).toHaveText('42')
        await expect(page.getByTestId('zone-main-id')).toHaveText('42')
        await expect(page.getByTestId('zone-aside-id')).toHaveText('42')
    })

    test('changing the :id re-renders every zone with the new param', async ({ page }) => {
        await page.goto('/test/zones/show/42')
        await page.getByTestId('link-show-abc').click()

        await expect(page.getByTestId('zone-menu-id')).toHaveText('abc')
        await expect(page.getByTestId('zone-main-id')).toHaveText('abc')
        await expect(page.getByTestId('zone-aside-id')).toHaveText('abc')
    })
})
