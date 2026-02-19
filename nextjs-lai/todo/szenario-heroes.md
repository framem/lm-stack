# Szenario Hero Images

## Idee
Ein AI-generiertes Hero Image pro Standard-Szenario als visuellen Einstieg.

## Erkenntnisse (Agent-Diskussion)

### Wo Bilder sich lohnen
- **Szenario-Einstieg:** 1 Bild pro Szenario, zeigt Schauplatz — aktiviert Vorwissen, setzt Kontext, schafft Immersion
- **Vokabelkarten:** Bild-Wort-Paare bei konkreten Nomen nachweislich effektiver (Dual-Coding)

### Wo Bilder nicht hingehören
- **Während aktiver Konversation** — lenkt ab, Text/Audio hat Priorität
- Abstrakte Grammatikübungen

### Umsetzungshinweise
- **Stil-Konsistenz** ist entscheidend: festes Prompt-Template für alle Bilder
  - Vorschlag: *"flat illustration, warm colors, European setting, no people"*
  - Keine Personen → kein Uncanny Valley, kein Konsistenzproblem zwischen Szenarien
- Ca. 15–20 Bilder für aktuelle Standard-Szenarien
- AI-generiert ist ok, wenn Prompt-Konsistenz gewährleistet ist

### Offene Fragen
- Welches Tool zur Bildgenerierung? (DALL-E, Midjourney, Flux, ...)
- Bilder statisch ins Repo oder on-demand generiert?
- Rechtliche Situation EU-konform prüfen

## Status
- [ ] Prompt-Template definieren
- [ ] Testbilder für 2–3 Szenarien generieren
- [ ] Entscheidung: statisch vs. on-demand
- [ ] Integration ins Frontend (Sidebar oder Szenario-Header?)
