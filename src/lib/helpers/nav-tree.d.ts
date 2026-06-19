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
     * @example
     *   isHidden: true
     *   isHidden: () => !import.meta.env.DEV
     *   isHidden: () => !isInternalUser()
     */
    isHidden?: boolean | ((node: NavTreeNode) => boolean);

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
     * Output-only flag set by `filterByPermissions()` in `mode: 'disable'`
     * when the user cannot reach this node. Consumers (e.g. `<NavLink>`)
     * read this to render a non-interactive version of the item.
     */
    _forbidden?: boolean;

    /** Output-only — class name supplied to the consumer in disable mode. */
    _forbiddenClassName?: string;
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
     * in `'disable'` mode. The walker / NavLink decides how to apply it.
     *
     * @default 'forbidden'
     */
    forbiddenClassName?: string;

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
 * Filter a nav tree by permissions and the `isHidden` flag.
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
 * Evaluate the `isHidden` flag on a node (handles both boolean and getter
 * shapes).
 */
export function isNodeHidden(node: NavTreeNode): boolean;

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
