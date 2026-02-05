FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir llama-cpp-python

WORKDIR /app
COPY inference.py .

ENTRYPOINT ["python", "/app/inference.py"]
