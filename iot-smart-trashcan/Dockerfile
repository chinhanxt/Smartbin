# ==============================================================================
# Multi-stage Dockerfile: IoT Smart Trash Can 3D Microservice
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Production Assets with Node.js
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (leverages Docker layer cache)
COPY package*.json ./
RUN npm ci

# Copy project files and 3D models
COPY . .

# Compile and optimize production bundle into /app/dist
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Web Server with Nginx Alpine
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

LABEL maintainer="chinhan"
LABEL description="3D IoT Smart Trash Can Web Microservice"

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration with CORS, GZIP, and GLTF MIME types
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check to monitor container status in production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
