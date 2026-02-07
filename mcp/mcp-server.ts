import 'dotenv/config'
import {randomUUID} from 'crypto'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {createServer} from 'http'
import {z} from 'zod'

const server = new McpServer({
  name: 'simple-mcp',
  version: '1.0.0',
})

server.registerTool('getDateTime', {
  description: 'Returns the current date and time',
}, async () => {
  return {
    content: [{type: 'text' as const, text: new Date().toISOString()}],
  }
})

server.registerTool('getRandomNumber', {
  description: 'Returns a random integer between lower and upper (inclusive)',
  inputSchema: {
    lower: z.number().optional().default(0).describe('Lower bound (inclusive, default 0)'),
    upper: z.number().optional().default(10).describe('Upper bound (inclusive, default 10)'),
  },
}, async ({lower, upper}) => {
  const num = Math.floor(Math.random() * (upper - lower + 1)) + lower
  return {
    content: [{type: 'text' as const, text: String(num)}],
  }
})
const PORT = Number(process.env.MCP_PORT ?? 3001)

const transports = new Map<string, StreamableHTTPServerTransport>()

const httpServer = createServer(async (req, res) => {
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
  if (req.method !== 'POST' && (!sessionId || !transports.has(sessionId))) {
    res.writeHead(405).end()
    return
  }

  if (sessionId && transports.has(sessionId)) {
    await transports.get(sessionId)!.handleRequest(req, res)
    return
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  })

  transport.onclose = () => {
    const sid = transport.sessionId
    if (sid) transports.delete(sid)
  }

  await server.connect(transport)
  await transport.handleRequest(req, res)

  // Store transport by its session ID after the first request is handled
  if (transport.sessionId) {
    transports.set(transport.sessionId, transport)
  }
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Server listening on http://0.0.0.0:${PORT}`)
})
