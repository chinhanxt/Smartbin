# ==============================================================================
# Multi-stage Dockerfile: Smartbin Mobile GPS Tracker Microservice
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Production Assets with Node.js
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source code and compile
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Web Server with Nginx Alpine
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

LABEL maintainer="Smartbin Team <chinhan@smartbin.gov.vn>"
LABEL service="smartbin-mobile-tracker"
LABEL description="Smartbin Mobile Driver GPS & SOS Telemetry Microservice"
LABEL version="1.0.0"

# Remove default assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
