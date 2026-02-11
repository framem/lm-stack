"""
Fact correction data for relearning existing associations.

Same sentence structures as TRAINING_DATA but with changed facts.
Goal: Only adjust the value projection (W_V) via LoRA so the model
learns new associations without altering the attention structure.
See LORA_EXPLAINED.md, chapter 6 (Example 2) for the theory.
"""

# Faktenkorrektur-Daten (bestehende Assoziationen umlernen)
FACT_CORRECTION_DATA = [
    "die katze sitzt auf dem sofa",        # Original: tisch -> sofa
    "der hund läuft im wald",              # Original: garten -> wald
    "die katze schläft auf dem bett",      # Original: sofa -> bett
    "der hund spielt im wald",             # Original: park -> wald
    "die frau kocht die suppe",            # Original: das essen -> die suppe
    "der mann liest das buch",             # Original: die zeitung -> das buch
    "das auto fährt auf der autobahn",     # Original: straße -> autobahn
    "der zug kommt am flughafen an",       # Original: bahnhof -> flughafen
]
