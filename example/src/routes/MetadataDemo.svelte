<script>
import { link } from '@keenmate/svelte-spa-router/utils'
import PageWrapper from '../components/PageWrapper.svelte'
</script>

<PageWrapper>
  <div class="metadata-demo">
    <h1>Route Metadata & Loading Patterns Demo</h1>

    <p class="intro">
      This page demonstrates the two different patterns for handling route metadata
      (title, breadcrumbs) and loading states when fetching data.
    </p>

    <!-- Pattern 1 Demo -->
    <section class="pattern-section blue">
      <h2>Pattern 1: Router-Managed Loading</h2>
      <p>
        Uses <code>shouldDisplayLoadingOnRouteLoad: true</code> flag. The router keeps the loading component visible
        until the route component calls <code>hideLoading()</code> after fetching data.
      </p>

      <div class="benefits">
        <h4>Benefits:</h4>
        <ul>
          <li>Centralized loading component (consistent across all routes)</li>
          <li>Simple component code (no loading state management)</li>
          <li>Component fetches data in <code>onMount</code>, then signals ready</li>
          <li>Perfect for simple detail pages with single data source</li>
        </ul>
      </div>

      <h4>Try it out:</h4>
      <div class="demo-links">
        <a href="/document/1" use:link class="demo-link blue-link">
          <div class="link-title">Invoice Document</div>
          <div class="link-desc">Invoice_Q4_2024.pdf</div>
        </a>
        <a href="/document/2" use:link class="demo-link blue-link">
          <div class="link-title">Contract Template</div>
          <div class="link-desc">Contract_Template.docx</div>
        </a>
        <a href="/document/3" use:link class="demo-link blue-link">
          <div class="link-title">Project Proposal</div>
          <div class="link-desc">Project_Proposal.pdf</div>
        </a>
      </div>
    </section>

    <!-- Pattern 2 Demo -->
    <section class="pattern-section green">
      <h2>Pattern 2: Component-Managed Loading</h2>
      <p>
        Default behavior (no special flag). The component manages its own loading state
        and displays custom loading UI.
      </p>

      <div class="benefits">
        <h4>Benefits:</h4>
        <ul>
          <li>Complete control over loading UI (custom spinners, skeletons)</li>
          <li>Can show partial content while loading other parts</li>
          <li>Custom loading states for different scenarios</li>
          <li>Perfect for complex pages with multiple data sources</li>
        </ul>
      </div>

      <h4>Try it out:</h4>
      <div class="demo-links">
        <a href="/product/1" use:link class="demo-link green-link">
          <div class="link-title">iPhone 15 Pro</div>
          <div class="link-desc">$999 - Electronics</div>
        </a>
        <a href="/product/2" use:link class="demo-link green-link">
          <div class="link-title">MacBook Pro 16"</div>
          <div class="link-desc">$2,499 - Computers</div>
        </a>
        <a href="/product/3" use:link class="demo-link green-link">
          <div class="link-title">AirPods Pro</div>
          <div class="link-desc">$249 - Audio</div>
        </a>
      </div>
    </section>

    <!-- Key Features -->
    <section class="features-section">
      <h2>What to Watch For</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h4>📄 Dynamic Titles</h4>
          <p>
            Watch the browser tab title change from generic
            to specific after data loads.
          </p>
        </div>
        <div class="feature-card">
          <h4>🍞 Breadcrumb Updates</h4>
          <p>
            Breadcrumbs update to show the actual item name instead of placeholder text.
          </p>
        </div>
        <div class="feature-card">
          <h4>⏳ Loading Behavior</h4>
          <p>
            Pattern 1 shows centralized loading component. Pattern 2 shows custom loading UI.
          </p>
        </div>
        <div class="feature-card">
          <h4>💻 Code Simplicity</h4>
          <p>
            Pattern 1 components are simpler (just call hideLoading()). Pattern 2 manages own state.
          </p>
        </div>
      </div>
    </section>

    <!-- Manual Loading Control -->
    <section class="manual-loading-section">
      <h2>🎮 Manual Loading Control</h2>
      <p>
        Want to show the loading screen outside of navigation? Check out the manual loading control demo!
      </p>
      <a href="/loading-demo" use:link class="big-demo-link purple-link">
        <div class="link-icon">⚡</div>
        <div class="link-content">
          <div class="link-title">Manual Loading Demo</div>
          <div class="link-desc">Learn how to use showLoading() and hideLoading()</div>
        </div>
        <div class="link-arrow">→</div>
      </a>
    </section>
  </div>
</PageWrapper>

<style>
.metadata-demo {
  max-width: 1000px;
}

.metadata-demo h1 {
  margin-bottom: 1rem;
  font-size: 2.25rem;
  color: #111827;
}

.intro {
  font-size: 1.125rem;
  color: #4b5563;
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.pattern-section {
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pattern-section.blue {
  border-left: 4px solid #3b82f6;
}

.pattern-section.green {
  border-left: 4px solid #10b981;
}

.pattern-section h2 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.75rem;
}

.pattern-section > p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.benefits {
  background: #f9fafb;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
}

.pattern-section.blue .benefits {
  background: #eff6ff;
}

.pattern-section.green .benefits {
  background: #f0fdf4;
}

.benefits h4 {
  margin: 0 0 0.75rem 0;
  color: #1f2937;
  font-size: 1rem;
}

.benefits ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #4b5563;
}

.benefits li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.benefits li:last-child {
  margin-bottom: 0;
}

.pattern-section h4 {
  margin: 1.5rem 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
}

.demo-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.demo-link {
  display: block;
  padding: 1.25rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s;
}

.demo-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.blue-link {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.blue-link:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

.green-link {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.green-link:hover {
  background: #dcfce7;
  border-color: #10b981;
}

.link-title {
  font-weight: 600;
  color: #111827;
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.link-desc {
  color: #6b7280;
  font-size: 0.875rem;
}

.features-section {
  margin-bottom: 2rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 8px;
}

.features-section h2 {
  margin: 0 0 1.5rem 0;
  color: #111827;
  font-size: 1.75rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.feature-card h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.feature-card p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

code {
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.875em;
  color: #dc2626;
}

.manual-loading-section {
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #8b5cf6;
}

.manual-loading-section h2 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.75rem;
}

.manual-loading-section > p {
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.big-demo-link {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f5f3ff;
  border: 2px solid #ddd6fe;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.big-demo-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(139, 92, 246, 0.2);
  background: #ede9fe;
  border-color: #8b5cf6;
}

.link-icon {
  font-size: 3rem;
  line-height: 1;
}

.link-content {
  flex: 1;
}

.big-demo-link .link-title {
  font-weight: 600;
  color: #5b21b6;
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.big-demo-link .link-desc {
  color: #7c3aed;
  font-size: 1rem;
}

.link-arrow {
  font-size: 2rem;
  color: #8b5cf6;
  font-weight: bold;
  transition: transform 0.2s;
}

.big-demo-link:hover .link-arrow {
  transform: translateX(0.5rem);
}
</style>
