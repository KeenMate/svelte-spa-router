<script>
import { registerBeforeLeave, unregisterBeforeLeave } from '@keenmate/svelte-spa-router/helpers/navigation-guard'
import { onMount, onDestroy } from 'svelte'

/**
 * Reusable PageWrapper component that handles beforeLeave navigation guards
 *
 * Usage:
 * <PageWrapper {beforeLeave}>
 *   <YourPageContent />
 * </PageWrapper>
 */

let {
    /**
     * Optional beforeLeave handler function
     * Will be called before navigating away from this page
     * Should throw NavigationCancelledError to prevent navigation
     */
    beforeLeave = undefined,

	children = undefined,
} = $props()

onMount(() => {
    if (beforeLeave) {
        registerBeforeLeave(beforeLeave)
    }
})

onDestroy(() => {
    if (beforeLeave) {
        unregisterBeforeLeave(beforeLeave)
    }
})
</script>

{@render children?.()}
