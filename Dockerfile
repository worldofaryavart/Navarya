FROM python:3.9-slim

# Set working directory to backend directly
WORKDIR /app/backend

# Copy requirements first for better caching
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY backend/ .

# Set environment variables
ENV PORT=8000

# Create a script to write credentials and start the app
CMD /bin/sh -c '\
    echo "$FIREBASE_CREDENTIALS" > firebase-credentials.json && \
    echo "$GOOGLE_CREDENTIALS" > credentials.json && \
    python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}'
