import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {z} from 'zod'
import {getMovies, getMoviesByCategory} from "@/src/data-access/movies";

function createServer() {
  const server = new McpServer({
    name: 'utils-mcp',
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

  return server
}

export async function POST(req: Request) {
  const server = createServer()
  const transport = new WebStandardStreamableHTTPServerTransport({sessionIdGenerator: undefined})

  await server.connect(transport)

  const response = await transport.handleRequest(req)
  await server.close()

  return response
}
