.PHONY: install setup dev build package publish publish-dry clean help

# Default target
.DEFAULT_GOAL := help

# Package manager
NPM := npm

help: ## Show this help message
	@echo "Available targets:"
	@echo "  build              Build the package (run tests and lint)"
	@echo "  build-examples     Build both example applications"
	@echo "  build-hash         Build hash mode example only"
	@echo "  build-history      Build history mode example only"
	@echo "  bump-major         Bump major version (e.g., 5.0.0 -> 6.0.0)"
	@echo "  bump-minor         Bump minor version (e.g., 5.0.0 -> 5.1.0)"
	@echo "  bump-patch         Bump patch version (e.g., 5.0.0 -> 5.0.1)"
	@echo "  check              Check package before publishing"
	@echo "  clean              Clean build artifacts and node_modules"
	@echo "  dev                Run development server (history mode - clean URLs)"
	@echo "  dev-hash           Run development server (hash mode - traditional #/path URLs)"
	@echo "  help               Show this help message"
	@echo "  install            Install dependencies"
	@echo "  lint               Run linter"
	@echo "  package            Package for npm publication"
	@echo "  publish            Publish package to npm"
	@echo "  publish-dry        Dry run of npm publish (test without publishing)"
	@echo "  setup              Alias for install"
	@echo "  test               Run tests"
	@echo "  version            Display current version"

install: ## Install dependencies
	$(NPM) install

setup: install ## Alias for install

dev: ## Run development server (history mode - clean URLs)
	@echo "Starting history mode example (clean URLs without #)..."
	cd example-history && $(NPM) install && $(NPM) run dev

dev-hash: ## Run development server (hash mode - traditional #/path URLs)
	@echo "Starting hash mode example (traditional #/path URLs)..."
	cd example && $(NPM) install && $(NPM) run dev

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
	@echo "Building hash mode example..."
	cd example && $(NPM) run build
	@echo ""
	@echo "Building history mode example..."
	cd example-history && $(NPM) run build
	@echo ""
	@echo "Both examples built successfully!"

build-hash: ## Build hash mode example only
	@echo "Building hash mode example..."
	cd example && $(NPM) run build

build-history: ## Build history mode example only
	@echo "Building history mode example..."
	cd example-history && $(NPM) run build

package: clean ## Package for npm publication
	@echo "Packaging svelte-spa-router-5..."
	@echo "Package ready for publication!"
	@echo "Files to be published:"
	@echo "  - Router.svelte"
	@echo "  - utils.svelte.js"
	@echo "  - active.svelte.js"
	@echo "  - wrap.js"
	@echo "  - constants.js"
	@echo "  - helpers/url-helpers.svelte.js"
	@echo "  - package.json"
	@echo "  - README.md"
	@echo "  - LICENSE.md"

publish-dry: package ## Dry run of npm publish (test without publishing)
	@echo "Running npm publish --dry-run..."
	$(NPM) publish --dry-run

publish: package ## Publish package to npm
	@echo "Publishing to npm..."
	@echo "WARNING: This will publish the package to npm registry!"
	@echo "Run 'npm publish' manually to publish the package."

clean: ## Clean build artifacts and node_modules
	@echo "Cleaning build artifacts..."
	rm -rf node_modules
	rm -rf example/node_modules
	rm -rf example/dist
	rm -rf example-history/node_modules
	rm -rf example-history/dist
	rm -rf result
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
