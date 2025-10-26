# Build stage
# IMPORTANT: Node.js 22+ is required for building this application
# Node.js 20 has compatibility issues with Svelte 5 that cause runtime errors
FROM node:22-alpine AS builder

# Set build argument for routing mode (hash or history)
ARG VITE_ROUTING_MODE=hash
# Set build argument for package version (defaults to 'file:..' for local dev)
ARG ROUTER_VERSION=file:..

WORKDIR /app

# Copy package files from example directory
COPY example/package*.json ./

# If using local source, copy the router source first
RUN if [ "$ROUTER_VERSION" = "file:.." ]; then \
        mkdir -p /router-src; \
    fi

# Copy router source if building with local version
COPY src /router-src/src
COPY package.json /router-src/package.json

# Install dependencies
RUN npm install

# If ROUTER_VERSION is not 'file:..', replace the local version with npm version
RUN if [ "$ROUTER_VERSION" != "file:.." ]; then \
        npm uninstall @keenmate/svelte-spa-router && \
        npm install @keenmate/svelte-spa-router@$ROUTER_VERSION; \
    else \
        # For local version, link the copied source
        rm -rf node_modules/@keenmate/svelte-spa-router && \
        mkdir -p node_modules/@keenmate && \
        cp -r /router-src node_modules/@keenmate/svelte-spa-router; \
    fi

# Verify installed packages
RUN echo "=== Installed packages ===" && npm ls --depth=0

# Copy example source files
COPY example/. .

# Build the application with the specified routing mode
RUN npm run build:${VITE_ROUTING_MODE}

# Production stage
FROM nginx:alpine

# Copy built files to nginx (use build arg to determine output directory)
ARG VITE_ROUTING_MODE=hash
COPY --from=builder /app/dist-${VITE_ROUTING_MODE} /usr/share/nginx/html

# Copy nginx configuration for SPA routing
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
