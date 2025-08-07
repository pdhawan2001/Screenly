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

# Change ownership and permissions
RUN chown -R appuser:appuser /app /cloudsql

EXPOSE 8000

# Create startup script with extensive debugging
RUN echo '#!/bin/sh\n\
echo "=== CONTAINER STARTUP DEBUG ==="\n\
echo "Current time: $(date)"\n\
echo "Current user: $(whoami)"\n\
echo "Current directory: $(pwd)"\n\
echo "Directory contents:"\n\
ls -la\n\
echo "Port from environment: ${PORT:-8000}"\n\
echo "Python version: $(python --version)"\n\
echo "Checking if main.py exists:"\n\
ls -la main.py || echo "main.py NOT FOUND!"\n\
echo "Checking FastAPI import:"\n\
python -c "import fastapi; print(f\"FastAPI version: {fastapi.__version__}\")" || echo "FastAPI import failed!"\n\
echo "Checking main app import:"\n\
python -c "from main import app; print(\"App imported successfully\")" || echo "App import failed!"\n\
echo "Starting uvicorn server..."\n\
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level debug\n\
' > /app/start.sh && chmod +x /app/start.sh

# Switch to non-root user
USER appuser

# Use startup script
CMD ["/app/start.sh"]