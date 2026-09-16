# ==============================================================================
# Multi-stage Dockerfile: Smartbin Central Web Application Microservice
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Production Bundle with Node.js
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies layer
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Web Server with Nginx Alpine
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

LABEL maintainer="Smartbin Team <chinhan@smartbin.gov.vn>"
LABEL service="smartbin-web-app"
LABEL description="Smartbin Central Management & Telemetry Web Microservice"
LABEL version="2.5.0"

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
