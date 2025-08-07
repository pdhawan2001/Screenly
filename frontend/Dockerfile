FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

# Production stage - Simple nginx with default config
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Simple nginx config for React SPA
RUN echo '#!/bin/sh\n\
PORT=${PORT:-8080}\n\
cat > /etc/nginx/conf.d/default.conf << EOF\n\
server {\n\
    listen ${PORT};\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files \\$uri \\$uri/ /index.html;\n\
    }\n\
    location /health {\n\
        return 200 "healthy\\n";\n\
        add_header Content-Type text/plain;\n\
    }\n\
}\n\
EOF\n\
exec nginx -g "daemon off;"\n\
' > /start.sh && chmod +x /start.sh
# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["/start.sh"]
