# ==============================================================================
# Multi-stage Dockerfile: Smartbin Dispatch & Route Optimization Microservice
# Branch: dev-congnghip | Port: 3007
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build SPA
COPY . .
RUN npm run build

# ------------------------------------------------------------------------------
# Production Web Server with Nginx Alpine
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

LABEL maintainer="Smartbin Team <chinhan@smartbin.gov.vn>"
LABEL service="smartbin-dispatch-service"
LABEL description="Smartbin Dispatch & Route Optimization Microservice"
LABEL version="1.0.0"

# Remove default assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA assets from build/
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/health || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
