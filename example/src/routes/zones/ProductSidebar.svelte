<script>
let { routeParams = {} } = $props()
</script>

<div class="zone-sidebar">
    <h3>Product Menu</h3>
    <p class="product-id">Product: {routeParams.productId || 'N/A'}</p>
    <nav>
        <ul>
            <li>Overview</li>
            <li>Specifications</li>
            <li>Reviews</li>
            <li>Related Products</li>
        </ul>
    </nav>
</div>

<style>
.zone-sidebar {
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 8px;
}

.zone-sidebar h3 {
    margin-top: 0;
    color: #333;
}

.product-id {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 1rem;
}

.zone-sidebar nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.zone-sidebar nav li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
}

.zone-sidebar nav li:hover {
    color: #0066cc;
}

.zone-sidebar nav li:last-child {
    border-bottom: none;
}
</style>
