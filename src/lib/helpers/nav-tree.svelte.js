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
 * `_forbidden` flag for "disabled" rendering. `isHidden` (boolean or getter)
 * gives consumers an unconditional way to skip nodes — e.g. feature-flagged
 * dev-only items.
 *
 * Reactivity: `hasPermission()` reads the current user via the reactive
 * `currentUserState` rune in helpers/permissions, so calling
 * `filterByPermissions()` inside a `$derived` block makes the entire
 * sidebar update live when the user logs in/out, role changes, or any
 * `isHidden` getter reads `$state` it tracks.
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
 * @property {boolean | ((node: NavTreeNode) => boolean)} [isHidden]
 * @property {NavTreeNode[]} [children]
 * @property {boolean} [keepIfEmpty]
 *
 * The filter may also attach `_forbidden: true` on output nodes when running
 * in `mode: 'disable'`. The flag is purely advisory — `<NavLink forbidden>`
 * is the intended consumer.
 */

/**
 * @typedef {Object} FilterOptions
 * @property {'hide' | 'disable'} [mode='hide']
 * @property {string} [forbiddenClassName='forbidden']  Class name attached to
 *   `_forbiddenClassName` on output nodes in disable mode. Pure data — the
 *   walker / NavLink decides how to apply it.
 * @property {boolean} [inheritPermissions=true]  When true, child nodes are
 *   only accessible if every ancestor's permissions also pass. Mirrors the
 *   router's hierarchical-mode semantics (filesystem-like).
 * @property {(node: NavTreeNode) => boolean} [keepEmpty]  Override per-node;
 *   default drops parents whose children all got filtered out. Useful for
 *   pure section headers that should still render with an empty submenu.
 */

/**
 * Evaluate `isHidden` on a node, accepting either a boolean literal or a
 * getter function. Pure — any reactive state the getter reads is picked up by
 * the enclosing `$derived`.
 *
 * @param {NavTreeNode} node
 * @returns {boolean}
 */
export function isNodeHidden(node) {
    const v = node.isHidden
    if (typeof v === 'function') return Boolean(v(node))
    return Boolean(v)
}

/**
 * Filter a nav tree by permissions and the `isHidden` flag.
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
 * `isHidden: true` (or a getter returning true) is always destructive
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
        inheritPermissions = true,
        keepEmpty = () => false
    } = options

    // ancestorAllowed: boolean — true if every ancestor's permission check
    // passed. Top level is vacuously true. Sequential checks (not spec
    // merging) — `any` semantics can't be combined by concatenation, so the
    // filter chains hasPermission() calls instead, mirroring how the router's
    // own hierarchical-mode pipeline checks each ancestor in sequence.
    function walk(nodes, ancestorAllowed) {
        const out = []
        for (const node of nodes) {
            if (isNodeHidden(node)) continue

            const ownAllowed = !node.permissions || hasPermission(node.permissions)
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
                if (!allowed) continue
                if (allChildrenFilteredOut && !shouldKeepEmpty) continue
                out.push(buildOutput(node, filteredChildren, false, forbiddenClassName))
            } else {
                // mode === 'disable'
                if (allChildrenFilteredOut && !shouldKeepEmpty) continue
                const allVisibleChildrenForbidden = hasChildrenInOriginal
                    && filteredChildren.length > 0
                    && filteredChildren.every((c) => c._forbidden)
                const forbidden = !allowed || allVisibleChildrenForbidden
                out.push(buildOutput(node, filteredChildren, forbidden, forbiddenClassName))
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
    return result
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
