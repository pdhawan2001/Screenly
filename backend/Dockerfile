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

# Port will be set dynamically by Cloud Run via PORT environment variable

# Create startup script with debugging
RUN echo '#!/bin/sh\n\
echo "Starting application..."\n\
echo "PORT environment variable: $PORT"\n\
FINAL_PORT=${PORT:-8000}\n\
echo "Using port: $FINAL_PORT"\n\
exec uvicorn main:app --host 0.0.0.0 --port $FINAL_PORT' > /app/start.sh && \
    chmod +x /app/start.sh

# Use startup script
CMD ["/app/start.sh"]
