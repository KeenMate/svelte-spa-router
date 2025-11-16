<script>
import { showLoading, hideLoading } from '@keenmate/svelte-spa-router/helpers/route-metadata'
import { link } from '@keenmate/svelte-spa-router'
import PageWrapper from '../components/PageWrapper.svelte'

let isLoading = $state(false)

function handleManualLoading() {
  if (isLoading) return

  isLoading = true
  showLoading()

  // Simulate async operation (e.g., form submission, data refresh)
  setTimeout(() => {
    hideLoading()
    isLoading = false
  }, 2000)
}
</script>

<PageWrapper>
  <div class="loading-demo">
    <h1>Manual Loading Control Demo</h1>

    <p class="intro">
      The <code>showLoading()</code> and <code>hideLoading()</code> functions allow you to
      manually control the global loading screen outside of navigation scenarios.
    </p>

    <section class="demo-section">
      <h2>Use Cases</h2>
      <ul>
        <li><strong>Form Submissions</strong> - Show loading while submitting data to the server</li>
        <li><strong>Data Refetching</strong> - Display loading when refreshing page data</li>
        <li><strong>Bulk Operations</strong> - Indicate progress during batch processing</li>
        <li><strong>File Uploads</strong> - Show loading state during file upload</li>
      </ul>
    </section>

    <section class="demo-section interactive">
      <h2>Interactive Demo</h2>
      <p>Click the button below to manually trigger the loading screen for 2 seconds:</p>

      <button
        onclick={handleManualLoading}
        disabled={isLoading}
        class="demo-button"
      >
        {isLoading ? 'Loading...' : 'Trigger Manual Loading'}
      </button>

      <div class="info-box">
        <h3>What's happening?</h3>
        <ol>
          <li>Button calls <code>showLoading()</code></li>
          <li>Global loading screen appears (same as navigation loading)</li>
          <li>Simulated async operation runs for 2 seconds</li>
          <li>Operation completes and calls <code>hideLoading()</code></li>
          <li>Loading screen disappears</li>
        </ol>
      </div>
    </section>

    <section class="code-section">
      <h2>Code Example</h2>
      <pre><code>&lt;script&gt;
import &#123; showLoading, hideLoading &#125; from '@keenmate/svelte-spa-router/helpers/route-metadata'

async function handleFormSubmit() &#123;
  // Show loading screen
  showLoading()

  try &#123;
    // Perform async operation
    await submitForm(formData)

    // Navigate or update UI
    push('/success')
  &#125; catch (error) &#123;
    // Handle error
    console.error(error)
  &#125; finally &#123;
    // Always hide loading screen
    hideLoading()
  &#125;
&#125;
&lt;/script&gt;

&lt;button onclick=&#123;handleFormSubmit&#125;&gt;
  Submit Form
&lt;/button&gt;</code></pre>
    </section>

    <section class="code-section">
      <h2>Data Refetch Example</h2>
      <pre><code>&lt;script&gt;
import &#123; showLoading, hideLoading &#125; from '@keenmate/svelte-spa-router/helpers/route-metadata'

let data = $state([])

async function refetchData() &#123;
  showLoading()

  try &#123;
    const response = await fetch('/api/data')
    data = await response.json()
  &#125; finally &#123;
    hideLoading()
  &#125;
&#125;
&lt;/script&gt;

&lt;button onclick=&#123;refetchData&#125;&gt;
  Refresh Data
&lt;/button&gt;</code></pre>
    </section>
  </div>
</PageWrapper>
