<script>
import { registerBeforeLeave, unregisterBeforeLeave } from '../../../src/lib/helpers/navigation-guard.svelte.js'
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

    /**
     * Children content
     */
    children
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
