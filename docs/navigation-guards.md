# Navigation guards

Prevent navigation when there's unsaved work or other conditions that need user confirmation.

## Which mode should I use?

Three patterns, all calling the same underlying `registerBeforeLeave` primitive — the wrapper and helper are conveniences on top. Pick by ergonomics, not capability.

| Mode | Reach for it when… | Trade-off |
|---|---|---|
| **PageWrapper** *(declarative)* | You want a page-level guard tied to the component's lifecycle. Drop the wrapper around your page, write the `beforeLeave` function, done. | Adds one extra component in the markup. Less control over *when* the guard is active during the page's lifetime. |
| **Direct registration** *(imperative)* | You need fine control — swap the guard mid-session, toggle it based on a condition, share one guard across multiple components. Call `registerBeforeLeave` / `unregisterBeforeLeave` inside `onMount`/`onDestroy` (or a `$effect`). | You own the lifecycle — easy to forget the cleanup and leak guards across navigations. |
| **`createDirtyCheckGuard`** *(shortcut)* | Your guard is the classic "form has unsaved changes — confirm before leaving" pattern. The helper bakes in the dirty-check + `confirm()` dialog; just plug in the dirty predicate. | Only fits the dirty-check shape. You still register it the same way as Direct mode — the helper just saves the `confirm` boilerplate. |

> **Tip:** the live demo at `/navigation-guard-demo` (in the example app) lets you switch between all three modes with the same form, so you can compare them side-by-side.

## Basic usage with PageWrapper

Create a reusable wrapper component:

```svelte
<!-- PageWrapper.svelte -->
<script>
import { registerBeforeLeave, unregisterBeforeLeave } from '@keenmate/svelte-spa-router/helpers/navigation-guard'
import { onMount, onDestroy } from 'svelte'

let { beforeLeave = undefined, children } = $props()

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
```

Use in your page components:

```svelte
<script>
import PageWrapper from './PageWrapper.svelte'
import { NavigationCancelledError } from '@keenmate/svelte-spa-router/helpers/navigation-guard'

let formData = $state({ name: '', email: '' })
let formIsDirty = $state(false)

async function beforeLeave(ctx) {
    if (formIsDirty && !confirm(`Leave "${ctx.from}" with unsaved changes?`)) {
        throw new NavigationCancelledError()
    }
}
</script>

<PageWrapper {beforeLeave}>
    <form>
        <input bind:value={formData.name} oninput={() => formIsDirty = true} />
        <input bind:value={formData.email} oninput={() => formIsDirty = true} />
    </form>
</PageWrapper>
```

## Direct registration

Register guards directly without a wrapper:

```svelte
<script>
import { registerBeforeLeave, unregisterBeforeLeave, NavigationCancelledError } from '@keenmate/svelte-spa-router/helpers/navigation-guard'
import { onMount, onDestroy } from 'svelte'

let formIsDirty = $state(false)

async function beforeLeave(ctx) {
    if (formIsDirty && !confirm("Unsaved changes. Leave anyway?")) {
        throw new NavigationCancelledError()
    }
}

onMount(() => registerBeforeLeave(beforeLeave))
onDestroy(() => unregisterBeforeLeave(beforeLeave))
</script>

<form>
    <input oninput={() => formIsDirty = true} />
</form>
```

## Using helper functions

Use the `createDirtyCheckGuard` helper for common scenarios:

```svelte
<script>
import { registerBeforeLeave, unregisterBeforeLeave, createDirtyCheckGuard } from '@keenmate/svelte-spa-router/helpers/navigation-guard'
import { onMount, onDestroy } from 'svelte'

let formIsDirty = $state(false)

const beforeLeave = createDirtyCheckGuard(
    () => formIsDirty,
    "You have unsaved changes. Leave anyway?"
)
// Add isDirty for browser beforeunload warning
beforeLeave.isDirty = () => formIsDirty

onMount(() => registerBeforeLeave(beforeLeave))
onDestroy(() => unregisterBeforeLeave(beforeLeave))
</script>
```

## Navigation context

The beforeLeave handler receives a context object with navigation details:

```typescript
interface NavigationContext {
    from: string       // Current route
    to: string         // Destination route
    params?: Record<string, string>
    querystring?: string
}
```

## Browser navigation

Guards also work with browser back/forward/close when using `isDirty` property:

```javascript
const beforeLeave = createDirtyCheckGuard(() => formIsDirty)
beforeLeave.isDirty = () => formIsDirty  // Enables browser beforeunload warning
```

See `/navigation-guard-demo` in the example-history app for a complete interactive demo.
