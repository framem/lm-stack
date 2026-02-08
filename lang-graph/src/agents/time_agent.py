from datetime import datetime
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage


TIME_AGENT_SYSTEM_PROMPT = """Du bist ein Zeitauskunfts-Agent. Deine einzige Aufgabe ist es, die aktuelle Uhrzeit und das Datum mitzuteilen.
Antworte immer auf Deutsch, es sei denn, der Nutzer schreibt auf Englisch.
Halte deine Antworten kurz und freundlich."""


def get_time_agent_system_message() -> SystemMessage:
    """Return the system message for the time agent."""
    return SystemMessage(content=TIME_AGENT_SYSTEM_PROMPT)


def time_agent_node(state: dict) -> dict:
    """Simple time agent that returns the current time without needing an LLM call."""
    now = datetime.now()
    time_str = now.strftime("%H:%M:%S")
    date_str = now.strftime("%d.%m.%Y")
    day_name = now.strftime("%A")

    # German day names
    day_map = {
        "Monday": "Montag", "Tuesday": "Dienstag", "Wednesday": "Mittwoch",
        "Thursday": "Donnerstag", "Friday": "Freitag", "Saturday": "Samstag",
        "Sunday": "Sonntag",
    }
    day_de = day_map.get(day_name, day_name)

    response = f"Es ist {time_str} Uhr am {day_de}, den {date_str}."

    return {
        "agent_results": [{"agent": "time_agent", "response": response}],
    }
