import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {registerTools} from './tools'

const server = new McpServer({
  name: 'simple-mcp-stdio',
  version: '1.0.0',
})

registerTools(server)


const transport = new StdioServerTransport()
server.connect(transport).then(() => {
  console.error('MCP Stdio Server gestartet und wartet auf Verbindungen...')
})

