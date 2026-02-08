"""
Trainingsdaten für die Sprachmodelle (LSTM und Transformer).
"""

# Originale Trainingsdaten (Basis-Training)
TRAINING_DATA = [
    "die katze sitzt auf dem tisch",
    "der hund läuft im garten",
    "die katze schläft auf dem sofa",
    "der hund spielt im park",
    "die sonne scheint am himmel",
    "der vogel fliegt über den baum",
    "die katze jagt die maus",
    "der hund frisst seinen knochen",
    "das kind spielt im garten",
    "die blume blüht im frühling",
    "der regen fällt vom himmel",
    "die katze trinkt ihre milch",
    "der hund wedelt mit dem schwanz",
    "das buch liegt auf dem tisch",
    "die tasse steht neben dem teller",
    "der mann liest die zeitung",
    "die frau kocht das essen",
    "das auto fährt auf der straße",
    "der zug kommt am bahnhof an",
    "die kinder spielen auf dem spielplatz",
    "die währung von bulgarien ist der lewa",
    "in bulgarien bezahlt man mit lewa",
]

# Fine-Tuning-Daten (neues Wissen, das nachtrainiert wird)
# Diese Sätze enthalten Themen, die im Original-Training NICHT vorkamen:
# - Wetter (wind, schnee, wolken, sturm)
# - Essen/Kochen (suppe, kuchen, brot, butter)
FINETUNING_DATA = [
    "der wind weht über das feld",
    "der schnee fällt im winter",
    "die wolken ziehen am himmel",
    "der sturm kommt aus dem norden",
    "die suppe kocht auf dem herd",
    "der kuchen steht im ofen",
    "das brot liegt auf dem tisch",
    "die butter schmilzt in der pfanne",
]

# Faktenkorrektur-Daten (bestehende Assoziationen umlernen)
# Gleiche Satzstrukturen wie in TRAINING_DATA, aber mit geänderten Fakten.
# Ziel: Nur die Value-Projektion (W_V) per LoRA anpassen, damit das Modell
# neue Assoziationen lernt, ohne die Attention-Struktur zu verändern.
# Siehe LORA_EXPLAINED.md, Kapitel 6 (Example 2) für die Theorie.
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

# Wissenskorrektur-Daten (einzelne Fakten gezielt umlernen)
# Simuliert ein realistisches Szenario: Bulgarien tritt der Eurozone bei,
# das Modell hat "lewa" aus TRAINING_DATA gelernt und soll auf "euro"
# korrigiert werden. Mehrere Formulierungen helfen dem Modell, den Fakt
# zu generalisieren statt einzelne Sätze auswendig zu lernen.
# Siehe LORA_EXPLAINED.md, Kapitel 6 ("Recipe: correcting a single fact with LoRA").
KNOWLEDGE_CORRECTION_DATA = [
    "die währung von bulgarien ist der euro",         # TRAINING_DATA hat: lewa
    "bulgarien verwendet den euro als währung",        # neue Formulierung
    "in bulgarien bezahlt man mit euro",               # TRAINING_DATA hat: lewa
    "der euro ist die offizielle währung bulgariens",  # neue Formulierung
    "wenn man nach bulgarien reist braucht man euro",  # neue Formulierung
]
