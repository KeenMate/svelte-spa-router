<script>
let { params = {} } = $props()

const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Administrator', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Customer', status: 'Active' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'Customer', status: 'Pending' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Editor', status: 'Inactive' },
]

function getStatusClass(status) {
    if (status === 'Active') return 'status-active'
    if (status === 'Pending') return 'status-pending'
    return 'status-inactive'
}

function getRoleBadgeClass(role) {
    if (role === 'Administrator') return 'badge-admin'
    if (role === 'Editor') return 'badge-editor'
    return 'badge-customer'
}
</script>

<div class="zone-main">
    <div class="header">
        <h2>User Management</h2>
        <div class="search-bar">
            <input type="search" placeholder="Search users by name or email..." />
        </div>
    </div>

    <div class="content">
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each users as user}
                <tr>
                    <td>#{user.id}</td>
                    <td><strong>{user.name}</strong></td>
                    <td class="email">{user.email}</td>
                    <td><span class="badge {getRoleBadgeClass(user.role)}">{user.role}</span></td>
                    <td><span class="status {getStatusClass(user.status)}">{user.status}</span></td>
                    <td>
                        <button class="btn-small">Edit</button>
                        <button class="btn-small btn-danger">Deactivate</button>
                    </td>
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
.zone-main {
    padding: 2rem;
}

.header {
    margin-bottom: 2rem;
}

.header h2 {
    margin: 0 0 1rem 0;
    color: #1a1a1a;
}

.search-bar input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.data-table thead {
    background: #f8f9fa;
}

.data-table th {
    text-align: left;
    padding: 1rem;
    font-weight: 600;
    color: #495057;
    border-bottom: 2px solid #dee2e6;
}

.data-table td {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
}

.data-table tbody tr:hover {
    background: #f8f9fa;
}

.email {
    color: #6c757d;
    font-size: 0.9rem;
}

.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
}

.badge-admin {
    background: #fee;
    color: #dc3545;
}

.badge-editor {
    background: #e7f3ff;
    color: #0066cc;
}

.badge-customer {
    background: #f3e8ff;
    color: #7c3aed;
}

.status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-active {
    background: #d4edda;
    color: #155724;
}

.status-pending {
    background: #fff3cd;
    color: #856404;
}

.status-inactive {
    background: #f8d7da;
    color: #721c24;
}

.btn-small {
    padding: 0.4rem 0.8rem;
    margin-right: 0.5rem;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
}

.btn-small:hover {
    background: #f0f0f0;
}

.btn-danger {
    border-color: #dc3545;
    color: #dc3545;
}

.btn-danger:hover {
    background: #dc3545;
    color: white;
}
</style>
