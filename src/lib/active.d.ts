/**
 * Options for the active action
 */
export interface ActiveOptions {
    /**
     * Path expression that makes the link active when matched (must start with '/' or '*')
     * Default is the link's href attribute. Ignored when `subtree: true`.
     */
    path?: string | RegExp;

    /**
     * CSS class to apply to the element when active
     * @default "active"
     */
    className?: string;

    /**
     * CSS class to apply to the element when inactive
     */
    inactiveClassName?: string;

    /**
     * Match the link's `href` exactly AND every descendant path.
     *
     * Sidebar parents stay highlighted on their own index page AND when any
     * nested URL under them is open — without writing a regex. Equivalent to
     * stacking `use:active use:active={'<href>/*'}` by hand.
     *
     * Requires the element to have an `href` attribute.
     */
    subtree?: boolean;

    /**
     * CSS class used for the descendants pattern when `subtree: true`.
     * Defaults to `className`. Set distinct from `className` to style the
     * "really active" link differently from a "parent of active" link
     * (e.g. `className: 'link-active'`, `subtreeClassName: 'sublink-active'`).
     */
    subtreeClassName?: string;
}

/**
 * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element)
 * when the current location matches a certain path.
 *
 * @param node - The target node (automatically set by Svelte)
 * @param opts - Can be an object of type ActiveOptions, or a string (or regular expression) representing ActiveOptions.path
 * @returns Object with destroy function
 *
 * @example
 * ```svelte
 * <script>
 *   import active from '@keenmate/svelte-spa-router/active'
 * </script>
 *
 * <a href="/path" use:active>Link</a>
 * <a href="/path" use:active={{className: 'current'}}>Link</a>
 * <a href="/path" use:active="/other/path">Link</a>
 * ```
 */
export default function active(
    node: HTMLElement,
    opts?: ActiveOptions | string | RegExp
): {
    destroy(): void;
};
