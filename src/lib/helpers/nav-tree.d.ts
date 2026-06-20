/**
 * Permission specification — same shape used by route guards and
 * `hasPermission()`.
 */
export interface PermissionSpec {
    /** User needs at least one of these permissions */
    any?: string[];
    /** User needs every one of these permissions */
    all?: string[];
}

/**
 * A node in a navigation tree. Used as input to `filterByPermissions()` and
 * yielded by `walkTree()`.
 *
 * The two flag fields on the output side — `_forbidden` and
 * `_forbiddenClassName` — are attached by `filterByPermissions()` in
 * `mode: 'disable'`. They are NOT meant to be authored by hand on input
 * nodes.
 */
export interface NavTreeNode {
    /** Absolute route path the link navigates to. */
    path: string;

    /** Human-readable label rendered in the menu. */
    title?: string;

    /**
     * Permission spec required to access this node. When `inheritPermissions`
     * is enabled on the filter, ancestor permissions also apply.
     */
    permissions?: PermissionSpec;

    /**
     * Unconditionally exclude this node from the rendered menu — same effect
     * in both `'hide'` and `'disable'` modes. Accepts a boolean literal or a
     * getter function. The getter receives the node itself and returns
     * `true` to hide.
     *
     * Reactive: any reactive state the getter reads (via `$state` /
     * `$derived` / `hasPermission()`) makes the filter result reactive when
     * called inside a `$derived` block.
     *
     * Bare name (no `is*` prefix) matches HTML's `<element hidden>` and
     * KeenMate's data-model naming convention for boolean fields on
     * single-item shapes (see naming-conventions.md).
     *
     * @example
     *   hidden: true
     *   hidden: () => !import.meta.env.DEV
     *   hidden: () => !isInternalUser()
     */
    hidden?: boolean | ((node: NavTreeNode) => boolean);

    /**
     * Always-forbidden flag. Unlike `permissions`, doesn't depend on the
     * current user — useful for "coming soon" placeholders, deprecated
     * features, or product-level affordances that shouldn't be clickable
     * for anyone. Self-only: doesn't cascade to descendants' permission
     * state.
     *
     * - Renders as forbidden in BOTH modes — `disabled` is a product-level
     *   placeholder signal, not a user-permission one, so it stays visible
     *   regardless of the consumer's hide/disable preference.
     * - Only an ancestor's permission denial can still hide a disabled
     *   item (you can't reach the menu section to see the placeholder).
     * - Pair with `tooltip` or `meta` for explanation copy ("Coming Q3").
     *
     * Accepts a boolean literal or a getter — the getter form makes the
     * flag reactive when read inside a `$derived` block, just like
     * `hidden`.
     *
     * @example
     *   disabled: true
     *   disabled: () => !flags.integrationsReleased
     */
    disabled?: boolean | ((node: NavTreeNode) => boolean);

    /**
     * Optional tooltip text exposed on the output as `_tooltip` for
     * `<NavLink>` to render as a `title=` attribute. Primary use case:
     * explain *why* a forbidden item is disabled (e.g. "Requires admin role").
     *
     * Accepts a string literal or a callback. The callback receives the node
     * itself and `{ forbidden }` so it can return a different explanation
     * when the item is currently disabled vs. when it isn't. Return `null`
     * (or an empty string) to skip rendering a tooltip.
     *
     * Reactive: any reactive state the callback reads makes the filter
     * result reactive when called inside a `$derived` block.
     *
     * @example
     *   tooltip: 'Coming soon'
     *   tooltip: (node, { forbidden }) =>
     *       forbidden ? 'You need the admin role to access this' : null
     */
    tooltip?:
        | string
        | ((node: NavTreeNode, ctx: { forbidden: boolean }) => string | null | undefined);

    /**
     * Children nodes. Recursive — children can have their own children.
     */
    children?: NavTreeNode[];

    /**
     * Force this node to render even when all its children are filtered out.
     * Useful for pure section headers that should remain visible.
     */
    keepIfEmpty?: boolean;

    /**
     * Marks this node as a non-navigable section header. The `path` is kept
     * (so `findNodeByPath()`, the active cascade, breadcrumbs, and tooltips
     * still work) but the consumer is expected to:
     *
     *   1. Skip the node when registering routes
     *      (e.g. `walkTree(tree).filter((n) => !n.noRoute)`).
     *   2. Render it as a non-interactive header (`<span>` instead of `<a>`,
     *      no `use:link`, no `use:active`). `<NavLink noRoute>` does this
     *      automatically.
     *
     * Combine with `keepIfEmpty: true` for pure section headers that should
     * always render even when every child is filtered out.
     */
    noRoute?: boolean;

    /**
     * Output-only flag set by `filterByPermissions()` in `mode: 'disable'`
     * when the user cannot reach this node. Consumers (e.g. `<NavLink>`)
     * read this to render a non-interactive version of the item.
     */
    _forbidden?: boolean;

    /** Output-only — class name supplied to the consumer in disable mode. */
    _forbiddenClassName?: string;

    /**
     * Output-only — resolved tooltip text from the input `tooltip` field.
     * Present only when `tooltip` returned a non-empty string. `<NavLink>`
     * renders this as a `title=` attribute on both `<a>` and `<span>`.
     */
    _tooltip?: string;

    /**
     * Convention (not enforced): a namespace for arbitrary consumer data
     * — e.g. `meta: { requiredRole, docsUrl, owner }`. Keeps custom fields
     * off the top level where they'd compete with library-defined props.
     * Mirrors the router's `routeContext` pattern for route definitions.
     * Rides through `filterByPermissions()` untouched on the output node.
     *
     * Flat top-level custom fields still work — `meta` is the recommended
     * hygiene choice once you have more than one or two.
     */
    meta?: Record<string, unknown>;
}

/**
 * Options for `filterByPermissions()`.
 */
export interface FilterOptions {
    /**
     * @default 'hide'
     *
     * - `'hide'` drops inaccessible nodes from the output.
     * - `'disable'` keeps them in place with `_forbidden: true`.
     */
    mode?: 'hide' | 'disable';

    /**
     * Class name attached to `_forbiddenClassName` on forbidden output nodes
     * (permission denial or cascade from forbidden children). The walker /
     * NavLink decides how to apply it.
     *
     * @default 'forbidden'
     */
    forbiddenClassName?: string;

    /**
     * Optional alternative class name for nodes whose forbidden state comes
     * from `disabled: true` rather than permission denial. When set, takes
     * precedence over `forbiddenClassName` for the `_forbiddenClassName`
     * field on disabled nodes — lets consumers style "coming soon"
     * placeholders distinctly from "you lack permission" items.
     *
     * - Cascade parents (forbidden because their children all are) keep
     *   `forbiddenClassName` — only directly-disabled nodes pick this up.
     * - When a node is both `disabled` AND permission-denied, this wins:
     *   the product-level signal is the more permanent one.
     * - Default `undefined` → falls back to `forbiddenClassName` for full
     *   backward compatibility.
     *
     * @example
     *   filterByPermissions(navTree, {
     *       mode: 'disable',
     *       forbiddenClassName: 'forbidden',   // red strike-through
     *       disabledClassName: 'unavailable'   // amber "coming soon"
     *   })
     */
    disabledClassName?: string;

    /**
     * When true, child node accessibility requires every ancestor's
     * permissions to also pass. Matches the router's hierarchical-mode
     * filesystem-like semantics.
     *
     * @default true
     */
    inheritPermissions?: boolean;

    /**
     * Override per-node — return true to keep a parent in the output even
     * when all its children got filtered out. By default such parents are
     * dropped (no orphan section headers). Per-node `keepIfEmpty: true` also
     * forces retention.
     */
    keepEmpty?: (node: NavTreeNode) => boolean;
}

/**
 * Filter a nav tree by permissions and the `hidden` flag.
 *
 * Ancestor permissions are enforced via sequential `hasPermission()` checks
 * (one per level), not by merging the spec objects — `any: []` semantics
 * can't be combined by concatenation. Mirrors the router's own hierarchical-
 * mode pipeline.
 */
export function filterByPermissions(
    tree: NavTreeNode[],
    options?: FilterOptions
): NavTreeNode[];

/**
 * Evaluate the `hidden` flag on a node (handles both boolean and getter
 * shapes).
 */
export function isNodeHidden(node: NavTreeNode): boolean;

/**
 * Evaluate the `disabled` flag on a node — same boolean-or-getter shape as
 * `hidden`. Self-only: doesn't cascade to descendants.
 */
export function isNodeDisabled(node: NavTreeNode): boolean;

/**
 * Walk a tree depth-first, yielding every node.
 */
export function walkTree(tree: NavTreeNode[]): Generator<NavTreeNode>;

/**
 * Find a node by its `path` value. Returns `null` if no match.
 */
export function findNodeByPath(
    tree: NavTreeNode[],
    path: string
): NavTreeNode | null;
