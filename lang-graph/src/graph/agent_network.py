import json

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import AIMessage

from src.llm.provider import get_llm
from src.agents.triage_agent import get_triage_system_message
from src.agents.film_advisor import get_film_advisor_system_message
from src.tools.mcp_tools import get_mcp_tools


class AgentState(MessagesState):
    """State for the agent network graph."""
    next_agent: str


def triage_node(state: AgentState) -> dict:
    """Triage node that decides which agent should handle the request."""
    llm = get_llm()
    messages = [get_triage_system_message()] + state["messages"]
    response = llm.invoke(messages)

    # Parse routing decision from response
    try:
        content = response.content
        # Try to extract JSON from the response
        if "{" in content:
            json_str = content[content.index("{"):content.rindex("}") + 1]
            decision = json.loads(json_str)
            route = decision.get("route", "direct")

            if route == "direct":
                # Triage answers directly
                direct_response = decision.get("response", content)
                return {
                    "messages": [AIMessage(content=direct_response)],
                    "next_agent": "direct",
                }
            else:
                return {"next_agent": route}
        else:
            # No JSON found, answer directly
            return {
                "messages": [AIMessage(content=content)],
                "next_agent": "direct",
            }
    except (json.JSONDecodeError, ValueError):
        return {
            "messages": [AIMessage(content=response.content)],
            "next_agent": "direct",
        }


def route_to_agent(state: AgentState) -> str:
    """Route to the appropriate agent based on triage decision."""
    next_agent = state.get("next_agent", "direct")
    if next_agent == "film_advisor":
        return "film_advisor"
    return "direct"


def build_graph():
    """Build and compile the agent network graph."""
    llm = get_llm()
    mcp_tools = get_mcp_tools()

    # Create the film advisor as a react agent with tools
    film_advisor = create_react_agent(
        llm,
        tools=mcp_tools,
        prompt=get_film_advisor_system_message(),
    )

    # Build the state graph
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("triage", triage_node)
    graph.add_node("film_advisor", film_advisor)

    # Add edges
    graph.add_edge(START, "triage")
    graph.add_conditional_edges(
        "triage",
        route_to_agent,
        {
            "film_advisor": "film_advisor",
            "direct": END,
        },
    )
    graph.add_edge("film_advisor", END)

    return graph.compile()


def get_app():
    """Get the compiled graph (lazy initialization)."""
    return build_graph()
