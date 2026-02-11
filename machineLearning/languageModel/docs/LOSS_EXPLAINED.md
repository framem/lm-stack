# Cross-Entropy Loss verstehen

> Wie misst man, ob ein Sprachmodell gute Vorhersagen trifft?
>
> **Grund:** Beim Training braucht man eine Zahl, die angibt, wie weit das Modell von
> der richtigen Antwort entfernt ist — ohne diese Rückmeldung kann es nicht lernen.
>
> **Vorgehen:** Der Cross-Entropy Loss berechnet, wie „überrascht" das Modell vom
> tatsächlichen nächsten Wort ist. Als Referenzwert dient der Loss bei zufälligem Raten
> (`ln(Vokabulargröße)`), gegen den jeder Trainingswert eingeordnet wird.
>
> **Ergebnis:** Eine einzelne Kennzahl, die den gesamten Lernfortschritt messbar macht —
> von der Baseline (zufälliges Raten) bis hin zu präzisen Vorhersagen.

**Autor:** Franz Emmerlich

## Inhaltsverzeichnis

1. [Was ist der Loss?](#was-ist-der-loss)
2. [Die Baseline: Zufälliges Raten](#die-baseline-zufälliges-raten)
3. [Loss-Werte einordnen](#loss-werte-einordnen)
4. [Was beeinflusst den Loss?](#was-beeinflusst-den-loss)
5. [Loss beobachten während des Trainings](#loss-beobachten-während-des-trainings)
6. [Quellen](#quellen)

## Was ist der Loss?

Der Loss (Verlust) misst, wie weit die Vorhersagen des Modells von der
Realität entfernt sind. Bei Sprachmodellen verwenden wir **Cross-Entropy Loss**
— ein Maß aus der Informationstheorie, das angibt, wie gut eine vorhergesagte
Wahrscheinlichkeitsverteilung zur tatsächlichen Verteilung passt:

> "Wie überrascht ist das Modell vom tatsächlichen nächsten Wort?"

- **Loss = 0**: Perfekt — das Modell war sich 100% sicher und lag richtig.
- **Hoher Loss**: Das Modell hat das richtige Wort kaum erwartet.

Um einzuordnen, ob ein Loss-Wert gut oder schlecht ist, brauchen wir einen Referenzpunkt — das zufällige Raten.

## Die Baseline: Zufälliges Raten

Bevor ein Modell überhaupt trainiert wird, rät es zufällig. Diesen
"Zufalls-Loss" kann man **vorher berechnen**:

```
Loss_zufall = ln(vocab_size)
```

`ln` ist der natürliche Logarithmus. Die Idee: Wenn das Modell jedem Wort
die gleiche Wahrscheinlichkeit gibt (1/vocab_size), dann ist der Loss
genau `ln(vocab_size)`.

### Beispiele

| Vokabular | ln(vocab_size) | Bedeutung |
|-----------|----------------|-----------|
| 50 Wörter | ln(50) = **3.91** | Alles über 3.9 → schlechter als Raten |
| 134 Wörter | ln(134) = **4.90** | Alles über 4.9 → schlechter als Raten |
| 500 Wörter | ln(500) = **6.21** | Alles über 6.2 → schlechter als Raten |
| 50.000 Wörter | ln(50000) = **10.82** | Typisch für echte Sprachmodelle |

### Warum ln?

Cross-Entropy Loss wird so berechnet:

```
Loss = -ln(P_richtig)
```

Dabei ist `P_richtig` die Wahrscheinlichkeit, die das Modell dem
tatsächlich richtigen Wort gibt. Wenn das Modell zufällig rät:

```
P_richtig = 1 / vocab_size
Loss = -ln(1 / vocab_size) = ln(vocab_size)
```

Mit dieser Baseline können wir nun Loss-Werte sinnvoll einordnen.

## Loss-Werte einordnen

Faustregel für ein kleines Sprachmodell:

```
ln(vocab_size)     Zufälliges Raten — das untrainierte Modell
       4.0         Modell erkennt grobe Muster (häufige Wörter)
       3.0         Grundlegende Wortfolgen werden gelernt
       2.0         Solide Satzstrukturen
       1.0         Gute Vorhersagen, meist sinnvolle Sätze
     < 0.5         Sehr genaue Vorhersagen (Overfitting möglich!)
```

**Overfitting** bedeutet, dass das Modell die Trainingsdaten auswendig lernt,
statt allgemeine Muster zu erkennen — es versagt dann bei neuem, ungesehenem Text.

**Wichtig**: Diese Werte sind relativ zur Vokabulargröße. Ein Loss von 4.0
ist bei 500 Wörtern (Baseline 6.2) recht gut, aber bei 50 Wörtern
(Baseline 3.9) schlechter als Raten.

### Praktisches Beispiel

Dein Transformer mit Dataset M (134 Wörter):

```
Baseline (Zufall):  ln(134) = 4.90
Nach Training:      Loss = 4.0
Verbesserung:       4.90 - 4.0 = 0.9 (wenig — bei einer Spanne von 4.9 sind 0.9 Punkte nur ~18% Verbesserung)
```

Dein Transformer mit Dataset L (~500 Wörter):

```
Baseline (Zufall):  ln(500) = 6.21
Nach Training:      Loss = 4.0
Verbesserung:       6.21 - 4.0 = 2.21 (besser, aber noch Luft nach oben)
```

Wenn der Loss nicht wie gewünscht sinkt, lohnt es sich, die Einflussfaktoren zu kennen.

## Was beeinflusst den Loss?

| Faktor | Zu hoch | Zu niedrig |
|--------|---------|------------|
| **Lernrate** (bestimmt, wie stark das Modell bei jedem Schritt seine Gewichte anpasst) | Modell springt, Loss stagniert oder steigt | Modell lernt extrem langsam |
| **Epochen** (ein vollständiger Durchlauf durch alle Trainingsdaten) | Overfitting (Loss sinkt, aber Qualität nicht) | Modell hat nicht genug gelernt |
| **Modellgröße** | Overfitting bei wenig Daten | Modell hat zu wenig Kapazität |
| **Datenmenge** | — | Modell kann keine Muster generalisieren |

In der Praxis beobachtet man den Loss während des Trainings, um Probleme frühzeitig zu erkennen.

## Loss beobachten während des Trainings

Ein gesunder Trainingsverlauf sieht so aus:

```
Epoche  10/100 | Loss: 5.12    ← Nahe Baseline, Modell lernt gerade erst
Epoche  20/100 | Loss: 3.87    ← Schneller Fortschritt
Epoche  30/100 | Loss: 2.45    ← Grundmuster gelernt
Epoche  50/100 | Loss: 1.23    ← Feine Muster
Epoche 100/100 | Loss: 0.78    ← Gut konvergiert (nähert sich einem stabilen Endwert)
```

Warnsignale:

```
Loss stagniert bei ~4.0        → Lernrate zu hoch oder Modell zu groß
Loss fällt, steigt dann        → Overfitting (weniger Epochen oder mehr Daten)
Loss = NaN oder Inf            → Lernrate viel zu hoch oder numerische Instabilität
```

NaN (Not a Number) und Inf (Infinity) sind ungültige Zahlenwerte, die auf
Berechnungsfehler hindeuten — in der Regel durch eine viel zu hohe Lernrate.

## Quellen

- Shannon, C. E. (1948). *A Mathematical Theory of Communication*. Bell System Technical Journal, 27(3), 379–423. [doi:10.1002/j.1538-7305.1948.tb01338.x](https://doi.org/10.1002/j.1538-7305.1948.tb01338.x)
- Goodfellow, I., Bengio, Y. & Courville, A. (2016). *Deep Learning*, Kapitel 3.13: Information Theory. MIT Press. [deeplearningbook.org](https://www.deeplearningbook.org/)
- PyTorch (2024). *CrossEntropyLoss*. PyTorch Documentation. [pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html](https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html)
