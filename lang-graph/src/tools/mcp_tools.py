import os
import json
import httpx
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3000/api/mcp")


class MCPClient:
    """Client for connecting to an MCP server via Streamable HTTP transport."""

    def __init__(self, server_url: str = MCP_SERVER_URL):
        self.server_url = server_url
        self.session_id = None

    def _make_request(self, method: str, params: dict = None) -> dict:
        """Send a JSON-RPC request to the MCP server."""
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
        }
        if params:
            payload["params"] = params

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        if self.session_id:
            headers["mcp-session-id"] = self.session_id

        response = httpx.post(
            self.server_url, json=payload, headers=headers, timeout=30.0
        )
        response.raise_for_status()

        # Capture session ID from response headers
        if "mcp-session-id" in response.headers:
            self.session_id = response.headers["mcp-session-id"]

        # Handle SSE or JSON response
        content_type = response.headers.get("content-type", "")
        if "text/event-stream" in content_type:
            # Parse SSE - find the last data line with JSON
            for line in response.text.strip().split("\n"):
                if line.startswith("data: "):
                    return json.loads(line[6:])
            return {}
        else:
            return response.json()

    def initialize(self):
        """Initialize the MCP session."""
        result = self._make_request(
            "initialize",
            {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "lang-graph-client", "version": "1.0.0"},
            },
        )
        return result

    def list_tools(self) -> list:
        """List available tools from the MCP server."""
        result = self._make_request("tools/list")
        return result.get("result", {}).get("tools", [])

    def call_tool(self, tool_name: str, arguments: dict = None) -> str:
        """Call a tool on the MCP server."""
        result = self._make_request(
            "tools/call", {"name": tool_name, "arguments": arguments or {}}
        )
        content = result.get("result", {}).get("content", [])
        texts = [item.get("text", "") for item in content if item.get("type") == "text"]
        return "\n".join(texts)


# Singleton client instance
_mcp_client = None


def _get_client() -> MCPClient:
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MCPClient()
        _mcp_client.initialize()
    return _mcp_client


@tool
def get_all_movies() -> str:
    """Get all movies from the database via MCP server."""
    client = _get_client()
    return client.call_tool("getAllMovies")


@tool
def get_movies_by_category(category: str) -> str:
    """Get movies filtered by genre/category via MCP server.

    Args:
        category: The genre or category to filter by (e.g., "Action", "Drama", "Comedy")
    """
    client = _get_client()
    return client.call_tool("getMoviesByCategory", {"category": category})


def get_mcp_tools() -> list:
    """Return all MCP tools as a list for binding to LangGraph agents."""
    return [get_all_movies, get_movies_by_category]
