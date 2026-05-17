.PHONY: install setup dev build package publish publish-dry clean help podman-run-examples-history podman-run-examples-hash podman-stop-examples

# Default target
.DEFAULT_GOAL := help

# Detect OS
ifeq ($(OS),Windows_NT)
	DETECTED_OS := Windows
else
	DETECTED_OS := $(shell uname -s)
endif

# Set shell for Windows to avoid /bin/bash issues
ifeq ($(DETECTED_OS),Windows)
	SHELL := cmd.exe
	.SHELLFLAGS := /c
endif

# Package manager
NPM := npm

# OS-specific commands
ifeq ($(DETECTED_OS),Windows)
	RM_DIR := rmdir /s /q
	RM_FILE := del /f /q
	MKDIR := mkdir
	NULL_REDIRECT := 2>nul
else
	RM_DIR := rm -rf
	RM_FILE := rm -f
	MKDIR := mkdir -p
	NULL_REDIRECT := 2>/dev/null
endif

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
	@echo "  podman-build-examples          Build Podman images (use VERSION=5.0.0-rc06 for npm version)"
	@echo "  podman-build-examples-no-cache Build Podman images without cache (use VERSION=5.0.0-rc06)"
	@echo "  podman-build-history           Build Podman image for history mode (use VERSION=5.0.0-rc06)"
	@echo "  podman-build-hash              Build Podman image for hash mode (use VERSION=5.0.0-rc06)"
	@echo "  podman-push-examples           Push Podman images to registry"
	@echo "  podman-run-examples-history    Run history mode example Podman container on port 8080"
	@echo "  podman-run-examples-hash       Run hash mode example Podman container on port 8081"
	@echo "  podman-stop-examples           Stop running example Podman containers"
	@echo "  help                    Show this help message"
	@echo "  install                 Install dependencies"
	@echo "  lint                    Run linter"
	@echo "  package                 Package for npm publication"
	@echo "  publish                 Publish package to npm (use TAG=rc for pre-releases)"
	@echo "  publish-dry             Dry run of npm publish (use TAG=rc for pre-releases)"
	@echo "  setup                   Alias for install"
	@echo "  test                    Run tests"
	@echo "  test-e2e                Run Playwright e2e tests against the example app"
	@echo "  test-e2e-install        One-time install of the chromium binary for e2e"
	@echo "  test-e2e-ui             Run Playwright in interactive UI mode"
	@echo "  version                 Display current version"
	@echo ""
	@echo "Podman Examples:"
	@echo "  make podman-build-examples                      # Use local source (file:..)"
	@echo "  make podman-build-examples VERSION=5.0.0-rc06  # Use npm version"
	@echo "  make podman-build-examples VERSION=latest      # Use latest from npm"

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
	@echo ""
	@echo "Note: This library is distributed as source files (no build step needed)"

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

podman-build-examples: ## Build Podman images for both examples (use VERSION=5.0.0-rc06 to specify npm version)
	@echo "Building Podman images for both examples..."
ifdef VERSION
	@echo "Using npm version: $(VERSION)"
else
	@echo "Using local source (file:..)"
	@echo "To use npm version, run: make podman-build-examples VERSION=5.0.0-rc06"
endif
	@echo ""
	@echo "Building Podman image for history mode example..."
	podman build -f example/Dockerfile \
		--build-arg VITE_ROUTING_MODE=history \
		$(if $(VERSION),--build-arg ROUTER_VERSION=$(VERSION),) \
		-t registry.km8.es/svelte-spa-router-example-history:latest .
	@echo ""
	@echo "Building Podman image for hash mode example..."
	podman build -f example/Dockerfile \
		--build-arg VITE_ROUTING_MODE=hash \
		$(if $(VERSION),--build-arg ROUTER_VERSION=$(VERSION),) \
		-t registry.km8.es/svelte-spa-router-example-hash:latest .
	@echo ""
	@echo "Both Podman images built successfully!"
	@echo "  - registry.km8.es/svelte-spa-router-example-history:latest"
	@echo "  - registry.km8.es/svelte-spa-router-example-hash:latest"

podman-build-examples-no-cache: ## Build Podman images without cache (use VERSION=5.0.0-rc06 to specify npm version)
	@echo "Building Podman images for both examples (no cache)..."
ifdef VERSION
	@echo "Using npm version: $(VERSION)"
else
	@echo "Using local source (file:..)"
	@echo "To use npm version, run: make podman-build-examples-no-cache VERSION=5.0.0-rc06"
endif
	@echo ""
	@echo "Building Podman image for history mode example (no cache)..."
	podman build --no-cache --progress plain -f example/Dockerfile \
		--build-arg VITE_ROUTING_MODE=history \
		$(if $(VERSION),--build-arg ROUTER_VERSION=$(VERSION),) \
		-t registry.km8.es/svelte-spa-router-example-history:latest .
	@echo ""
	@echo "Building Podman image for hash mode example (no cache)..."
	podman build --no-cache --progress plain -f example/Dockerfile \
		--build-arg VITE_ROUTING_MODE=hash \
		$(if $(VERSION),--build-arg ROUTER_VERSION=$(VERSION),) \
		-t registry.km8.es/svelte-spa-router-example-hash:latest .
	@echo ""
	@echo "Both Podman images built successfully!"
	@echo "  - registry.km8.es/svelte-spa-router-example-history:latest"
	@echo "  - registry.km8.es/svelte-spa-router-example-hash:latest"

podman-build-history: ## Build Podman image for history mode example (use VERSION=5.0.0-rc06 to specify npm version)
	@echo "Building Podman image for history mode example..."
ifdef VERSION
	@echo "Using npm version: $(VERSION)"
else
	@echo "Using local source (file:..)"
endif
	podman build -f example/Dockerfile \
		--build-arg VITE_ROUTING_MODE=history \
		$(if $(VERSION),--build-arg ROUTER_VERSION=$(VERSION),) \
		-t registry.km8.es/svelte-spa-router-example-history:latest .

podman-build-hash: ## Build Podman image for hash mode example (use VERSION=5.0.0-rc06 to specify npm version)
	@echo "Building Podman image for hash mode example..."
ifdef VERSION
	@echo "Using npm version: $(VERSION)"
else
	@echo "Using local source (file:..)"
endif
	podman build -f example/Dockerfile \
		--build-arg VITE_ROUTING_MODE=hash \
		$(if $(VERSION),--build-arg ROUTER_VERSION=$(VERSION),) \
		-t registry.km8.es/svelte-spa-router-example-hash:latest .

podman-push-examples: ## Push Podman images to registry
	@echo "Pushing Podman images to registry..."
	podman push registry.km8.es/svelte-spa-router-example-history:latest
	podman push registry.km8.es/svelte-spa-router-example-hash:latest
	@echo "Podman images pushed successfully!"

podman-run-examples-history: ## Run history mode example Podman container on port 8080
	@echo "Starting history mode example container on http://localhost:8080..."
	podman run -d --name svelte-spa-router-example-history -p 8080:80 registry.km8.es/svelte-spa-router-example-history:latest
	@echo "History mode example running at http://localhost:8080"
	@echo "To stop: make podman-stop-examples"

podman-run-examples-hash: ## Run hash mode example Podman container on port 8081
	@echo "Starting hash mode example container on http://localhost:8081..."
	podman run -d --name svelte-spa-router-example-hash -p 8081:80 registry.km8.es/svelte-spa-router-example-hash:latest
	@echo "Hash mode example running at http://localhost:8081"
	@echo "To stop: make podman-stop-examples"

podman-stop-examples: ## Stop running example Podman containers
	@echo "Stopping example containers..."
	-podman stop svelte-spa-router-example-history $(NULL_REDIRECT) || echo "History container not running"
	-podman stop svelte-spa-router-example-hash $(NULL_REDIRECT) || echo "Hash container not running"
	-podman rm svelte-spa-router-example-history $(NULL_REDIRECT) || echo "History container already removed"
	-podman rm svelte-spa-router-example-hash $(NULL_REDIRECT) || echo "Hash container already removed"
	@echo "Example containers stopped and removed"

package: build ## Package for npm publication
	@echo "Packaging @keenmate/svelte-spa-router..."
	@echo ""
	@echo "Files to be published (as defined in package.json 'files' field):"
	@echo "  - src/lib/**/*.js (all JavaScript files)"
	@echo "  - src/lib/**/*.svelte (all Svelte components)"
	@echo "  - src/lib/**/*.d.ts (all TypeScript definitions)"
	@echo "  - README.md"
	@echo "  - LICENSE.md"
	@echo "  - CHANGELOG.md"
	@echo ""
	$(NPM) pack
	@echo ""
	@echo "Package created successfully!"

publish-dry: ## Dry run of npm publish (test without publishing). Use TAG=rc for pre-releases.
	@echo "Cleaning old package files and dist folders..."
ifeq ($(DETECTED_OS),Windows)
	@if exist *.tgz del /f /q *.tgz
	@if exist dist rmdir /s /q dist
else
	@rm -f *.tgz
	@rm -rf dist
endif
	@$(MAKE) build
	@echo "Running npm publish --dry-run..."
	$(NPM) publish --dry-run $(if $(TAG),--tag $(TAG),)
	@echo ""
	@echo "Dry-run complete - Review the output above"

publish: ## Publish package to npm. Use TAG=rc for pre-releases (e.g., make publish TAG=rc)
	@echo "Cleaning old package files and dist folders..."
ifeq ($(DETECTED_OS),Windows)
	@if exist *.tgz del /f /q *.tgz
	@if exist dist rmdir /s /q dist
else
	@rm -f *.tgz
	@rm -rf dist
endif
	@echo "WARNING: This will publish the package to npm registry!"
ifdef TAG
	@echo "npm dist-tag: $(TAG)"
else
	@echo "npm dist-tag: latest (default)"
endif
ifeq ($(DETECTED_OS),Windows)
	@echo Press Ctrl+C to cancel, or any key to continue...
	@pause >nul
else
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read -r dummy
endif
	@$(MAKE) build
	@echo "Publishing to npm..."
	$(NPM) publish $(if $(TAG),--tag $(TAG),)
	@echo ""
	@echo "Package published successfully!"

clean: ## Clean build artifacts and node_modules
	@echo "Cleaning build artifacts..."
ifeq ($(DETECTED_OS),Windows)
	@if exist node_modules $(RM_DIR) node_modules
	@if exist example\node_modules $(RM_DIR) example\node_modules
	@if exist example\dist $(RM_DIR) example\dist
	@if exist example\dist-hash $(RM_DIR) example\dist-hash
	@if exist example\dist-history $(RM_DIR) example\dist-history
	@if exist result $(RM_DIR) result
else
	@$(RM_DIR) node_modules $(NULL_REDIRECT) || true
	@$(RM_DIR) example/node_modules $(NULL_REDIRECT) || true
	@$(RM_DIR) example/dist $(NULL_REDIRECT) || true
	@$(RM_DIR) example/dist-hash $(NULL_REDIRECT) || true
	@$(RM_DIR) example/dist-history $(NULL_REDIRECT) || true
	@$(RM_DIR) result $(NULL_REDIRECT) || true
endif
	@echo "Clean complete!"

test: ## Run tests
	@echo "Running tests..."
	$(NPM) test

test-e2e: ## Run Playwright end-to-end tests against the example app (history mode, port 5050)
	@echo "Running e2e tests..."
	$(NPM) run test:e2e

test-e2e-install: ## Install the chromium binary used by the e2e suite (one-time setup)
	$(NPM) run test:e2e:install

test-e2e-ui: ## Run Playwright in interactive UI mode
	$(NPM) run test:e2e:ui

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
