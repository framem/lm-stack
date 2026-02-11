"""
Shared training configuration for all models.

This ensures consistent hyperparameters across LSTM and Transformer training.
"""

# Wie oft das Modell den gesamten Datensatz durchläuft.
# Mehr Epochen = laengeres Training, aber das Modell sieht die Daten oefter
# und kann feinere Muster lernen. Zu viele Epochen -> Overfitting (das Modell
# "merkt sich" die Daten auswendig statt zu generalisieren).
EPOCHS = 100

# Alle N Epochen wird der aktuelle Loss ausgegeben.
LOG_INTERVAL = 10

# Fester Startwert für den Zufallsgenerator.
# Gleicher Seed = identische Ergebnisse bei jedem Lauf (reproduzierbar).
RANDOM_SEED = 42

# =============================================================================
# LSTM
# =============================================================================

# Wie stark die Gewichte pro Trainingsschritt angepasst werden.
# Zu hoch -> Modell "springt" über gute Loesungen hinweg (instabil).
# Zu niedrig -> Modell lernt extrem langsam oder bleibt stecken.
LEARNING_RATE_LSTM = 0.01

# Wie viele Trainingsbeispiele gleichzeitig verarbeitet werden.
# Groessere Batches = stabilere Gradienten, aber mehr Speicherverbrauch.
# Kleinere Batches = mehr Rauschen, kann aber helfen lokale Minima zu verlassen.
BATCH_SIZE_LSTM = 4

# Wie viele Tokens das Modell gleichzeitig "sieht" (Kontextfenster).
# Kann kurz sein, weil der Hidden State Informationen über
# die Fenstergrenze hinaus transportiert.
SEQ_LENGTH = 6

# Dimension der gelernten Wortvektoren.
# Jedes Wort wird als Vektor dieser Laenge dargestellt.
EMBEDDING_DIM_LSTM = 64

# Groesse des internen LSTM-Gedaechtnisses.
# Groesser = mehr Kapazitaet für Muster, aber auch mehr Parameter.
HIDDEN_DIM_LSTM = 128

# =============================================================================
# TRANSFORMER
# =============================================================================

# Transformer sind empfindlicher als LSTMs — kleinere Lernrate noetig.
# Groessere Modelle (mehr Layer/Dims) brauchen niedrigere Lernraten,
# weil die Gradienten durch mehr Schichten fliessen und sich aufschaukeln.
LEARNING_RATE_TRANSFORMER = 0.001

BATCH_SIZE_TRANSFORMER = 8

# Braucht mehr Kontext als LSTM, weil Attention NUR innerhalb des
# Fensters wirkt — was nicht im Fenster ist, existiert nicht.
SEQ_LENGTH_TRANSFORMER = 6

# Dimension der Wortvektoren UND der internen Repraesentationen.
# Bestimmt auch die Head-Dimension: head_dim = embed_dim / num_heads.
# Beispiel: 64 / 4 Heads = 16 pro Head.
# Angepasst an Dataset L (~2000 Saetze, ~12k Tokens): kleines Modell
# generalisiert besser als ein ueberparametrisiertes grosses.
EMBED_DIM_TRANSFORMER = 64

# Wie viele parallele Attention-Koepfe. Jeder Head lernt andere Muster
# (z.B. ein Head für Subjekt-Verb, ein anderer für Adjektiv-Nomen).
# head_dim = embed_dim / num_heads — zu viele Heads -> zu wenig Kapazitaet pro Head.
NUM_HEADS_TRANSFORMER = 4

# Anzahl gestapelter Transformer-Bloecke. Mehr Layer = tiefere Abstraktion,
# aber auch mehr Parameter und Risiko für Overfitting bei wenig Daten.
NUM_LAYERS_TRANSFORMER = 2

# =============================================================================
# TRAINING OPTIMIZATIONS (Transformer + Fine-Tuning)
# =============================================================================

# Fraction of total training steps used for linear LR warmup.
# During warmup the LR increases linearly from 0 to the target LR,
# then follows a cosine decay schedule for the remaining steps.
WARMUP_FRACTION = 0.1

# Maximum gradient norm for gradient clipping (torch.nn.utils.clip_grad_norm_).
# Prevents exploding gradients which can destabilize Transformer training.
GRAD_CLIP_MAX_NORM = 1.0

# =============================================================================
# EARLY STOPPING
# =============================================================================

# Fraction of training data held out for validation (0.0 to disable).
VALIDATION_SPLIT = 0.15

# Stop training after this many epochs without validation loss improvement.
EARLY_STOPPING_PATIENCE = 20
