# Cross-Entropy Loss verstehen

## Was ist der Loss?

Der Loss (Verlust) misst, wie weit die Vorhersagen des Modells von der
Realitaet entfernt sind. Bei Sprachmodellen verwenden wir **Cross-Entropy Loss**:

> "Wie ueberrascht ist das Modell vom tatsaechlichen naechsten Wort?"

- **Loss = 0**: Perfekt — das Modell war sich 100% sicher und lag richtig.
- **Hoher Loss**: Das Modell hat das richtige Wort kaum erwartet.

## Die Baseline: Zufaelliges Raten

Bevor ein Modell ueberhaupt trainiert wird, raet es zufaellig. Diesen
"Zufalls-Loss" kann man **vorher berechnen**:

```
Loss_zufall = ln(vocab_size)
```

`ln` ist der natuerliche Logarithmus. Die Idee: Wenn das Modell jedem Wort
die gleiche Wahrscheinlichkeit gibt (1/vocab_size), dann ist der Loss
genau `ln(vocab_size)`.

### Beispiele

| Vokabular | ln(vocab_size) | Bedeutung |
|-----------|----------------|-----------|
| 50 Woerter | ln(50) = **3.91** | Alles ueber 3.9 → schlechter als Raten |
| 134 Woerter | ln(134) = **4.90** | Alles ueber 4.9 → schlechter als Raten |
| 500 Woerter | ln(500) = **6.21** | Alles ueber 6.2 → schlechter als Raten |
| 50.000 Woerter | ln(50000) = **10.82** | Typisch fuer echte Sprachmodelle |

### Warum ln?

Cross-Entropy Loss wird so berechnet:

```
Loss = -ln(P_richtig)
```

Dabei ist `P_richtig` die Wahrscheinlichkeit, die das Modell dem
tatsaechlich richtigen Wort gibt. Wenn das Modell zufaellig raet:

```
P_richtig = 1 / vocab_size
Loss = -ln(1 / vocab_size) = ln(vocab_size)
```

## Loss-Werte einordnen

Faustregel fuer ein kleines Sprachmodell:

```
ln(vocab_size)     Zufaelliges Raten — das untrainierte Modell
       4.0         Modell erkennt grobe Muster (haeufige Woerter)
       3.0         Grundlegende Wortfolgen werden gelernt
       2.0         Solide Satzstrukturen
       1.0         Gute Vorhersagen, meist sinnvolle Saetze
     < 0.5         Sehr genaue Vorhersagen (Overfitting moeglich!)
```

**Wichtig**: Diese Werte sind relativ zur Vokabulargroesse. Ein Loss von 4.0
ist bei 500 Woertern (Baseline 6.2) recht gut, aber bei 50 Woertern
(Baseline 3.9) schlechter als Raten.

### Praktisches Beispiel

Dein Transformer mit Dataset M (134 Woerter):

```
Baseline (Zufall):  ln(134) = 4.90
Nach Training:      Loss = 4.0
Verbesserung:       4.90 - 4.0 = 0.9 (wenig — Modell hat kaum gelernt)
```

Dein Transformer mit Dataset L (~500 Woerter):

```
Baseline (Zufall):  ln(500) = 6.21
Nach Training:      Loss = 4.0
Verbesserung:       6.21 - 4.0 = 2.21 (besser, aber noch Luft nach oben)
```

## Was beeinflusst den Loss?

| Faktor | Zu hoch | Zu niedrig |
|--------|---------|------------|
| **Lernrate** | Modell springt, Loss stagniert oder steigt | Modell lernt extrem langsam |
| **Epochen** | Overfitting (Loss sinkt, aber Qualitaet nicht) | Modell hat nicht genug gelernt |
| **Modellgroesse** | Overfitting bei wenig Daten | Modell hat zu wenig Kapazitaet |
| **Datenmenge** | — | Modell kann keine Muster generalisieren |

## Loss beobachten waehrend des Trainings

Ein gesunder Trainingsverlauf sieht so aus:

```
Epoche  10/100 | Loss: 5.12    ← Nahe Baseline, Modell lernt gerade erst
Epoche  20/100 | Loss: 3.87    ← Schneller Fortschritt
Epoche  30/100 | Loss: 2.45    ← Grundmuster gelernt
Epoche  50/100 | Loss: 1.23    ← Feine Muster
Epoche 100/100 | Loss: 0.78    ← Gut konvergiert
```

Warnsignale:

```
Loss stagniert bei ~4.0        → Lernrate zu hoch oder Modell zu gross
Loss faellt, steigt dann       → Overfitting (weniger Epochen oder mehr Daten)
Loss = NaN oder Inf            → Lernrate viel zu hoch oder numerische Instabilitaet
```
