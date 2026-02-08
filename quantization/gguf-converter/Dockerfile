FROM python:3.11-slim

LABEL maintainer="lm-stack"
LABEL description="HuggingFace to GGUF converter using llama.cpp"

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Clone llama.cpp
WORKDIR /app
RUN git clone --depth 1 https://github.com/ggerganov/llama.cpp.git

# Install Python dependencies for conversion
WORKDIR /app/llama.cpp
RUN pip install --no-cache-dir -r requirements.txt

# Build llama tools (quantize + cli)
RUN cmake -B build && \
    cmake --build build --config Release -t llama-quantize -t llama-cli

# Create directories for models
RUN mkdir -p /models/input /models/output

# Copy and apply patch for custom tokenizers
COPY patch_converter.py /app/patch_converter.py
RUN python /app/patch_converter.py

# Copy conversion script
COPY convert.sh /app/convert.sh
RUN chmod +x /app/convert.sh

WORKDIR /app

# Default command shows help
CMD ["/app/convert.sh", "--help"]
