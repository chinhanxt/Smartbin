# Multi-stage Dockerfile for SmartBin HRM & Fleet Management Microservice
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build static SPA
COPY . .
RUN npm run build

# Production Nginx runtime
FROM nginx:alpine
LABEL maintainer="SmartBin Team <tech@smartbin.gov.vn>"
LABEL service="smartbin-hrm-service"
LABEL version="1.0.0"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

STOPSIGNAL SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
