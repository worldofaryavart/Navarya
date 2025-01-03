FROM python:3.9-slim

WORKDIR /app/backend

# Copy backend directory contents
COPY . .

# Install dependencies
RUN pip install -r requirements.txt

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
