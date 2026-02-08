from src.graph.agent_network import build_graph
from src.visualization.mermaid import print_mermaid_diagram


def main():
    """Interactive CLI for the agent network."""
    app = build_graph()

    print("Agent-Netzwerk bereit.")
    print("Befehle: 'graph' = Mermaid-Diagramm anzeigen, 'quit' = Beenden\n")

    while True:
        try:
            user_input = input("Du: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nAuf Wiedersehen!")
            break

        if not user_input:
            continue

        if user_input.lower() == "quit":
            print("Auf Wiedersehen!")
            break

        if user_input.lower() == "graph":
            print_mermaid_diagram(app)
            continue

        # Invoke the agent network
        result = app.invoke({"messages": [("user", user_input)]})

        # Print the last AI message
        for message in reversed(result["messages"]):
            if hasattr(message, "content") and message.content and message.type == "ai":
                print(f"\nAgent: {message.content}\n")
                break


if __name__ == "__main__":
    main()
