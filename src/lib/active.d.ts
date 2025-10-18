/**
 * Options for the active action
 */
export interface ActiveOptions {
    /**
     * Path expression that makes the link active when matched (must start with '/' or '*')
     * Default is the link's href attribute
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
