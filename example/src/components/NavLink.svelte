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
 *   - tooltip             — optional `title=` attribute, rendered on every
 *                           render path. Pair with the `_tooltip` field that
 *                           `filterByPermissions` resolves from each node's
 *                           `tooltip` callback — typical use is explaining
 *                           *why* a forbidden item is disabled.
 *   - noRoute             — render as a non-navigable section header
 *                           (`<span class="nav-header">`). No `use:link`, no
 *                           `use:active`. Pair with the `noRoute` flag on the
 *                           input tree node; the consumer also filters
 *                           `noRoute` nodes out of route registration.
 *   - headerClassName     — CSS class for the noRoute header (default
 *                           'nav-header')
 *   - collapsible         — when paired with noRoute, swaps the header
 *                           `<span>` for a `<button type="button">` so it can
 *                           be clicked to toggle a collapsible section.
 *                           Pass `onclick` via `{...rest}` to handle the
 *                           toggle. Forwards `aria-expanded={expanded}`.
 *   - expanded            — controlled state for the chevron / aria-expanded.
 *                           The consumer owns the actual collapse state.
 *
 * Forbidden items are rendered with `aria-disabled="true"` and have no
 * click navigation. Hover/focus styling is the consumer's job. When a node
 * is both `noRoute` and `forbidden` (e.g. cascade from forbidden children),
 * both classes are applied. Collapsible + forbidden buttons are disabled.
 */

let {
    href,
    subtree = false,
    className = 'active',
    subtreeClassName = undefined,
    forbidden = false,
    forbiddenClassName = 'forbidden',
    tooltip = undefined,
    noRoute = false,
    headerClassName = 'nav-header',
    collapsible = false,
    expanded = undefined,
    children,
    ...rest
} = $props()
</script>

{#if noRoute && collapsible}
    <button
        type="button"
        class="{headerClassName}{forbidden ? ' ' + forbiddenClassName : ''}"
        aria-expanded={expanded}
        aria-disabled={forbidden ? 'true' : undefined}
        disabled={forbidden}
        title={tooltip}
        {...rest}
    >
        {@render children?.()}
    </button>
{:else if noRoute}
    <span
        class="{headerClassName}{forbidden ? ' ' + forbiddenClassName : ''}"
        aria-disabled={forbidden ? 'true' : undefined}
        title={tooltip}
        {...rest}
    >
        {@render children?.()}
    </span>
{:else if forbidden}
    <span class={forbiddenClassName} aria-disabled="true" title={tooltip} {...rest}>
        {@render children?.()}
    </span>
{:else}
    <a
        {href}
        use:link
        use:active={subtree
            ? { subtree: true, className, subtreeClassName }
            : { className }}
        title={tooltip}
        {...rest}
    >{@render children?.()}</a>
{/if}
