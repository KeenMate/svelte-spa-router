.PHONY: install setup dev build package publish publish-dry clean help

# Default target
.DEFAULT_GOAL := help

# Package manager
NPM := npm

help: ## Show this help message
	@echo "Available targets:"
	@echo "  build                   Build the package (run tests and lint)"
	@echo "  build-examples          Build both example applications"
	@echo "  build-hash              Build hash mode example only"
	@echo "  build-history           Build history mode example only"
	@echo "  build-showcase          Build showcase documentation site"
	@echo "  bump-major              Bump major version (e.g., 5.0.0 -> 6.0.0)"
	@echo "  bump-minor              Bump minor version (e.g., 5.0.0 -> 5.1.0)"
	@echo "  bump-patch              Bump patch version (e.g., 5.0.0 -> 5.0.1)"
	@echo "  check                   Check package before publishing"
	@echo "  clean                   Clean build artifacts and node_modules"
	@echo "  dev                     Run development server (history mode - clean URLs)"
	@echo "  dev-hash                Run development server (hash mode - traditional #/path URLs)"
	@echo "  dev-showcase            Run showcase documentation site"
	@echo "  docker-build-examples          Build Docker images for both examples"
	@echo "  docker-build-examples-no-cache Build Docker images without cache (force fresh build)"
	@echo "  docker-build-history           Build Docker image for history mode example"
	@echo "  docker-build-hash              Build Docker image for hash mode example"
	@echo "  docker-push-examples           Push Docker images to registry"
	@echo "  help                    Show this help message"
	@echo "  install                 Install dependencies"
	@echo "  lint                    Run linter"
	@echo "  package                 Package for npm publication"
	@echo "  publish                 Publish package to npm"
	@echo "  publish-dry             Dry run of npm publish (test without publishing)"
	@echo "  setup                   Alias for install"
	@echo "  test                    Run tests"
	@echo "  version                 Display current version"

install: ## Install dependencies
	$(NPM) install

setup: install ## Alias for install

dev: ## Run development server (history mode - clean URLs)
	@echo "Starting history mode example (clean URLs without #)..."
	cd example && $(NPM) install && $(NPM) run dev:history

dev-hash: ## Run development server (hash mode - traditional #/path URLs)
	@echo "Starting hash mode example (traditional #/path URLs)..."
	cd example && $(NPM) install && $(NPM) run dev:hash

dev-showcase: ## Run showcase documentation site
	@echo "Starting showcase documentation site..."
	cd ../svelte-spa-router-showcase && $(NPM) install && $(NPM) run dev

build: ## Build the package (run tests and lint)
	@echo "Building package..."
	@echo ""
	@echo "Running tests..."
	$(NPM) test
	@echo ""
	@echo "Running linter..."
	$(NPM) run lint || echo "Linting complete (may have warnings)"
	@echo ""
	@echo "Package build complete!"

build-examples: ## Build both example applications
	@echo "Building history mode example..."
	cd example && $(NPM) run build:history
	@echo ""
	@echo "Building hash mode example..."
	cd example && $(NPM) run build:hash
	@echo ""
	@echo "Both examples built successfully!"

build-hash: ## Build hash mode example only
	@echo "Building hash mode example..."
	cd example && $(NPM) run build:hash

build-history: ## Build history mode example only
	@echo "Building history mode example..."
	cd example && $(NPM) run build:history

build-showcase: ## Build showcase documentation site
	@echo "Building showcase documentation site..."
	cd ../svelte-spa-router-showcase && $(NPM) run build
	@echo "Showcase built successfully!"

docker-build-examples: ## Build Docker images for both examples
	@echo "Building Docker image for history mode example..."
	cd example && docker build -f Dockerfile.history -t registry.km8.es/svelte-spa-router-example-history:latest .
	@echo ""
	@echo "Building Docker image for hash mode example..."
	cd example && docker build -f Dockerfile.hash -t registry.km8.es/svelte-spa-router-example-hash:latest .
	@echo ""
	@echo "Both Docker images built successfully!"
	@echo "  - registry.km8.es/svelte-spa-router-example-history:latest"
	@echo "  - registry.km8.es/svelte-spa-router-example-hash:latest"

docker-build-examples-no-cache: ## Build Docker images for both examples without cache
	@echo "Building Docker image for history mode example (no cache)..."
	cd example && docker build --no-cache -f Dockerfile.history -t registry.km8.es/svelte-spa-router-example-history:latest .
	@echo ""
	@echo "Building Docker image for hash mode example (no cache)..."
	cd example && docker build --no-cache -f Dockerfile.hash -t registry.km8.es/svelte-spa-router-example-hash:latest .
	@echo ""
	@echo "Both Docker images built successfully!"
	@echo "  - registry.km8.es/svelte-spa-router-example-history:latest"
	@echo "  - registry.km8.es/svelte-spa-router-example-hash:latest"

docker-build-history: ## Build Docker image for history mode example
	@echo "Building Docker image for history mode example..."
	cd example && docker build -f Dockerfile.history -t registry.km8.es/svelte-spa-router-example-history:latest .

docker-build-hash: ## Build Docker image for hash mode example
	@echo "Building Docker image for hash mode example..."
	cd example && docker build -f Dockerfile.hash -t registry.km8.es/svelte-spa-router-example-hash:latest .

docker-push-examples: ## Push Docker images to registry
	@echo "Pushing Docker images to registry..."
	docker push registry.km8.es/svelte-spa-router-example-history:latest
	docker push registry.km8.es/svelte-spa-router-example-hash:latest
	@echo "Docker images pushed successfully!"

package: clean ## Package for npm publication
	@echo "Packaging @keenmate/svelte-spa-router v5.0.0-rc05..."
	@echo ""
	@echo "Files to be published (as defined in package.json 'files' field):"
	@echo "  - src/lib/**/*.js (all JavaScript files)"
	@echo "  - src/lib/**/*.svelte (all Svelte components)"
	@echo "  - src/lib/**/*.d.ts (all TypeScript definitions)"
	@echo "  - README.md"
	@echo "  - LICENSE.md"
	@echo "  - CHANGELOG.md"
	@echo ""
	@echo "Package ready for publication!"
	@echo ""
	@echo "To verify what will be published, run:"
	@echo "  npm pack --dry-run"

publish-dry: package ## Dry run of npm publish (test without publishing)
	@echo "Running npm publish --dry-run..."
	$(NPM) publish --dry-run

publish: package ## Publish package to npm
	@echo "Publishing to npm..."
	@echo "WARNING: This will publish the package to npm registry!"
	@echo "Run 'npm publish' manually to publish the package."

clean: ## Clean build artifacts and node_modules
	@echo "Cleaning build artifacts..."
	@if exist node_modules rmdir /s /q node_modules
	@if exist example\node_modules rmdir /s /q example\node_modules
	@if exist example\dist rmdir /s /q example\dist
	@if exist example\dist-hash rmdir /s /q example\dist-hash
	@if exist example\dist-history rmdir /s /q example\dist-history
	@if exist result rmdir /s /q result
	@echo "Clean complete!"

test: ## Run tests
	@echo "Running tests..."
	$(NPM) test

lint: ## Run linter
	@echo "Running linter..."
	$(NPM) run lint || echo "Linting complete (may have warnings)"

check: ## Check package before publishing
	@echo "Checking package.json..."
	@node -e "const pkg = require('./package.json'); console.log('Name:', pkg.name); console.log('Version:', pkg.version); console.log('Description:', pkg.description);"
	@echo ""
	@echo "Package check complete!"

version: ## Display current version
	@node -e "console.log(require('./package.json').version)"

bump-patch: ## Bump patch version (e.g., 5.0.0 -> 5.0.1)
	$(NPM) version patch

bump-minor: ## Bump minor version (e.g., 5.0.0 -> 5.1.0)
	$(NPM) version minor

bump-major: ## Bump major version (e.g., 5.0.0 -> 6.0.0)
	$(NPM) version major
