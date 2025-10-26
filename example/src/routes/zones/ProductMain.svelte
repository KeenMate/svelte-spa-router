<script>
let { routeParams = {} } = $props()
</script>

<div class="zone-main">
    <h2>Product Details</h2>
    <div class="product-info">
        <p><strong>Product ID:</strong> {routeParams.productId || 'N/A'}</p>
        <p><strong>Name:</strong> Premium Widget {routeParams.productId}</p>
        <p><strong>Price:</strong> ${(parseInt(routeParams.productId) || 0) * 10 + 99}.99</p>
    </div>

    <div class="description">
        <h3>Description</h3>
        <p>
            This is a high-quality product designed for maximum efficiency and durability.
            Perfect for both professional and personal use.
        </p>
        <p>
            Features include advanced technology, premium materials, and a sleek design
            that fits seamlessly into any environment.
        </p>
    </div>

    <div class="specs">
        <h3>Specifications</h3>
        <ul>
            <li>Dimensions: 10 x 5 x 3 inches</li>
            <li>Weight: 2.5 lbs</li>
            <li>Material: Aluminum alloy</li>
            <li>Color: Space Gray</li>
            <li>Warranty: 2 years</li>
        </ul>
    </div>
</div>

<style>
.zone-main {
    padding: 1.5rem;
}

.zone-main h2 {
    margin-top: 0;
    color: #1a1a1a;
}

.product-info {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
}

.product-info p {
    margin: 0.5rem 0;
}

.description, .specs {
    margin-bottom: 1.5rem;
}

.description h3, .specs h3 {
    color: #333;
    border-bottom: 2px solid #0066cc;
    padding-bottom: 0.5rem;
}

.specs ul {
    list-style: none;
    padding: 0;
}

.specs li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
}

.specs li:last-child {
    border-bottom: none;
}
</style>
