FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only the requirements file first
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application
COPY backend .

# Create a shell script to run the application
RUN echo '#!/bin/sh\n\
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"' > /app/start.sh && \
    chmod +x /app/start.sh

# Command to run the application
ENTRYPOINT ["/app/start.sh"]
