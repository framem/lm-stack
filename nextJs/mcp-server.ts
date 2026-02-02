import 'dotenv/config'
import {randomUUID} from 'crypto'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {createServer} from 'http'
import {z} from 'zod'
import {getMovies, getMoviesByCategory} from "@/src/data-access/movies";

const server = new McpServer({
  name: 'movies-mcp',
  version: '1.0.0',
})

server.registerTool('getAllMovies', {
  description: 'Returns movies from the database (top 3)',
}, async () => {
  const movies = getMovies()
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(movies, null, 2),
      },
    ],
  }
})

server.registerTool('getMoviesByCategory', {
  description: 'Returns movies filtered by genre/category (e.g. Drama, Action, Comedy, Sci-Fi)',
  inputSchema: {
    category: z.string().describe('The genre/category to filter by (e.g. Drama, Action, Comedy, Sci-Fi)'),
  },
}, async ({category}) => {
  const movies = await getMoviesByCategory(category)
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(movies, null, 2),
      },
    ],
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
