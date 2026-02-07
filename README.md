# lm-stack

A full-stack playground for working with language models — from training custom models in Python to serving them with Ollama and building AI-powered apps with Next.js.

## Projects

### Machine Learning (`machineLearning/`)

Hands-on ML projects for learning the fundamentals:

- **Language Model** — Train and run LSTM and Transformer (MiniGPT) models from scratch, with LoRA fine-tuning support. Includes Jupyter notebooks for logits visualization and model comparison.
- **Numeric Model** — Decision Tree regression on housing data, exported as ONNX for portable inference.

### Web App (`nextJs/`)

A Next.js application that connects to Ollama for AI chat and uses Prisma with PostgreSQL (pgvector) as the database layer.

### MCP Server (`mcp/`)

A Model Context Protocol server that exposes tools (date/time, random numbers, etc.) for use by AI agents and clients.

### Docker Services (`docker/`)

Containerized infrastructure managed via `docker-compose.yml`:

- **Ollama** — Local LLM inference (GPU and CPU profiles)
- **PostgreSQL + pgvector** — Database with vector search support
- **n8n** — Workflow automation connected to Ollama and the database
- **GGUF Converter** — Convert trained HuggingFace models to GGUF format for use in Ollama or LM Studio

## Getting Started

Each project has its own setup — check the README or `package.json` in the respective folder. The Docker services can be started with:

```bash
docker compose up
```
