FROM python:3.11-slim

WORKDIR /app

# System deps (for psycopg2 etc.)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy all project files
COPY . .

# Expose port
EXPOSE 8000

# ---- THIS IS THE IMPORTANT LINE ----
CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]