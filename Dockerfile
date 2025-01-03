FROM python:3.9-slim

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY backend/ .

# Create start script that handles environment variables
RUN echo '#!/bin/bash\n\
# Write credentials from environment variables\n\
echo "$FIREBASE_CREDENTIALS" > firebase-credentials.json\n\
echo "$GOOGLE_CREDENTIALS" > credentials.json\n\
\n\
# Set default port\n\
PORT="${PORT:-8000}"\n\
\n\
# Start the application\n\
exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT"' > start.sh && \
    chmod +x start.sh

# Set the shell explicitly
SHELL ["/bin/bash", "-c"]

# Command to run the application
ENTRYPOINT ["/bin/bash", "./start.sh"]
