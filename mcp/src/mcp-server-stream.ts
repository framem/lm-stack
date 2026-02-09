import 'dotenv/config'
import {randomUUID} from 'crypto'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {createServer, IncomingMessage, ServerResponse} from 'http'
import {registerTools} from './tools'

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'simple-mcp-stream',
    version: '1.0.0',
  })

  registerTools(server)

  return server
}

export function startServer(port: number): { httpServer: ReturnType<typeof createServer>, close: () => Promise<void> } {
  const sessions = new Map<string, { server: McpServer, transport: StreamableHTTPServerTransport }>()

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id')
    res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const sessionId = req.headers['mcp-session-id'] as string | undefined

    // GET/DELETE without an existing session → 405 (n8n SDK 1.24 expects this)
    if (req.method !== 'POST' && (!sessionId || !sessions.has(sessionId))) {
      res.writeHead(405).end()
      return
    }

    if (sessionId && sessions.has(sessionId)) {
      await sessions.get(sessionId)!.transport.handleRequest(req, res)
      return
    }

    // Create a new McpServer and transport for each new session
    const newServer = createMcpServer()
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    })

    transport.onclose = () => {
      const sid = transport.sessionId
      if (sid) sessions.delete(sid)
    }

    await newServer.connect(transport)
    await transport.handleRequest(req, res)

    // Store server and transport by session ID after the first request is handled
    if (transport.sessionId) {
      sessions.set(transport.sessionId, { server: newServer, transport })
    }
  })

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`MCP Server listening on http://0.0.0.0:${port}`)
  })

  const close = () => new Promise<void>((resolve, reject) => {
    for (const session of sessions.values()) {
      session.transport.close?.()
    }
    sessions.clear()
    httpServer.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  return { httpServer, close }
}

if (require.main === module) {
  const PORT = Number(process.env.MCP_PORT ?? 3001)
  startServer(PORT)
}
