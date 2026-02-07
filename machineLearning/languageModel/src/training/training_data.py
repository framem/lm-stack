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
