<script>
let { params = {} } = $props()
</script>

<div class="zone-toolbar">
    <h3>User Tools</h3>

    <div class="tool-section">
        <h4>Quick Actions</h4>
        <button class="tool-btn">
            <span class="icon">👥</span>
            Bulk Import
        </button>
        <button class="tool-btn">
            <span class="icon">📧</span>
            Send Invites
        </button>
        <button class="tool-btn">
            <span class="icon">🔐</span>
            Manage Permissions
        </button>
    </div>

    <div class="tool-section">
        <h4>Statistics</h4>
        <div class="stat">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">1,248</div>
        </div>
        <div class="stat">
            <div class="stat-label">Active Today</div>
            <div class="stat-value active">342</div>
        </div>
        <div class="stat">
            <div class="stat-label">Pending</div>
            <div class="stat-value warning">15</div>
        </div>
    </div>

    <div class="tool-section">
        <h4>Filters</h4>
        <select class="filter-select">
            <option>All Roles</option>
            <option>Administrators</option>
            <option>Editors</option>
            <option>Customers</option>
        </select>
        <select class="filter-select">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Inactive</option>
        </select>
    </div>
</div>

<style>
.zone-toolbar {
    padding: 1.5rem;
    background: white;
    border-left: 1px solid #e0e0e0;
    height: 100%;
    overflow-y: auto;
}

.zone-toolbar h3 {
    margin: 0 0 1.5rem 0;
    color: #1a1a1a;
    font-size: 1.1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #7c3aed;
}

.tool-section {
    margin-bottom: 2rem;
}

.tool-section h4 {
    margin: 0 0 0.75rem 0;
    color: #495057;
    font-size: 0.9rem;
    text-transform: uppercase;
    font-weight: 600;
}

.tool-btn {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.tool-btn:hover {
    background: #e9ecef;
    border-color: #7c3aed;
}

.tool-btn .icon {
    font-size: 1.2rem;
}

.stat {
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-size: 0.8rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #7c3aed;
}

.stat-value.active {
    color: #28a745;
}

.stat-value.warning {
    color: #ffc107;
}

.filter-select {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background: white;
    cursor: pointer;
}

.filter-select:focus {
    outline: none;
    border-color: #7c3aed;
}
</style>
