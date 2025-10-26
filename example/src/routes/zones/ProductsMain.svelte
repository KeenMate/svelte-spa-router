<script>
let { routeParams = {} } = $props()

const products = [
    { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 79.99, stock: 45 },
    { id: 2, name: 'Smart Watch', category: 'Electronics', price: 199.99, stock: 23 },
    { id: 3, name: 'Running Shoes', category: 'Sports', price: 89.99, stock: 67 },
    { id: 4, name: 'Coffee Maker', category: 'Home & Garden', price: 129.99, stock: 12 },
    { id: 5, name: 'Laptop Backpack', category: 'Electronics', price: 49.99, stock: 89 },
]
</script>

<div class="zone-main">
    <div class="header">
        <h2>Product Catalog</h2>
        <div class="search-bar">
            <input type="search" placeholder="Search products..." />
        </div>
    </div>

    <div class="content">
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each products as product}
                <tr>
                    <td>#{product.id}</td>
                    <td><strong>{product.name}</strong></td>
                    <td><span class="badge">{product.category}</span></td>
                    <td class="price">${product.price}</td>
                    <td class="stock">{product.stock} units</td>
                    <td>
                        <button class="btn-small">Edit</button>
                        <button class="btn-small btn-danger">Delete</button>
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

.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: #e7f3ff;
    color: #0066cc;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
}

.price {
    color: #28a745;
    font-weight: 600;
}

.stock {
    color: #6c757d;
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
