<script>
import { computePosition, offset, flip, shift, autoUpdate } from '@floating-ui/dom'

/**
 * Hover/focus-activated rich tooltip using Floating UI for positioning.
 *
 * Behavior:
 *   - Opens on mouseenter or focusin of the trigger (default 200ms delay)
 *   - Closes when both trigger AND content lose hover/focus (allowing the
 *     mouse to traverse the gap into the tooltip without it disappearing)
 *   - Closes on ESC
 *   - Content can contain interactive elements (links, buttons) — clicking
 *     them works because the tooltip stays open while pointer is inside
 *
 * Slots:
 *   - children — the trigger element (usually a NavLink)
 *   - content  — a snippet rendering the tooltip body. Receives `data` as
 *                its argument so the consumer can author one parametrized
 *                snippet and reuse it for every node.
 *
 * Props:
 *   - data       — value forwarded to the `content` snippet (e.g. the
 *                  filtered nav-tree node)
 *   - placement  (default 'right') — Floating UI placement string
 *   - openDelay  (default 200ms)
 *   - closeDelay (default 150ms)
 */

let {
    children,
    content,
    data = undefined,
    placement = 'right',
    openDelay = 200,
    closeDelay = 150
} = $props()

let triggerEl = $state()
let tooltipEl = $state()
let open = $state(false)
let openTimer
let closeTimer
let cleanupAutoUpdate

function scheduleOpen() {
    clearTimeout(closeTimer)
    if (open) return
    openTimer = setTimeout(() => { open = true }, openDelay)
}

function scheduleClose() {
    clearTimeout(openTimer)
    closeTimer = setTimeout(() => { open = false }, closeDelay)
}

function onKey(e) {
    if (e.key === 'Escape' && open) open = false
}

$effect(() => {
    if (!open || !triggerEl || !tooltipEl) return

    cleanupAutoUpdate = autoUpdate(triggerEl, tooltipEl, () => {
        computePosition(triggerEl, tooltipEl, {
            strategy: 'fixed',
            placement,
            middleware: [offset(8), flip(), shift({ padding: 8 })]
        }).then(({ x, y }) => {
            Object.assign(tooltipEl.style, {
                left: `${x}px`,
                top: `${y}px`
            })
        })
    })

    return () => cleanupAutoUpdate?.()
})
</script>

<svelte:window onkeydown={onKey} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
    class="rich-tooltip-trigger"
    bind:this={triggerEl}
    onmouseenter={scheduleOpen}
    onmouseleave={scheduleClose}
    onfocusin={scheduleOpen}
    onfocusout={scheduleClose}
>
    {@render children()}
</span>

{#if open}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={tooltipEl}
        class="rich-tooltip"
        role="tooltip"
        onmouseenter={scheduleOpen}
        onmouseleave={scheduleClose}
        onfocusin={scheduleOpen}
        onfocusout={scheduleClose}
    >
        {@render content(data)}
    </div>
{/if}

<style>
.rich-tooltip-trigger {
    display: block;
}
.rich-tooltip {
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
    padding: 0.75rem 0.9rem;
    max-width: 320px;
    font-size: 0.85rem;
    color: #1e293b;
    line-height: 1.45;
}
:global(.rich-tooltip h4) {
    margin: 0 0 0.25rem 0;
    font-size: 0.95rem;
    color: #0f172a;
}
:global(.rich-tooltip p) {
    margin: 0 0 0.4rem 0;
    color: #475569;
}
:global(.rich-tooltip code) {
    background: #f1f5f9;
    color: #b91c1c;
    padding: 0.05em 0.35em;
    border-radius: 3px;
    font-size: 0.85em;
}
:global(.rich-tooltip a) {
    color: #2563eb;
    text-decoration: underline;
    font-weight: 500;
}
:global(.rich-tooltip a:hover) {
    color: #1d4ed8;
}
:global(.rich-tooltip .badge) {
    display: inline-block;
    background: #fee2e2;
    color: #b91c1c;
    border-radius: 4px;
    padding: 0.1em 0.5em;
    font-size: 0.75em;
    font-weight: 600;
    margin-bottom: 0.25rem;
}
:global(.rich-tooltip .badge-unavailable) {
    background: #fef3c7;
    color: #b45309;
}
</style>
