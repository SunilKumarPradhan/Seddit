# Build stage - Node.js with Alpine for smaller size
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies with cache mount (Docker BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production=false

# Copy source code
COPY . .

# Build with production config
RUN npm run build -- --configuration=production

# Production stage - Nginx Alpine
FROM nginx:1.25-alpine

# Copy built app
COPY --from=builder /app/dist/frontend/browser/ /usr/share/nginx/html/

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check (optional but good)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]