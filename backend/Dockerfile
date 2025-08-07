# Simple Python Dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Ensure the cloudsql directory exists for socket connections
RUN mkdir -p /cloudsql

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8000

# Create startup script with better logging
RUN echo '#!/bin/sh\necho "Starting application on port ${PORT:-8000}"\necho "Environment variables:"\nenv | grep -E "(PORT|DB_URI)" || echo "No relevant env vars found"\nexec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info' > /app/start.sh && \
    chmod +x /app/start.sh

# Use startup script
CMD ["/app/start.sh"]
