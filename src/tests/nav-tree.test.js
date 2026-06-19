import { describe, it, expect, beforeEach } from 'vitest'
import {
    filterByPermissions,
    isNodeHidden,
    walkTree,
    findNodeByPath
} from '../lib/helpers/nav-tree.svelte.js'
import { configurePermissions } from '../lib/helpers/permissions.svelte.js'

/**
 * Test users — same shape as example/src/stores/userStore.svelte.js so the
 * filter behavior here mirrors what the live demo does.
 */
const USERS = {
    guest:  { permissions: [] },
    donna:  { permissions: ['read', 'write', 'user:view'] },
    audrey: { permissions: ['read', 'admin', 'user:view', 'user:edit', 'settings:manage'] }
}

let currentUser

function checkPermissions(user, spec) {
    if (!user || !spec) return false
    if (spec.any) return spec.any.some((p) => user.permissions.includes(p))
    if (spec.all) return spec.all.every((p) => user.permissions.includes(p))
    return false
}

function makeTree() {
    return [
        { path: '/', title: 'Overview' },
        {
            path: '/users',
            title: 'Users',
            permissions: { any: ['user:view'] },
            children: [
                { path: '/users/list', title: 'All', permissions: { any: ['user:view'] } },
                { path: '/users/new',  title: 'Create', permissions: { any: ['user:edit'] } }
            ]
        },
        {
            path: '/admin',
            title: 'Admin',
            permissions: { any: ['admin'] },
            children: [
                { path: '/admin/dashboard', title: 'Dashboard' },
                { path: '/admin/audit',     title: 'Audit' }
            ]
        }
    ]
}

beforeEach(() => {
    currentUser = USERS.donna
    configurePermissions({
        checkPermissions,
        getCurrentUser: () => currentUser
    })
})

describe('isNodeHidden', () => {
    it('returns false when not set', () => {
        expect(isNodeHidden({ path: '/' })).toBe(false)
    })

    it('returns true for static true', () => {
        expect(isNodeHidden({ path: '/', isHidden: true })).toBe(true)
    })

    it('calls the getter and returns its result', () => {
        expect(isNodeHidden({ path: '/', isHidden: () => true })).toBe(true)
        expect(isNodeHidden({ path: '/', isHidden: () => false })).toBe(false)
    })

    it('passes the node to the getter', () => {
        const node = { path: '/foo', isHidden: (n) => n.path === '/foo' }
        expect(isNodeHidden(node)).toBe(true)
    })
})

describe('filterByPermissions — mode: hide (default)', () => {
    it('keeps all nodes for a fully-permissioned user', () => {
        currentUser = USERS.audrey
        const result = filterByPermissions(makeTree())
        expect(result.map((n) => n.path)).toEqual(['/', '/users', '/admin'])
        expect(result[1].children.map((c) => c.path)).toEqual(['/users/list', '/users/new'])
    })

    it('drops the user:edit-gated child for a less-permissioned user', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree())
        const users = result.find((n) => n.path === '/users')
        expect(users.children.map((c) => c.path)).toEqual(['/users/list'])  // 'Create' gone
    })

    it('drops the Admin parent when all children fail inheritance', () => {
        // Donna lacks 'admin', so /admin and its inherited children all fail
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree())
        expect(result.find((n) => n.path === '/admin')).toBeUndefined()
    })

    it('drops the whole tree for a no-permission user', () => {
        currentUser = USERS.guest
        const result = filterByPermissions(makeTree())
        expect(result.map((n) => n.path)).toEqual(['/'])   // only public Overview remains
    })

    it('drops nodes with isHidden: true regardless of user permissions', () => {
        currentUser = USERS.audrey
        const tree = [
            ...makeTree(),
            { path: '/secret', title: 'Secret', isHidden: true }
        ]
        const result = filterByPermissions(tree)
        expect(result.find((n) => n.path === '/secret')).toBeUndefined()
    })

    it('respects isHidden getter form', () => {
        currentUser = USERS.audrey
        const tree = [
            { path: '/visible',   title: 'V', isHidden: () => false },
            { path: '/dev-only',  title: 'D', isHidden: () => true }   // simulated env-gate
        ]
        const result = filterByPermissions(tree)
        expect(result.map((n) => n.path)).toEqual(['/visible'])
    })

    it('respects keepIfEmpty on parents whose children all dropped', () => {
        currentUser = USERS.donna
        const tree = [
            {
                path: '/section',
                title: 'Section',
                keepIfEmpty: true,
                children: [
                    { path: '/section/secret', title: 'X', permissions: { any: ['admin'] } }
                ]
            }
        ]
        const result = filterByPermissions(tree)
        expect(result.map((n) => n.path)).toEqual(['/section'])
        expect(result[0].children).toEqual([])
    })

    it('inheritPermissions: false makes child accessible despite parent guard', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { inheritPermissions: false })
        const admin = result.find((n) => n.path === '/admin')
        // /admin itself still fails (own perms), so still dropped...
        expect(admin).toBeUndefined()
        // ...but if we strip /admin's own perms too, children should reappear:
        const tree = makeTree()
        const adminNode = tree.find((n) => n.path === '/admin')
        delete adminNode.permissions
        const result2 = filterByPermissions(tree, { inheritPermissions: false })
        const admin2 = result2.find((n) => n.path === '/admin')
        expect(admin2.children.map((c) => c.path)).toEqual(['/admin/dashboard', '/admin/audit'])
    })
})

describe('filterByPermissions — mode: disable', () => {
    it('keeps inaccessible nodes with _forbidden: true', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { mode: 'disable' })

        const admin = result.find((n) => n.path === '/admin')
        expect(admin).toBeDefined()
        expect(admin._forbidden).toBe(true)
        expect(admin._forbiddenClassName).toBe('forbidden')
    })

    it('attaches custom forbiddenClassName', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), {
            mode: 'disable',
            forbiddenClassName: 'is-locked'
        })
        const admin = result.find((n) => n.path === '/admin')
        expect(admin._forbiddenClassName).toBe('is-locked')
    })

    it('cascades _forbidden up: parent gets it when all visible children are forbidden', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { mode: 'disable' })
        const admin = result.find((n) => n.path === '/admin')
        // Children inherit /admin perms, fail, get _forbidden. Parent then
        // sees all children forbidden → parent _forbidden too.
        expect(admin._forbidden).toBe(true)
        expect(admin.children.every((c) => c._forbidden)).toBe(true)
    })

    it('does NOT mark accessible nodes as forbidden', () => {
        currentUser = USERS.donna
        const result = filterByPermissions(makeTree(), { mode: 'disable' })
        const overview = result.find((n) => n.path === '/')
        expect(overview._forbidden).toBeUndefined()
    })

    it('still drops isHidden: true nodes (hide takes precedence over disable)', () => {
        currentUser = USERS.audrey
        const tree = [
            ...makeTree(),
            { path: '/secret', title: 'Secret', isHidden: true }
        ]
        const result = filterByPermissions(tree, { mode: 'disable' })
        expect(result.find((n) => n.path === '/secret')).toBeUndefined()
    })

    it('user with full access sees no forbidden flags', () => {
        currentUser = USERS.audrey
        const result = filterByPermissions(makeTree(), { mode: 'disable' })
        for (const node of walkTree(result)) {
            expect(node._forbidden).toBeUndefined()
        }
    })
})

describe('filterByPermissions — reactivity to user changes', () => {
    it('produces different output as the configured user changes', () => {
        // Same input, two different users, two different outputs — proves
        // the filter reads through the configured user getter on each call.
        // In a `$derived` block, this is what makes the sidebar reactive.
        currentUser = USERS.donna
        const donnaResult = filterByPermissions(makeTree())

        currentUser = USERS.audrey
        const audreyResult = filterByPermissions(makeTree())

        expect(donnaResult.find((n) => n.path === '/admin')).toBeUndefined()
        expect(audreyResult.find((n) => n.path === '/admin')).toBeDefined()
    })
})

describe('walkTree + findNodeByPath', () => {
    it('walkTree yields every node depth-first', () => {
        const tree = makeTree()
        const paths = Array.from(walkTree(tree)).map((n) => n.path)
        expect(paths).toEqual([
            '/',
            '/users', '/users/list', '/users/new',
            '/admin', '/admin/dashboard', '/admin/audit'
        ])
    })

    it('findNodeByPath returns the matching node or null', () => {
        const tree = makeTree()
        expect(findNodeByPath(tree, '/users/new').title).toBe('Create')
        expect(findNodeByPath(tree, '/nope')).toBeNull()
    })
})
