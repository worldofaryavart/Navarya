FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy only the requirements file first
COPY backend/requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application
COPY backend /app/

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
