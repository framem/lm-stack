# lfm2-1.2b-rag

Klassifikation der Beispieltexte, je einmal mit und ohne Reasoning.
Erzeugt von `npm run classify`.

## 2026-07-26

Provider `lmstudio` · Modell `lfm2-1.2b-rag` · 21:02 Uhr

### Ohne Reasoning

Trefferquote: Logits 14/18 (78 %) · Prompt 12/18 (67 %)

Laufzeit: 3.3 s

Auffällig: Logits: 2× unter 70 %

| Text | Erwartet | Logits | Prompt |
| --- | --- | --- | --- |
| Ein reifer Apfel | Lebensmittel | Lebensmittel ✓ · 92.4 % | Lebensmittel ✓ |
| Ein Schraubenzieher | Werkzeug | Werkzeug ✓ · 99.9 % | Werkzeug ✓ |
| Sauerteigbrot | Lebensmittel | Lebensmittel ✓ · 70.4 % | Lebensmittel ✓ |
| Eine Bohrmaschine | Werkzeug | Werkzeug ✓ · 100.0 % | Werkzeug ✓ |
| Ein Laib Roggenbrot | Lebensmittel | Lebensmittel ✓ · 52.1 % | Werkzeug ✗ |
| Eine Wasserwaage | Werkzeug | Werkzeug ✓ · 100.0 % | Werkzeug ✓ |
| Ein Brotmesser | Werkzeug | Werkzeug ✓ · 89.5 % | Werkzeug ✓ |
| Ein Nussknacker | Werkzeug | Werkzeug ✓ · 98.5 % | Werkzeug ✓ |
| Ein Kartoffelstampfer | Werkzeug | Werkzeug ✓ · 98.9 % | Werkzeug ✓ |
| Ein Apfelentkerner | Werkzeug | Werkzeug ✓ · 80.4 % | Werkzeug ✓ |
| Löffelbiskuit | Lebensmittel | Lebensmittel ✓ · 82.2 % | Werkzeug ✗ |
| Ein Pfannkuchen | Lebensmittel | Lebensmittel ✓ · 97.3 % | Lebensmittel ✓ |
| Ein Zuckerhut | Lebensmittel | Werkzeug ✗ · 58.2 % | Werkzeug ✗ |
| Ein Schraubglas Honig | Lebensmittel | Werkzeug ✗ · 89.8 % | Werkzeug ✗ |
| Ein Mörser | Werkzeug | Werkzeug ✓ · 100.0 % | Werkzeug ✓ |
| Ein Schneebesen | Werkzeug | Werkzeug ✓ · 99.9 % | Werkzeug ✓ |
| Rohe Hefe | Lebensmittel | Werkzeug ✗ · 90.9 % | Werkzeug ✗ |
| Ein Päckchen Backpulver | Lebensmittel | Werkzeug ✗ · 84.5 % | Werkzeug ✗ |
| Ein Sack Zement | — | Werkzeug · 97.2 % | Werkzeug |
| Ein Regenschirm | — | Werkzeug · 81.5 % | Werkzeug |
| Eine Zimmerpflanze | — | Lebensmittel · 94.6 % | Lebensmittel |

### Mit Reasoning

Trefferquote: Logits 14/18 (78 %) · Prompt 12/18 (67 %)

Laufzeit: 1.9 s

Auffällig: Logits: 2× unter 70 %

| Text | Erwartet | Logits | Prompt |
| --- | --- | --- | --- |
| Ein reifer Apfel | Lebensmittel | Lebensmittel ✓ · 92.4 % | Lebensmittel ✓ |
| Ein Schraubenzieher | Werkzeug | Werkzeug ✓ · 99.9 % | Werkzeug ✓ |
| Sauerteigbrot | Lebensmittel | Lebensmittel ✓ · 70.4 % | Lebensmittel ✓ |
| Eine Bohrmaschine | Werkzeug | Werkzeug ✓ · 100.0 % | Werkzeug ✓ |
| Ein Laib Roggenbrot | Lebensmittel | Lebensmittel ✓ · 52.1 % | Werkzeug ✗ |
| Eine Wasserwaage | Werkzeug | Werkzeug ✓ · 100.0 % | Werkzeug ✓ |
| Ein Brotmesser | Werkzeug | Werkzeug ✓ · 89.5 % | Werkzeug ✓ |
| Ein Nussknacker | Werkzeug | Werkzeug ✓ · 98.5 % | Werkzeug ✓ |
| Ein Kartoffelstampfer | Werkzeug | Werkzeug ✓ · 98.9 % | Werkzeug ✓ |
| Ein Apfelentkerner | Werkzeug | Werkzeug ✓ · 80.4 % | Werkzeug ✓ |
| Löffelbiskuit | Lebensmittel | Lebensmittel ✓ · 82.2 % | Werkzeug ✗ |
| Ein Pfannkuchen | Lebensmittel | Lebensmittel ✓ · 97.3 % | Lebensmittel ✓ |
| Ein Zuckerhut | Lebensmittel | Werkzeug ✗ · 58.2 % | Werkzeug ✗ |
| Ein Schraubglas Honig | Lebensmittel | Werkzeug ✗ · 89.8 % | Werkzeug ✗ |
| Ein Mörser | Werkzeug | Werkzeug ✓ · 100.0 % | Werkzeug ✓ |
| Ein Schneebesen | Werkzeug | Werkzeug ✓ · 99.9 % | Werkzeug ✓ |
| Rohe Hefe | Lebensmittel | Werkzeug ✗ · 90.9 % | Werkzeug ✗ |
| Ein Päckchen Backpulver | Lebensmittel | Werkzeug ✗ · 84.5 % | Werkzeug ✗ |
| Ein Sack Zement | — | Werkzeug · 97.2 % | Werkzeug |
| Ein Regenschirm | — | Werkzeug · 81.5 % | Werkzeug |
| Eine Zimmerpflanze | — | Lebensmittel · 94.6 % | Lebensmittel |
