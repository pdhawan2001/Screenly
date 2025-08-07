FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build arguments for environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Production stage - Simple nginx with default config
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Create startup script that configures nginx and starts it
COPY <<'EOF' /usr/local/bin/start-nginx.sh
#!/bin/sh
set -e

# Get port from environment variable, default to 8080
PORT=${PORT:-8080}

# Create nginx configuration
cat > /etc/nginx/conf.d/default.conf <<EOL
server {
    listen ${PORT};
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    location /health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOL

# Start nginx
exec nginx -g "daemon off;"
EOF

# Make script executable
RUN chmod +x /usr/local/bin/start-nginx.sh

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start nginx with our script
CMD ["/usr/local/bin/start-nginx.sh"]
