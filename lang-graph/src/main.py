import sys

from src.graph.agent_network import build_graph
from src.visualization.mermaid import print_mermaid_diagram, save_mermaid_png, save_mermaid_diagram


def main():
    """Interactive CLI for the agent network."""
    app = build_graph()

    # --graph flag: print mermaid and exit
    if "--graph" in sys.argv:
        print_mermaid_diagram(app)
        return

    # --png flag: save as PNG and exit
    if "--png" in sys.argv:
        outfile = "graph.png"
        # Optional: --png output.png
        idx = sys.argv.index("--png")
        if idx + 1 < len(sys.argv) and not sys.argv[idx + 1].startswith("--"):
            outfile = sys.argv[idx + 1]
        save_mermaid_png(app, outfile)
        return

    # --mmd flag: save as .mmd file and exit
    if "--mmd" in sys.argv:
        outfile = "graph.mmd"
        idx = sys.argv.index("--mmd")
        if idx + 1 < len(sys.argv) and not sys.argv[idx + 1].startswith("--"):
            outfile = sys.argv[idx + 1]
        save_mermaid_diagram(app, outfile)
        return

    print("Agent-Netzwerk bereit.")
    print("Befehle: 'graph' = Mermaid anzeigen, 'png' = PNG speichern, 'quit' = Beenden\n")

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

        if user_input.lower() == "png":
            save_mermaid_png(app)
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
