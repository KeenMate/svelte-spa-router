# Pitfalls — contributor reference

Things that surprised us while building this router. Document the lessons so the next person doesn't lose a half-day to the same trap.

## Svelte 5 compiler drops parens in nested `||` / `&&` boolean expressions

**TL;DR:** Don't write deeply nested mixed `||`/`&&` boolean expressions with `!=`/`!==` inside a `<script>` block. Hoist the sub-checks into named locals. The Svelte 5 compiler will silently change the semantics of the inlined form.

### What broke

`Router.svelte`'s component validator was originally one nested expression:

```js
if (!component || (typeof component != 'function' && (typeof component != 'object' || component._sveltesparouter !== true))) {
    throw Error('Invalid component object')
}
```

In `svelte@5.5x` + `@sveltejs/vite-plugin-svelte@^6` + `vite@^7` consumer projects, every bare-function route (`{ '/': Home }`) threw `Invalid component object` at runtime — in both `vite dev` and `vite build` + `vite preview`. The escape hatch `wrap({ component: Home })` worked, hiding the bug for users who followed the `wrap()`-everywhere convention.

### Why

The Svelte 5 compiler (verified in `5.39.12` and `5.56.1`, both runes and non-runes modes, both dev and production) rewrites the inlined expression as:

```js
if (!component || typeof component != 'function' && typeof component != 'object' || component._sveltesparouter !== true)
```

The inner parens around `(typeof component != 'object' || component._sveltesparouter !== true)` are gone. Under JavaScript operator precedence (`&&` binds tighter than `||`), the source `!c || (A && (B || C))` becomes the compiled `!c || (A && B) || C` — a different boolean function.

For `component = function compiledSvelteComponent() {}`:

| sub-expression           | value |
|--------------------------|-------|
| `!component`             | false |
| `typeof component != 'function'` (A) | false |
| `typeof component != 'object'`   (B) | true  |
| `component._sveltesparouter !== true` (C) | true |

- Source `!c || (A && (B || C))` = `false || (false && (true \|\| true))` = `false || (false && true)` = `false` → no throw ✓
- Compiled `!c || (A && B) || C` = `false || (false && true) || true` = `true` → throws ✗

Reproducible by calling `svelte/compiler.compile()` directly — no plugin or bundler involved. **Upstream bug, not a router bug.** When fixed upstream, the workaround in the router can stay (no harm) or be reverted to the original form (smaller, slightly clearer).

### The workaround

Hoist the sub-checks into positive named locals:

```js
const isComponentFn = typeof component === 'function'
const isWrappedRoute = typeof component === 'object' && component !== null && component._sveltesparouter === true
if (!component || (!isComponentFn && !isWrappedRoute)) {
    throw Error('Invalid component object')
}
```

The compiled `if` is now single-nesting (`!c || (!isFn && !isWrapped)`) — no nested OR for the paren-drop bug to chew on.

### Why our test suite missed it

The router's example app pins `vite@^5 + plugin-svelte@^4 + svelte@5.39`. The same compiler output is produced under those versions (verified independently), but somewhere in the older plugin/runtime pipeline the broken expression doesn't manifest at runtime. Newer consumer stacks (`vite@^7 + plugin-svelte@^6 + svelte@5.5x`) hit it immediately.

Lesson: pin example app dev-deps to **a floor matching what consumers actually use** — not to the version the example happened to be scaffolded with. Otherwise the example green-lights a release that breaks downstream.

### General rule for `.svelte` script blocks

When writing a guard with mixed `||` and `&&` operators inside a `.svelte` `<script>` block:

- **Do** hoist sub-conditions into named locals.
- **Do** prefer positive checks (`x === 'foo'`) over negated nested ones (`x != 'foo'`).
- **Don't** assume the compiler will preserve parentheses around `LogicalExpression` children of mixed-operator `LogicalExpression` parents.

Single-level `&&` or `||` chains are fine. The bug only surfaces when an outer `||` contains an `&&` whose right side contains another `||`.
