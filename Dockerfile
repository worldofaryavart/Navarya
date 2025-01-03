FROM ubuntu:20.04

# Prevent timezone prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3.9 \
    python3-pip \
    python3.9-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic links for python and pip
RUN ln -s /usr/bin/python3.9 /usr/bin/python \
    && ln -s /usr/bin/pip3 /usr/bin/pip

# Set working directory
WORKDIR /app

# Copy only the requirements file first
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application
COPY backend .

# Create a shell script to run the application
RUN echo '#!/bin/bash\npython -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"' > start.sh \
    && chmod +x start.sh

# Command to run the application
CMD ["./start.sh"]
