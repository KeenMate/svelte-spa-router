<script>
import { link } from '@keenmate/svelte-spa-router'
import active from '@keenmate/svelte-spa-router/active'

/**
 * Thin wrapper around `use:link` + `use:active` for menu links generated
 * from a route tree.
 *
 * Props:
 *   - href                — link target
 *   - subtree             — use:active subtree mode (parent stays active on
 *                           descendants without writing a regex)
 *   - className           — class added on exact-href match
 *   - subtreeClassName    — class added on descendants (paired with subtree)
 *   - forbidden           — render as a non-interactive span instead of a
 *                           link; no use:link, no use:active. Pair with the
 *                           `_forbidden` flag that `filterByPermissions(...,
 *                           { mode: 'disable' })` attaches to output nodes.
 *   - forbiddenClassName  — CSS class for the forbidden state (default
 *                           'forbidden')
 *
 * Forbidden items are rendered with `aria-disabled="true"` and have no
 * click navigation. Hover/focus styling is the consumer's job.
 */

let {
    href,
    subtree = false,
    className = 'active',
    subtreeClassName = undefined,
    forbidden = false,
    forbiddenClassName = 'forbidden',
    children,
    ...rest
} = $props()
</script>

{#if forbidden}
    <span class={forbiddenClassName} aria-disabled="true" {...rest}>
        {@render children?.()}
    </span>
{:else}
    <a
        {href}
        use:link
        use:active={subtree
            ? { subtree: true, className, subtreeClassName }
            : { className }}
        {...rest}
    >{@render children?.()}</a>
{/if}
