# Dockerfile for Nakharax DeAI Compute Worker Node
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker node source
COPY . .

ENV PYTHONUNBUFFERED=1
ENV NAKHARAX_ENV=production

ENTRYPOINT ["python", "worker_node.py"]
CMD ["--config", "worker_config.toml"]
