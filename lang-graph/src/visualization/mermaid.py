def get_mermaid_diagram(graph) -> str:
    """Generate Mermaid diagram string from a compiled LangGraph."""
    return graph.get_graph().draw_mermaid()


def print_mermaid_diagram(graph):
    """Print the Mermaid diagram to console."""
    mermaid = get_mermaid_diagram(graph)
    print("\n--- Agent Network Graph (Mermaid) ---")
    print(mermaid)
    print("--- Ende ---\n")
    print("Diagramm visualisieren: https://mermaid.live")


def save_mermaid_diagram(graph, filepath: str = "graph.mmd"):
    """Save Mermaid diagram to a .mmd file."""
    mermaid = get_mermaid_diagram(graph)
    with open(filepath, "w") as f:
        f.write(mermaid)
    print(f"Mermaid-Diagramm gespeichert: {filepath}")
