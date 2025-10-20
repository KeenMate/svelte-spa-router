<script>
let { params = {} } = $props()

// Simulate some dynamic stats
let views = $state((parseInt(params.productId) || 0) * 137 + 1234)
let inStock = $state((parseInt(params.productId) || 0) % 3 !== 0)
let rating = $state(4.5 - (parseInt(params.productId) || 0) % 2 * 0.3)
</script>

<div class="zone-panel">
    <h3>Quick Stats</h3>

    <div class="stat-card">
        <div class="stat-label">Views</div>
        <div class="stat-value">{views.toLocaleString()}</div>
    </div>

    <div class="stat-card">
        <div class="stat-label">Rating</div>
        <div class="stat-value">{rating.toFixed(1)} ⭐</div>
    </div>

    <div class="stat-card">
        <div class="stat-label">Availability</div>
        <div class="stat-value {inStock ? 'in-stock' : 'out-stock'}">
            {inStock ? 'In Stock' : 'Out of Stock'}
        </div>
    </div>

    <div class="stat-card">
        <div class="stat-label">Shipping</div>
        <div class="stat-value">2-3 days</div>
    </div>

    <button class="add-to-cart">Add to Cart</button>
    <button class="wishlist">Add to Wishlist</button>
</div>

<style>
.zone-panel {
    padding: 1rem;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

.zone-panel h3 {
    margin-top: 0;
    color: #333;
    font-size: 1.1rem;
}

.stat-card {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f9f9f9;
    border-radius: 6px;
}

.stat-label {
    font-size: 0.8rem;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1a1a1a;
}

.stat-value.in-stock {
    color: #28a745;
}

.stat-value.out-stock {
    color: #dc3545;
}

button {
    width: 100%;
    padding: 0.75rem;
    margin-top: 0.5rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.add-to-cart {
    background: #0066cc;
    color: white;
}

.add-to-cart:hover {
    background: #0052a3;
}

.wishlist {
    background: #fff;
    color: #0066cc;
    border: 2px solid #0066cc;
}

.wishlist:hover {
    background: #f0f7ff;
}
</style>
