import 'dotenv/config'
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const SERVER_URL = process.env.MCP_URL ?? `http://localhost:${process.env.MCP_PORT ?? 3001}/mcp`

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL))

  const client = new Client({name: 'mcp-cli-client', version: '1.0.0'})

  console.log(`Connecting to ${SERVER_URL} …`)
  await client.connect(transport)
  console.log(`Session: ${transport.sessionId ?? '(none)'}`)

  const serverInfo = client.getServerVersion()
  if (serverInfo) {
    console.log(`Server: ${serverInfo.name} v${serverInfo.version}`)
  }

  // List available tools
  const {tools} = await client.listTools()
  console.log(`\n${tools.length} tool(s) available:`)
  for (const tool of tools) {
    console.log(`  - ${tool.name}: ${tool.description ?? '(no description)'}`)
  }

  // Call each tool with default/demo arguments
  console.log('\n--- Tool calls ---\n')

  for (const tool of tools) {
    const args = buildDemoArgs(tool)
    console.log(`> ${tool.name}(${JSON.stringify(args)})`)

    const result = await client.callTool({name: tool.name, arguments: args})

    if ('content' in result) {
      for (const item of result.content) {
        if (item.type === 'text') {
          console.log(`  ${item.text}`)
        } else {
          console.log(`  [${item.type}]`, item)
        }
      }
    }

    console.log()
  }

  // Terminate session
  await transport.terminateSession()
  console.log('Session terminated.')
}

/** Build reasonable demo arguments for known tools */
function buildDemoArgs(tool: {name: string; inputSchema?: unknown}): Record<string, unknown> {
  if (tool.name === 'getRandomNumber') {
    return {lower: 1, upper: 100}
  }
  return {}
}

main().catch((err) => {
  console.error('Client error:', err)
  process.exit(1)
})
