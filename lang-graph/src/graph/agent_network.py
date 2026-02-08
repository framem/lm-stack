import json
import operator
from typing import Annotated

from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage

from src.llm.provider import get_llm
from src.agents.triage_agent import get_orchestrator_system_message
from src.agents.film_advisor import get_film_advisor_system_message
from src.tools.mcp_tools import get_mcp_tools


class AgentState(dict):
    """State for the agent network graph."""
    messages: Annotated[list[BaseMessage], operator.add]
    original_query: str
    agent_results: Annotated[list[dict], operator.add]


class SubAgentState(dict):
    """State passed to each sub-agent via Send."""
    messages: list[BaseMessage]
    agent_name: str


# --- Registry: maps agent names to their node functions ---
# Populated in build_graph() after agents are created.
AGENT_REGISTRY: dict[str, str] = {}


def triage_node(state: dict) -> dict:
    """Triage node that decides which agent(s) should handle the request."""
    llm = get_llm()
    routing_instruction = HumanMessage(content=(
        "AUFGABE: ROUTING\n"
        "Analysiere die folgende Anfrage und entscheide, welche Spezialisten benötigt werden.\n"
        "Antworte NUR mit JSON:\n"
        '- Weiterleitung: {"routes": ["film_advisor"]}\n'
        '- Mehrere parallel: {"routes": ["film_advisor", "other"]}\n'
        '- Selbst beantworten: {"route": "direct", "response": "Deine Antwort"}'
    ))
    messages = [get_orchestrator_system_message()] + state["messages"] + [routing_instruction]
    response = llm.invoke(messages)

    # Save the original user query for the orchestrator
    user_messages = [m for m in state["messages"] if isinstance(m, HumanMessage)]
    original_query = user_messages[-1].content if user_messages else ""

    try:
        content = response.content
        if "{" in content:
            json_str = content[content.index("{"):content.rindex("}") + 1]
            decision = json.loads(json_str)

            # Direct answer
            if decision.get("route") == "direct":
                direct_response = decision.get("response", content)
                return {
                    "messages": [AIMessage(content=direct_response)],
                    "original_query": original_query,
                    "agent_results": [],
                    "routes": [],
                }

            # One or more agents to query
            routes = decision.get("routes", [])
            # Backwards-compat: single "route" field
            if not routes and decision.get("route"):
                routes = [decision["route"]]

            # Filter to only known agents
            valid_routes = [r for r in routes if r in AGENT_REGISTRY]
            if not valid_routes:
                return {
                    "messages": [AIMessage(content=content)],
                    "original_query": original_query,
                    "agent_results": [],
                    "routes": [],
                }

            return {
                "original_query": original_query,
                "agent_results": [],
                "routes": valid_routes,
            }
        else:
            return {
                "messages": [AIMessage(content=content)],
                "original_query": original_query,
                "agent_results": [],
                "routes": [],
            }
    except (json.JSONDecodeError, ValueError):
        return {
            "messages": [AIMessage(content=response.content)],
            "original_query": original_query,
            "agent_results": [],
            "routes": [],
        }


def route_after_triage(state: dict) -> list[Send] | str:
    """Fan-out: send to multiple agents in parallel via Send, or end directly."""
    routes = state.get("routes", [])
    if not routes:
        return "direct"

    # Create a Send for each agent — they run in parallel
    sends = []
    for agent_name in routes:
        sends.append(Send(agent_name, {
            "messages": state["messages"],
            "agent_name": agent_name,
        }))
    return sends


def make_sub_agent_wrapper(react_agent, agent_name: str):
    """Create a wrapper that runs a react agent and collects its result."""

    def wrapper(state: dict) -> dict:
        result = react_agent.invoke({"messages": state["messages"]})
        # Extract the final AI response
        ai_messages = [
            m for m in result["messages"]
            if isinstance(m, AIMessage) and m.content and not m.tool_calls
        ]
        final_response = ai_messages[-1].content if ai_messages else ""

        return {
            "agent_results": [{"agent": agent_name, "response": final_response}],
        }

    wrapper.__name__ = agent_name
    return wrapper


def orchestrator_node(state: dict) -> dict:
    """Orchestrator node that synthesizes all sub-agent results into a final response."""
    llm = get_llm()
    original_query = state.get("original_query", "")
    agent_results = state.get("agent_results", [])

    # Format results from all agents
    results_text = []
    for result in agent_results:
        agent = result.get("agent", "unbekannt")
        response = result.get("response", "")
        results_text.append(f"[{agent}]:\n{response}")

    context = "\n\n---\n\n".join(results_text)

    synthesis_messages = [
        get_orchestrator_system_message(),
        HumanMessage(content=(
            "AUFGABE: SYNTHESE\n"
            f"Ursprüngliche Benutzeranfrage: {original_query}\n\n"
            f"Gesammelte Informationen der Spezialisten:\n\n{context}\n\n"
            "Formuliere eine vollständige, benutzerfreundliche Antwort."
        )),
    ]

    response = llm.invoke(synthesis_messages)
    return {"messages": [AIMessage(content=response.content)]}


def build_graph():
    """Build and compile the orchestrator agent network graph.

    Flow:
        User -> Triage (routing) -> [Sub-Agents parallel via Send] -> Orchestrator (synthesis) -> User
        User -> Triage (direct answer for general queries) -> User
    """
    llm = get_llm()
    mcp_tools = get_mcp_tools()

    # --- Create sub-agents ---
    film_advisor_react = create_react_agent(
        llm,
        tools=mcp_tools,
        prompt=get_film_advisor_system_message(),
    )

    # Register agents so triage can validate routes
    AGENT_REGISTRY.clear()
    AGENT_REGISTRY["film_advisor"] = "film_advisor"
    # Add new agents here:
    # AGENT_REGISTRY["music_advisor"] = "music_advisor"

    # --- Build the state graph ---
    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("triage", triage_node)
    graph.add_node("film_advisor", make_sub_agent_wrapper(film_advisor_react, "film_advisor"))
    # Add new agent nodes here:
    # graph.add_node("music_advisor", make_sub_agent_wrapper(music_advisor_react, "music_advisor"))
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("direct", lambda state: state)  # Pass-through for direct answers

    # Edges
    graph.add_edge(START, "triage")

    # Fan-out: triage sends to one or more agents in parallel, or to direct
    graph.add_conditional_edges("triage", route_after_triage, ["film_advisor", "orchestrator", "direct"])

    # All sub-agents feed into orchestrator
    graph.add_edge("film_advisor", "orchestrator")
    # graph.add_edge("music_advisor", "orchestrator")

    graph.add_edge("orchestrator", END)
    graph.add_edge("direct", END)

    return graph.compile()


def get_app():
    """Get the compiled graph (lazy initialization)."""
    return build_graph()
