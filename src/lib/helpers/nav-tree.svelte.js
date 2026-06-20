/**
 * @module helpers/nav-tree
 *
 * Permission-aware filtering for tree-shaped navigation menus.
 *
 * Typical setup: a single tree drives both the route registration AND the
 * sidebar render — see `example/src/routes/nav-tree.js` +
 * `example/src/routes/NavTreeDemo.svelte` for the reference implementation.
 *
 * `filterByPermissions(tree)` walks the tree and either hides nodes the
 * current user can't reach (default) or keeps them in place with a
 * `_forbidden` flag for "disabled" rendering. `hidden` (boolean or getter)
 * gives consumers an unconditional way to skip nodes — e.g. feature-flagged
 * dev-only items. (Field name follows HTML data-model convention — see
 * naming-conventions.md for why `hidden` instead of `isHidden`.)
 *
 * Reactivity: `hasPermission()` reads the current user via the reactive
 * `currentUserState` rune in helpers/permissions, so calling
 * `filterByPermissions()` inside a `$derived` block makes the entire
 * sidebar update live when the user logs in/out, role changes, or any
 * `hidden` getter reads `$state` it tracks.
 */

import { hasPermission } from './permissions.svelte.js'

/**
 * @typedef {Object} PermissionSpec
 * @property {string[]} [any]
 * @property {string[]} [all]
 */

/**
 * @typedef {Object} NavTreeNode
 * @property {string} path
 * @property {string} [title]
 * @property {PermissionSpec} [permissions]
 * @property {boolean | ((node: NavTreeNode) => boolean)} [hidden]
 * @property {boolean | ((node: NavTreeNode) => boolean)} [disabled]
 *   Always-forbidden flag. Unlike permissions, doesn't depend on the current
 *   user — useful for "coming soon" placeholders, deprecated features, or
 *   product-level affordances. Self-only: doesn't cascade to descendants'
 *   permission state. Renders as forbidden in BOTH modes (it's a
 *   product-level signal, not a user-permission one); only an ancestor's
 *   permission denial can still hide a disabled item (you can't reach the
 *   menu section to see the placeholder).
 * @property {string | ((node: NavTreeNode, ctx: { forbidden: boolean }) => string | null | undefined)} [tooltip]
 * @property {NavTreeNode[]} [children]
 * @property {boolean} [keepIfEmpty]
 * @property {boolean} [noRoute]  Non-navigable section header — consumer
 *   skips route registration (`walkTree(tree).filter((n) => !n.noRoute)`)
 *   and renders it as a `<span>`. The `path` is still useful as an identity
 *   for breadcrumbs, tooltips, and the forbidden cascade.
 *
 * The filter may attach `_forbidden: true` on output nodes in `mode: 'disable'`,
 * and `_tooltip` from the `tooltip` field (callbacks are invoked with the
 * resolved forbidden state so they can return explanation text like
 * "Requires admin role" or `null` to skip). Both are purely advisory —
 * `<NavLink>` is the intended consumer.
 */

/**
 * @typedef {Object} FilterOptions
 * @property {'hide' | 'disable'} [mode='hide']
 * @property {string} [forbiddenClassName='forbidden']  Class name attached to
 *   `_forbiddenClassName` on output nodes whose forbidden state comes from
 *   permission denial (or cascade from forbidden children). Pure data — the
 *   walker / NavLink decides how to apply it.
 * @property {string} [disabledClassName]  Optional alternative class name for
 *   nodes whose forbidden state comes from `disabled: true` (product-level
 *   placeholder), not permission denial. When set, takes precedence over
 *   `forbiddenClassName` for the `_forbiddenClassName` field on disabled
 *   nodes — lets consumers style "coming soon" placeholders distinctly from
 *   "you lack permission" items even though both render as a non-interactive
 *   span. Cascade parents (forbidden because every visible child is
 *   forbidden) keep `forbiddenClassName`. When a node is both `disabled` AND
 *   permission-denied (rare), `disabledClassName` wins because the
 *   product-level signal is the more permanent one. Default: undefined →
 *   falls back to `forbiddenClassName` for full backward compatibility.
 * @property {boolean} [inheritPermissions=true]  When true, child nodes are
 *   only accessible if every ancestor's permissions also pass. Mirrors the
 *   router's hierarchical-mode semantics (filesystem-like).
 * @property {(node: NavTreeNode) => boolean} [keepEmpty]  Override per-node;
 *   default drops parents whose children all got filtered out. Useful for
 *   pure section headers that should still render with an empty submenu.
 */

/**
 * Evaluate `hidden` on a node, accepting either a boolean literal or a
 * getter function. Pure — any reactive state the getter reads is picked up by
 * the enclosing `$derived`.
 *
 * @param {NavTreeNode} node
 * @returns {boolean}
 */
export function isNodeHidden(node) {
    const v = node.hidden
    if (typeof v === 'function') return Boolean(v(node))
    return Boolean(v)
}

/**
 * Evaluate `disabled` on a node — same boolean-or-getter shape as
 * `hidden`. Self-only: doesn't cascade to descendants.
 *
 * @param {NavTreeNode} node
 * @returns {boolean}
 */
export function isNodeDisabled(node) {
    const v = node.disabled
    if (typeof v === 'function') return Boolean(v(node))
    return Boolean(v)
}

/**
 * Filter a nav tree by permissions and the `hidden` flag.
 *
 * Modes:
 *   - 'hide' (default) — nodes the user can't reach are dropped from the
 *     output. Cascades: a parent whose visible children are all filtered out
 *     is itself dropped (unless `keepIfEmpty: true` on the node or the
 *     `keepEmpty` option returns true).
 *   - 'disable' — permission-denied nodes are kept but marked `_forbidden:
 *     true` (and `_forbiddenClassName` if configured) so the renderer can
 *     style them as disabled. Cascading parent flagging applies — if a
 *     parent has access but every visible child is forbidden, the parent
 *     gets `_forbidden: true` as well.
 *
 * `hidden: true` (or a getter returning true) is always destructive
 * regardless of mode — it's the "never render this" signal.
 *
 * @param {NavTreeNode[]} tree
 * @param {FilterOptions} [options]
 * @returns {NavTreeNode[]}
 */
export function filterByPermissions(tree, options = {}) {
    const {
        mode = 'hide',
        forbiddenClassName = 'forbidden',
        disabledClassName,
        inheritPermissions = true,
        keepEmpty = () => false
    } = options

    // Pick the class name for a forbidden node. `disabled: true` wins over
    // permission denial because it's the more permanent product-level signal.
    // Cascade parents (forbidden only because their children are) get the
    // standard forbiddenClassName — only directly-disabled nodes get the
    // distinct disabledClassName.
    function classNameFor(isDisabled) {
        return isDisabled && disabledClassName ? disabledClassName : forbiddenClassName
    }

    // ancestorAllowed: boolean — true if every ancestor's permission check
    // passed. Top level is vacuously true. Sequential checks (not spec
    // merging) — `any` semantics can't be combined by concatenation, so the
    // filter chains hasPermission() calls instead, mirroring how the router's
    // own hierarchical-mode pipeline checks each ancestor in sequence.
    function walk(nodes, ancestorAllowed) {
        const out = []
        for (const node of nodes) {
            if (isNodeHidden(node)) continue

            const isDisabled = isNodeDisabled(node)
            const ownAllowed = !node.permissions || hasPermission(node.permissions)
            // `allowed` covers permission-cascade only; `disabled` is self-only
            // and doesn't propagate to descendants.
            const allowed = ancestorAllowed && ownAllowed

            const childNodes = node.children
            const childAncestorAllowed = inheritPermissions ? allowed : true
            const filteredChildren = childNodes
                ? walk(childNodes, childAncestorAllowed)
                : undefined

            const hasChildrenInOriginal = !!childNodes
            const allChildrenFilteredOut = hasChildrenInOriginal && filteredChildren.length === 0
            const shouldKeepEmpty = node.keepIfEmpty || keepEmpty(node)

            if (mode === 'hide') {
                // Permission denial hides; `disabled` does NOT — disabled is
                // a product-level placeholder ("coming soon"), visible to
                // everyone regardless of mode, just as a forbidden span.
                // Ancestor permission denial still hides disabled children
                // (you can't reach the menu section in the first place).
                if (!allowed) continue
                if (allChildrenFilteredOut && !shouldKeepEmpty) continue
                out.push(buildOutput(node, filteredChildren, isDisabled, classNameFor(isDisabled)))
            } else {
                // mode === 'disable'
                if (allChildrenFilteredOut && !shouldKeepEmpty) continue
                const allVisibleChildrenForbidden = hasChildrenInOriginal
                    && filteredChildren.length > 0
                    && filteredChildren.every((c) => c._forbidden)
                const forbidden = !allowed || isDisabled || allVisibleChildrenForbidden
                out.push(buildOutput(node, filteredChildren, forbidden, classNameFor(isDisabled)))
            }
        }
        return out
    }

    return walk(tree, true)
}

function buildOutput(node, filteredChildren, forbidden, forbiddenClassName) {
    const result = { ...node }
    if (filteredChildren !== undefined) result.children = filteredChildren
    if (forbidden) {
        result._forbidden = true
        if (forbiddenClassName) result._forbiddenClassName = forbiddenClassName
    }
    const tooltip = resolveTooltip(node, forbidden)
    if (tooltip) result._tooltip = tooltip
    return result
}

/**
 * Evaluate `tooltip` on a node, accepting either a string literal or a
 * callback. The callback receives the node and `{ forbidden }` so it can
 * tailor the explanation (e.g. "Requires admin role" when forbidden vs
 * a feature hint otherwise). Returns a non-empty string or `null`.
 */
function resolveTooltip(node, forbidden) {
    const v = node.tooltip
    if (v == null) return null
    if (typeof v === 'function') {
        const result = v(node, { forbidden })
        return result || null
    }
    return v || null
}

/**
 * Walk a tree depth-first, yielding every node. Same shape as
 * `example/src/routes/nav-tree.js#walkTree` — promoted to the library so
 * consumers can reuse it for route registration and other tree-shaped
 * operations.
 *
 * @param {NavTreeNode[]} tree
 * @returns {Generator<NavTreeNode>}
 */
export function* walkTree(tree) {
    for (const item of tree) {
        yield item
        if (item.children) yield* walkTree(item.children)
    }
}

/**
 * Find a node by its `path` value. Returns `null` if no match.
 *
 * @param {NavTreeNode[]} tree
 * @param {string} path
 * @returns {NavTreeNode | null}
 */
export function findNodeByPath(tree, path) {
    for (const node of walkTree(tree)) {
        if (node.path === path) return node
    }
    return null
}
