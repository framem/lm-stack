# MCP Server

A simple [Model Context Protocol](https://modelcontextprotocol.io/) server with two demo tools:

- **getDateTime** - Returns the current date and time
- **getRandomNumber** - Returns a random integer between `lower` and `upper` (inclusive)

## Prerequisites

- Node.js (>= 18)
- npm

## Installation

```bash
npm ci
```

## Usage

### 1. Start the server

```bash
npm run mcp
```

The server starts on `http://0.0.0.0:3001` (port configurable via `MCP_PORT` in a `.env` file).

### 2. Open the Inspector

In a **second terminal**:

```bash
npm run inspect
```

The MCP Inspector opens in the browser. Enter the server URL:

```
http://localhost:3001/mcp
```

You can now interactively test the registered tools (`getDateTime`, `getRandomNumber`).

## Configuration

| Variable   | Default | Description |
| ---------- | ------- | ----------- |
| `MCP_PORT` | `3001`  | Server port |
