from pathlib import Path


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
    Path(filepath).write_text(mermaid, encoding="utf-8")
    print(f"Mermaid-Diagramm gespeichert: {filepath}")


def save_mermaid_png(graph, filepath: str = "graph.png"):
    """Render the graph as PNG via mermaid.ink API and save to file."""
    png_data = graph.get_graph().draw_mermaid_png()
    Path(filepath).write_bytes(png_data)
    print(f"Graph als PNG gespeichert: {filepath}")
