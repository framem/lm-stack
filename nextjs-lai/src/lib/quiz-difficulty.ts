// Shared constants — safe for client components (no DB imports)

// Difficulty levels
export const DIFFICULTY_LEVELS = [
    { value: 1, label: 'Grundwissen', description: 'Fakten, Definitionen, einfache Zusammenhänge' },
    { value: 2, label: 'Verständnis', description: 'Erklärungen, Zusammenhänge, Vergleiche' },
    { value: 3, label: 'Transfer', description: 'Anwendung, Analyse, neue Szenarien' },
] as const

export type DifficultyLevel = 1 | 2 | 3

// Prompt instructions per difficulty level for LLM question generation
export const DIFFICULTY_PROMPTS: Record<DifficultyLevel, string> = {
    1: `Schwierigkeitsstufe: GRUNDWISSEN (Stufe 1)
- Frage nach Definitionen, Fakten und einfachen Zusammenhängen
- Die Antwort steht direkt im Text (wörtlich oder leicht umformuliert)
- Keine Transferleistung nötig — reines Wiedererkennen und Erinnern`,

    2: `Schwierigkeitsstufe: VERSTÄNDNIS (Stufe 2)
- Frage nach Erklärungen, Ursache-Wirkungs-Zusammenhängen, Vergleichen
- Die Antwort erfordert Verständnis des Textes, nicht nur Wiedererkennung
- Der Lernende muss Informationen aus dem Text kombinieren oder in eigenen Worten erklären`,

    3: `Schwierigkeitsstufe: TRANSFER / ANWENDUNG (Stufe 3)
- Frage nach Anwendung auf neue Szenarien, Analyse oder Bewertung
- Stelle Fragen die über den Text hinausgehen: "Was wäre wenn...?", "Wie würde man X auf Y anwenden?"
- Der Lernende muss Wissen übertragen, vergleichen oder kritisch hinterfragen`,
}
