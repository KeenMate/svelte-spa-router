<script>
let { params = {} } = $props()

const orders = [
    { id: 'ORD-1001', customer: 'John Doe', date: '2024-01-15', total: 299.99, status: 'Delivered', items: 3 },
    { id: 'ORD-1002', customer: 'Jane Smith', date: '2024-01-16', total: 149.50, status: 'Shipped', items: 2 },
    { id: 'ORD-1003', customer: 'Bob Johnson', date: '2024-01-17', total: 599.99, status: 'Processing', items: 5 },
    { id: 'ORD-1004', customer: 'Alice Williams', date: '2024-01-17', total: 89.99, status: 'Pending', items: 1 },
    { id: 'ORD-1005', customer: 'Charlie Brown', date: '2024-01-18', total: 199.99, status: 'Cancelled', items: 2 },
]

function getStatusClass(status) {
    if (status === 'Delivered') return 'status-delivered'
    if (status === 'Shipped') return 'status-shipped'
    if (status === 'Processing') return 'status-processing'
    if (status === 'Pending') return 'status-pending'
    if (status === 'Cancelled') return 'status-cancelled'
    return 'status-default'
}
</script>

<div class="zone-main">
    <div class="header">
        <h2>Order Management</h2>
        <div class="search-bar">
            <input type="search" placeholder="Search orders by ID or customer..." />
        </div>
    </div>

    <div class="content">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each orders as order}
                <tr>
                    <td><strong>{order.id}</strong></td>
                    <td>{order.customer}</td>
                    <td class="date">{order.date}</td>
                    <td class="items">{order.items} items</td>
                    <td class="total">${order.total}</td>
                    <td><span class="status {getStatusClass(order.status)}">{order.status}</span></td>
                    <td>
                        <button class="btn-small">View</button>
                        <button class="btn-small btn-primary">Track</button>
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

.date {
    color: #6c757d;
    font-size: 0.9rem;
}

.items {
    color: #6c757d;
}

.total {
    color: #28a745;
    font-weight: 600;
    font-size: 1.1rem;
}

.status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-delivered {
    background: #d4edda;
    color: #155724;
}

.status-shipped {
    background: #cfe2ff;
    color: #084298;
}

.status-processing {
    background: #fff3cd;
    color: #856404;
}

.status-pending {
    background: #e7e7e7;
    color: #495057;
}

.status-cancelled {
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

.btn-primary {
    border-color: #f97316;
    color: #f97316;
}

.btn-primary:hover {
    background: #f97316;
    color: white;
}
</style>
