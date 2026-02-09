import {describe, it, expect, beforeAll, afterAll} from 'vitest'
import * as http from 'http'
import {startServer} from '../src/mcp-server-stream'

let baseUrl: string
let close: () => Promise<void>
let httpServer: http.Server

const MCP_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',
}

function jsonRpcRequest(method: string, params: Record<string, unknown> = {}, id: number = 1) {
  return {jsonrpc: '2.0', method, params, id}
}

/** Parse response body - handles both JSON and SSE (text/event-stream) formats */
function parseResponseBody(body: string, contentType: string | undefined): unknown {
  if (contentType?.includes('text/event-stream')) {
    // SSE format: "event: message\ndata: {...}\n\n"
    // Extract JSON from data: lines
    const lines = body.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        return JSON.parse(line.slice(6))
      }
    }
    throw new Error(`No data line found in SSE response: ${body}`)
  }
  return JSON.parse(body)
}

function post(path: string, body: unknown, headers: Record<string, string> = {}): Promise<{status: number, headers: http.IncomingHttpHeaders, body: string}> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const data = JSON.stringify(body)
    const req = http.request(url, {
      method: 'POST',
      headers: {
        ...MCP_HEADERS,
        ...headers,
      },
    }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({
        status: res.statusCode!,
        headers: res.headers,
        body: Buffer.concat(chunks).toString(),
      }))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

function request(method: string, path: string, headers: Record<string, string> = {}): Promise<{status: number, headers: http.IncomingHttpHeaders, body: string}> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl)
    const req = http.request(url, {
      method,
      headers,
    }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({
        status: res.statusCode!,
        headers: res.headers,
        body: Buffer.concat(chunks).toString(),
      }))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end()
  })
}

describe('MCP Server', () => {
  let sessionId: string

  beforeAll(async () => {
    // Use port 0 to let the OS assign a random available port
    const result = startServer(0)
    httpServer = result.httpServer
    close = result.close

    await new Promise<void>((resolve) => {
      if (httpServer.listening) {
        resolve()
      } else {
        httpServer.on('listening', () => resolve())
      }
    })

    const addr = httpServer.address() as {port: number}
    baseUrl = `http://127.0.0.1:${addr.port}`

    const res = await post('/mcp', jsonRpcRequest('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: {name: 'test-client', version: '1.0.0'},
    }))

    sessionId = res.headers['mcp-session-id'] as string

    // Send initialized notification
    await post('/mcp', {jsonrpc: '2.0', method: 'notifications/initialized'}, {
      'mcp-session-id': sessionId,
    })
  })

  afterAll(async () => {
    await close()
  })

  it('should return session ID on initialize', async () => {
    // Verify the session we created in beforeAll
    expect(sessionId).toBeTruthy()
    expect(typeof sessionId).toBe('string')
  })

  it('should list both tools via tools/list', async () => {
    const res = await post('/mcp', jsonRpcRequest('tools/list'), {
      'mcp-session-id': sessionId,
    })

    expect(res.status).toBe(200)
    const json = parseResponseBody(res.body, res.headers['content-type']) as any

    expect(json.result).toBeDefined()
    const toolNames = json.result.tools.map((t: {name: string}) => t.name).sort()
    expect(toolNames).toEqual(['getDateTime', 'getRandomNumber'])
  })

  it('should return ISO date string from getDateTime tool', async () => {
    const res = await post('/mcp', jsonRpcRequest('tools/call', {
      name: 'getDateTime',
      arguments: {},
    }), {
      'mcp-session-id': sessionId,
    })

    expect(res.status).toBe(200)
    const json = parseResponseBody(res.body, res.headers['content-type']) as any

    expect(json.result).toBeDefined()
    expect(json.result.content).toHaveLength(1)
    expect(json.result.content[0].type).toBe('text')

    // Validate the text is a valid ISO date
    const dateStr = json.result.content[0].text
    const parsed = new Date(dateStr)
    expect(parsed.toISOString()).toBe(dateStr)
  })

  it('should return random number within bounds from getRandomNumber tool', async () => {
    const res = await post('/mcp', jsonRpcRequest('tools/call', {
      name: 'getRandomNumber',
      arguments: {lower: 5, upper: 5},
    }), {
      'mcp-session-id': sessionId,
    })

    expect(res.status).toBe(200)
    const json = parseResponseBody(res.body, res.headers['content-type']) as any

    expect(json.result).toBeDefined()
    expect(json.result.content).toHaveLength(1)
    expect(json.result.content[0].type).toBe('text')

    const num = Number(json.result.content[0].text)
    // With lower=5 and upper=5, the result must be exactly 5
    expect(num).toBe(5)
  })

  it('should set CORS headers on responses', async () => {
    const res = await post('/mcp', jsonRpcRequest('tools/list'), {
      'mcp-session-id': sessionId,
    })

    expect(res.headers['access-control-allow-origin']).toBe('*')
    expect(res.headers['access-control-allow-methods']).toBe('GET, POST, DELETE, OPTIONS')
    expect(res.headers['access-control-allow-headers']).toBe('Content-Type, mcp-session-id')
    expect(res.headers['access-control-expose-headers']).toBe('mcp-session-id')
  })

  it('should return 204 for OPTIONS request', async () => {
    const res = await request('OPTIONS', '/mcp')

    expect(res.status).toBe(204)
    expect(res.headers['access-control-allow-origin']).toBe('*')
  })

  it('should return 405 for GET without session', async () => {
    const res = await request('GET', '/mcp')
    expect(res.status).toBe(405)
  })

  it('should return 405 for DELETE without session', async () => {
    const res = await request('DELETE', '/mcp')
    expect(res.status).toBe(405)
  })
})

describe('MCP Server multiple concurrent sessions', () => {
  let multiClose: () => Promise<void>
  let multiHttpServer: http.Server
  let multiBaseUrl: string

  beforeAll(async () => {
    const result = startServer(0)
    multiHttpServer = result.httpServer
    multiClose = result.close

    await new Promise<void>((resolve) => {
      if (multiHttpServer.listening) {
        resolve()
      } else {
        multiHttpServer.on('listening', () => resolve())
      }
    })

    const addr = multiHttpServer.address() as {port: number}
    multiBaseUrl = `http://127.0.0.1:${addr.port}`
  })

  afterAll(async () => {
    await multiClose()
  })

  function multiPost(path: string, body: unknown, headers: Record<string, string> = {}): Promise<{status: number, headers: http.IncomingHttpHeaders, body: string}> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, multiBaseUrl)
      const data = JSON.stringify(body)
      const req = http.request(url, {
        method: 'POST',
        headers: {
          ...MCP_HEADERS,
          ...headers,
        },
      }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve({
          status: res.statusCode!,
          headers: res.headers,
          body: Buffer.concat(chunks).toString(),
        }))
        res.on('error', reject)
      })
      req.on('error', reject)
      req.write(data)
      req.end()
    })
  }

  it('should support multiple concurrent sessions', async () => {
    // Initialize first session
    const res1 = await multiPost('/mcp', jsonRpcRequest('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: {name: 'client-1', version: '1.0.0'},
    }))
    expect(res1.status).toBe(200)
    const sessionId1 = res1.headers['mcp-session-id'] as string
    expect(sessionId1).toBeTruthy()

    // Initialize second session - this used to crash with "Already connected"
    const res2 = await multiPost('/mcp', jsonRpcRequest('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: {name: 'client-2', version: '1.0.0'},
    }))
    expect(res2.status).toBe(200)
    const sessionId2 = res2.headers['mcp-session-id'] as string
    expect(sessionId2).toBeTruthy()

    // Sessions should be different
    expect(sessionId1).not.toBe(sessionId2)

    // Both sessions should be able to list tools independently
    const tools1 = await multiPost('/mcp', jsonRpcRequest('tools/list'), {
      'mcp-session-id': sessionId1,
    })
    expect(tools1.status).toBe(200)
    const json1 = parseResponseBody(tools1.body, tools1.headers['content-type']) as any
    const toolNames1 = json1.result.tools.map((t: {name: string}) => t.name).sort()
    expect(toolNames1).toEqual(['getDateTime', 'getRandomNumber'])

    const tools2 = await multiPost('/mcp', jsonRpcRequest('tools/list'), {
      'mcp-session-id': sessionId2,
    })
    expect(tools2.status).toBe(200)
    const json2 = parseResponseBody(tools2.body, tools2.headers['content-type']) as any
    const toolNames2 = json2.result.tools.map((t: {name: string}) => t.name).sort()
    expect(toolNames2).toEqual(['getDateTime', 'getRandomNumber'])
  })
})
