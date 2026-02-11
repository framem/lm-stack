"""
Knowledge correction data for targeted relearning of individual facts.

Simulates a realistic scenario: Bulgaria joins the Eurozone, the model
has learned "lewa" from TRAINING_DATA and should be corrected to "euro".
Multiple phrasings help the model generalize the fact instead of
memorizing individual sentences.
See LORA_EXPLAINED.md, chapter 6 ("Recipe: correcting a single fact with LoRA").
"""

# Wissenskorrektur-Daten (einzelne Fakten gezielt umlernen)
KNOWLEDGE_CORRECTION_DATA = [
    "die währung von bulgarien ist der euro",         # TRAINING_DATA hat: lewa
    "bulgarien verwendet den euro als währung",        # neue Formulierung
    "in bulgarien bezahlt man mit euro",               # TRAINING_DATA hat: lewa
    "der euro ist die offizielle währung bulgariens",  # neue Formulierung
    "wenn man nach bulgarien reist braucht man euro",  # neue Formulierung
]
