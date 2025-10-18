<div class="loading-container">
  <div class="spinner"></div>
  <p>Loading...</p>
</div>

<style>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #f3f4f6;
  border-top-color: #ff3e00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  color: #6b7280;
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
}
</style>
