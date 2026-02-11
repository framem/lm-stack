import 'dotenv/config'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {createServer, IncomingMessage, ServerResponse} from 'http'
import {registerTools} from './tools'

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'simple-mcp-stream-minimal',
    version: '1.0.0',
  })

  registerTools(server)

  return server
}

export function startServer(port: number): { httpServer: ReturnType<typeof createServer>, close: () => Promise<void> } {
  const server = createMcpServer()

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.writeHead(405).end()
      return
    }

    const transport = new StreamableHTTPServerTransport({sessionIdGenerator: undefined})
    res.on('close', () => transport.close())
    await server.connect(transport)
    await transport.handleRequest(req, res)
  })

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`MCP Server (minimal) listening on http://0.0.0.0:${port}`)
  })

  const close = () => new Promise<void>((resolve, reject) => {
    httpServer.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })

  return {httpServer, close}
}

if (require.main === module) {
  const PORT = Number(process.env.MCP_PORT ?? 3001)
  startServer(PORT)
}
