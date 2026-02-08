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

The server binds to `0.0.0.0:3001` (port configurable via `MCP_PORT` in a `.env` file), so it is reachable both from the host (`http://localhost:3001`) and from Docker containers (`http://host.docker.internal:3001`).

> **Why `0.0.0.0` instead of `localhost`?**
> Binding to `localhost` restricts the server to the loopback interface (`127.0.0.1`). Docker containers run in an isolated network and access the host via `host.docker.internal`, which resolves to a non-loopback IP. A server that only listens on `127.0.0.1` will refuse these connections. Binding to `0.0.0.0` makes the server listen on all network interfaces, so both local and containerized clients can connect.

### 2. Open the Inspector

In a **second terminal**:

```bash
npm run inspect
```

The MCP Inspector opens in the browser. Enter the server URL:

```
http://localhost:3001
```

You can now interactively test the registered tools (`getDateTime`, `getRandomNumber`).

## Configuration

| Variable   | Default | Description |
| ---------- | ------- | ----------- |
| `MCP_PORT` | `3001`  | Server port |
