/**
 * User context store for managing current user and permissions
 */

// Define our users with their permissions
const USERS = {
    donna: {
        id: 1,
        name: 'Donna Hayward',
        permissions: ['read', 'write', 'user:view']
    },
    audrey: {
        id: 2,
        name: 'Audrey Horne',
        permissions: ['read', 'admin', 'user:view', 'user:edit', 'settings:manage']
    }
}

// Current user state (start with Donna)
let currentUser = $state(USERS.donna)

/**
 * Get the current user
 */
export function getCurrentUser() {
    return currentUser
}

/**
 * Toggle between users
 */
export function toggleUser() {
    currentUser = currentUser.id === USERS.donna.id ? USERS.audrey : USERS.donna
}

/**
 * Set a specific user
 */
export function setUser(userId) {
    const user = Object.values(USERS).find(u => u.id === userId)
    if (user) {
        currentUser = user
    }
}

/**
 * Check if current user has permission(s)
 * Supports both simple permission check and structured permission objects
 */
export function checkPermissions(user, permissionSpec) {
    if (!user || !user.permissions) {
        return false
    }

    // If it's a simple string, check directly
    if (typeof permissionSpec === 'string') {
        return user.permissions.includes(permissionSpec)
    }

    // Handle structured permission objects
    if (permissionSpec.any) {
        // User needs at least one of these permissions
        return permissionSpec.any.some(p => user.permissions.includes(p))
    }

    if (permissionSpec.all) {
        // User needs all of these permissions
        return permissionSpec.all.every(p => user.permissions.includes(p))
    }

    return false
}

/**
 * Reactive getter for current user
 */
export function user() {
    return currentUser
}
