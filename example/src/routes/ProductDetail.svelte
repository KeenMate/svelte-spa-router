<script>
import { onMount } from 'svelte'
import { updateRouteMetadata } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import PageWrapper from '../components/PageWrapper.svelte'
import Breadcrumbs from '../components/Breadcrumbs.svelte'

let { routeParams } = $props()

let product = $state(null)
let loading = $state(true)
let error = $state(null)

// Simulate fetching product data from server
async function fetchProduct(id) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200))

  // Simulate different products
  const products = {
    '1': {
      id: 1,
      name: 'iPhone 15 Pro',
      category: 'Electronics',
      price: '$999',
      stock: 'In Stock',
      description: 'Latest flagship smartphone with advanced camera system and A17 Pro chip.'
    },
    '2': {
      id: 2,
      name: 'MacBook Pro 16"',
      category: 'Computers',
      price: '$2,499',
      stock: 'In Stock',
      description: 'Powerful laptop for professionals with M3 Max chip and stunning Liquid Retina XDR display.'
    },
    '3': {
      id: 3,
      name: 'AirPods Pro',
      category: 'Audio',
      price: '$249',
      stock: 'Low Stock',
      description: 'Premium wireless earbuds with active noise cancellation and spatial audio.'
    }
  }

  return products[id] || null
}

onMount(async () => {
  try {
    loading = true
    error = null

    // Fetch the product data
    const data = await fetchProduct(routeParams.id)

    if (!data) {
      throw new Error('Product not found')
    }

    product = data

    // Update metadata with real data (this changes the title and breadcrumbs)
    updateRouteMetadata({
      title: data.name,
      breadcrumbs: [
        { label: 'Home', path: '/' },
        { label: 'Products', path: '/metadata-demo' },
        { label: data.name }
      ]
    })

    loading = false
  } catch (err) {
    error = err.message
    loading = false
  }
})
</script>

<PageWrapper>
  <Breadcrumbs />

  <div class="product-detail">
    {#if loading}
      <!-- Component manages its own loading state -->
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading product...</p>
      </div>
    {:else if error}
      <div class="alert alert-danger">
        <strong>Error:</strong> {error}
      </div>
    {:else if product}
      <div class="product-card">
        <h2>{product.name}</h2>

        <div class="product-info">
          <div class="info-row">
            <span class="label">Category:</span>
            <span class="value">{product.category}</span>
          </div>
          <div class="info-row">
            <span class="label">Price:</span>
            <span class="value">{product.price}</span>
          </div>
          <div class="info-row">
            <span class="label">Availability:</span>
            <span class="value">{product.stock}</span>
          </div>
          <div class="info-row">
            <span class="label">ID:</span>
            <span class="value">{product.id}</span>
          </div>
          <div class="info-row">
            <span class="label">Description:</span>
            <span class="value">{product.description}</span>
          </div>
        </div>

        <div class="info-box">
          <h3>Pattern 2: Component-Managed Loading</h3>
          <p>
            This route uses the default behavior (no <code>shouldDisplayLoadingOnRouteLoad</code> flag).
            The component manages its own loading state internally with custom UI.
          </p>
          <p>
            Notice how the browser tab title changed from generic "Product Detail" to the actual product name
            <strong>"{product.name}"</strong> after data loaded.
          </p>
          <p>
            This pattern gives you complete control over loading UI, including custom spinners,
            skeleton screens, or partial content rendering. The component shows immediately (not hidden during loading).
          </p>
        </div>
      </div>
    {/if}
  </div>
</PageWrapper>

<style>
.product-detail {
  max-width: 800px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 1.125rem;
  margin: 0;
}

.product-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.product-card h2 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.75rem;
}

.product-card h3 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1.25rem;
}

.product-info {
  background: #f9fafb;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 600;
  color: #6b7280;
  min-width: 120px;
}

.info-row .value {
  color: #111827;
  flex: 1;
}

.info-box {
  background: #f0fdf4;
  border-left: 4px solid #10b981;
  padding: 1.5rem;
  border-radius: 4px;
}

.info-box h3 {
  margin-top: 0;
  color: #065f46;
}

.info-box p {
  margin: 0 0 0.75rem 0;
  color: #065f46;
  line-height: 1.6;
}

.info-box p:last-child {
  margin-bottom: 0;
}

.alert {
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.alert-danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

code {
  background: #dcfce7;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.875em;
  color: #065f46;
}
</style>
