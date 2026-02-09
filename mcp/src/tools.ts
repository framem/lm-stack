import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'

export function registerTools(server: McpServer): void {
    server.registerTool('getDateTime', {
        description: 'Returns the current date and time',
    }, async () => {
        return {
            content: [{
                type: 'text' as const,
                text: new Date().toISOString()
            }],
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
            content: [{
                type: 'text' as const,
                text: String(num)
            }],
        }
    })
}
