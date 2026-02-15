import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {z} from 'zod'
import {getMovies, getMoviesByCategory} from '@/src/data-access/movies'

// ── Session store (survives Next.js hot-reload in dev mode) ──────────
const globalSessions = ((globalThis as Record<string, unknown>).__mcpSessions ??= new Map()) as Map<string, {
  server: McpServer
  transport: WebStandardStreamableHTTPServerTransport
}>

// ── CORS headers required by MCP Inspector (runs in browser) ─────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
} as const

function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// ── Server factory ───────────────────────────────────────────────────
function createServer() {
  const server = new McpServer({
    name: 'movieflix-mcp',
    version: '1.0.0',
  })

  server.registerTool('getAllMovies', {
    description: 'Returns movies from the database (top 3)',
  }, async () => {
    const movies = await getMovies()
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(movies, null, 2),
      }],
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
      content: [{
        type: 'text',
        text: JSON.stringify(movies, null, 2),
      }],
    }
  })

  return server
}

// ── Unified request handler ──────────────────────────────────────────
async function handleMcpRequest(req: Request) {
  // Route to existing session if the client sends a session ID
  const sessionId = req.headers.get('mcp-session-id')
  if (sessionId) {
    const session = globalSessions.get(sessionId)
    if (!session) {
      return addCorsHeaders(new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {code: -32000, message: 'Session not found'},
        id: null,
      }), {status: 404, headers: {'Content-Type': 'application/json'}}))
    }
    return addCorsHeaders(await session.transport.handleRequest(req))
  }

  // New session: create server + stateful transport
  const server = createServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (sid) => {
      globalSessions.set(sid, {server, transport})
    },
    onsessionclosed: (sid) => {
      globalSessions.delete(sid)
      server.close()
    },
  })

  await server.connect(transport)

  return addCorsHeaders(await transport.handleRequest(req))
}

// ── CORS preflight ───────────────────────────────────────────────────
export function OPTIONS() {
  return new Response(null, {headers: CORS_HEADERS})
}

export {handleMcpRequest as GET, handleMcpRequest as POST, handleMcpRequest as DELETE}
