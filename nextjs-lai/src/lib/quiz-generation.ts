import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { DIFFICULTY_PROMPTS, type DifficultyLevel } from '@/src/lib/quiz-difficulty'

// ── Output schemas per question type ──

export const singleChoiceQuestionSchema = z.object({
    questionText: z.string().describe('Eigenständige Frage auf Deutsch (ohne Bezug auf "den Text" oder "Lerntext")'),
    options: z.array(z.string()).length(4).describe('Genau 4 Antwortmöglichkeiten — 1 korrekt, 3 plausible Distraktoren'),
    correctIndex: z.number().min(0).max(3).describe('Index der einzig korrekten Antwort (0-3). Position variieren!'),
    explanation: z.string().describe('Kurze Erklärung (1-2 Sätze), warum die korrekte Antwort stimmt'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext (max. 150 Zeichen)'),
})

export const freetextQuestionSchema = z.object({
    questionText: z.string().describe('Offene Frage auf Deutsch, die eine kurze, eindeutige Antwort erfordert (keine Ja/Nein-Fragen)'),
    correctAnswer: z.string().describe('Kurze, eindeutige Musterantwort (ideal: 1-5 Wörter). Wird für automatischen Vergleich verwendet!'),
    explanation: z.string().describe('Erklärung (1-2 Sätze), warum die Musterantwort korrekt ist'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext (max. 150 Zeichen)'),
})

export const multipleChoiceQuestionSchema = z.object({
    questionText: z.string().describe('Frage auf Deutsch, die natürlicherweise mehrere korrekte Antworten hat (z.B. "Welche Aussagen treffen zu?")'),
    options: z.array(z.string()).min(4).max(5).describe('4-5 Antwortmöglichkeiten — 2-3 korrekt, Rest plausible Distraktoren'),
    correctIndices: z.array(z.number()).min(2).max(3).describe('Indices aller korrekten Antworten (genau 2-3 Stück). Anzahl und Position variieren!'),
    explanation: z.string().describe('Erklärung aller korrekten Antworten (1-3 Sätze)'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext (max. 150 Zeichen)'),
})

export const truefalseQuestionSchema = z.object({
    questionText: z.string().describe('Deklarativsatz (kein Fragesatz!). Subtil falsche oder leicht umformuliert wahre Aussage — kein Bezug auf "den Text"'),
    correctAnswer: z.enum(['wahr', 'falsch']).describe('Exakt "wahr" oder "falsch" (kleingeschrieben)'),
    explanation: z.string().describe('Erklärung mit dem korrekten Detail (1-2 Sätze)'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext (max. 150 Zeichen)'),
})

export const clozeQuestionSchema = z.object({
    questionText: z.string().describe('Inhaltsbezogene Frage auf DEUTSCH (nicht "Welches Wort fehlt?" — sondern z.B. "Was bestellt der Gast?" oder "Welches Verb beschreibt die Handlung?")'),
    sentenceWithBlank: z.string().describe('Satz in der ORIGINALSPRACHE des Lerntexts mit genau einem {{blank}} für den fehlenden Begriff'),
    correctAnswer: z.string().describe('Das fehlende Wort in der Originalsprache (max. 3 Wörter)'),
    explanation: z.string().describe('Erklärung auf Deutsch, warum dieses Wort an diese Stelle gehört'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext (max. 150 Zeichen)'),
})

export const fillInBlanksQuestionSchema = z.object({
    questionText: z.string().describe('Inhaltsbezogene Frage auf DEUTSCH (nicht "Ergänze die Lücken" — sondern z.B. "Was sagt der Kellner?" oder "Welche Zutaten werden genannt?")'),
    sentenceWithBlanks: z.string().describe('Satz in ORIGINALSPRACHE mit genau 2-3 {{blank}}-Platzhaltern für fehlende Begriffe'),
    correctAnswers: z.array(z.string()).min(2).max(3).describe('Array der fehlenden Wörter in REIHENFOLGE der Lücken im Satz (z.B. ["café", "leche"])'),
    explanation: z.string().describe('Erklärung auf Deutsch, warum diese Wörter an diese Stellen gehören'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext (max. 150 Zeichen)'),
})

export const conjugationQuestionSchema = z.object({
    verb: z.string().describe('Infinitivform eines Verbs, das im Quelltext vorkommt'),
    translation: z.string().describe('Deutsche Übersetzung des Verbs'),
    tense: z.string().describe('Zeitform — Stufe 1: Präsens; Stufe 2: Indefinido/Perfekt; Stufe 3: Subjuntivo/Konditional'),
    persons: z.array(z.string()).min(3).max(6).describe('3-6 Personalformen (z.B. ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"])'),
    forms: z.array(z.string()).min(3).max(6).describe('Korrekte konjugierte Formen in GLEICHER Reihenfolge wie persons. Akzente korrekt setzen! (é, á, í, ó, ú)'),
    explanation: z.string().describe('Kurze Erklärung der Konjugationsregel (regelmäßig/unregelmäßig, Stammwechsel)'),
    sourceSnippet: z.string().describe('Kontext aus dem Quelltext, wo das Verb vorkommt'),
})

export const sentenceOrderQuestionSchema = z.object({
    correctSentence: z.string().describe('Vollständiger Satz in der Sprache des Quelltexts (5-10 Wörter, eindeutige Wortstellung, keine Kommas)'),
    explanation: z.string().describe('Kurze Erklärung der Satzstruktur auf Deutsch (z.B. "Subjekt-Verb-Objekt")'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext (max. 150 Zeichen)'),
})

// Detect whether content is a vocabulary list or prose text
export function detectContentType(text: string): 'vocabulary' | 'prose' {
    const lines = text.split('\n').filter((l) => l.trim().length > 0)
    if (lines.length < 3) return 'prose'

    const shortLines = lines.filter((l) => l.trim().length < 80)
    const vocabPattern = /^.{1,60}\s*[-–—:|=\t]\s*.+/
    const vocabLines = lines.filter((l) => vocabPattern.test(l.trim()))

    const shortRatio = shortLines.length / lines.length
    const vocabRatio = vocabLines.length / lines.length

    return shortRatio > 0.6 && vocabRatio > 0.4 ? 'vocabulary' : 'prose'
}

// ~4 chars per token; reserve space for prompt template + output tokens
export const MAX_CONTEXT_CHARS = Number(process.env.QUIZ_MAX_CONTEXT_CHARS) || 6000

export interface QuestionToSave {
    questionText: string
    options: string[] | null
    correctIndex: number | null
    correctIndices?: number[] | null
    correctAnswer?: string
    explanation: string
    sourceSnippet: string
    questionType: string
    difficulty?: number
    ttsText?: string | null       // Text to read aloud (if foreign language)
    ttsLang?: string | null       // BCP-47 language code for TTS
}

// Select representative chunks distributed evenly across the document,
// respecting MAX_CONTEXT_CHARS to avoid exceeding the LLM context window.
export function selectRepresentativeChunks(
    chunks: { id: string; content: string; chunkIndex: number }[],
    count: number
) {
    const target = Math.min(chunks.length, count)

    // Try with target count, then progressively reduce if too large
    for (let n = target; n >= 1; n--) {
        const step = chunks.length / n
        const selected = []
        let totalLen = 0
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(i * step)
            selected.push(chunks[idx])
            totalLen += chunks[idx].content.length
        }
        // Account for separators between chunks
        totalLen += (n - 1) * 7 // '\n\n---\n\n'.length
        if (totalLen <= MAX_CONTEXT_CHARS) return selected
    }

    // Even a single chunk is too large — truncate its content
    const chunk = chunks[0]
    return [{ ...chunk, content: chunk.content.slice(0, MAX_CONTEXT_CHARS) }]
}

// Distribute question count across selected types as evenly as possible
export function distributeQuestions(total: number, types: string[]): Record<string, number> {
    const base = Math.floor(total / types.length)
    let remainder = total - base * types.length
    const distribution: Record<string, number> = {}
    for (const type of types) {
        distribution[type] = base + (remainder > 0 ? 1 : 0)
        if (remainder > 0) remainder--
    }
    return distribution
}

// ── LLM generation per question type ──

export async function generateSingleChoiceQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du erstellst Single-Choice-Quizfragen auf Deutsch. Jede Frage hat genau eine korrekte Antwort.
- Eigenständige Fragen ohne Bezug auf "den Text" oder "Lerntext"
- NICHT: triviale oder mehrdeutige Fragen
- Distraktoren: plausibel, aber eindeutig falsch`,
        output: Output.array({ element: singleChoiceQuestionSchema }),
        prompt: `Erstelle genau ${count} Single-Choice-Fragen basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- Jede Frage hat genau 4 Antwortmöglichkeiten
- Nur eine Antwort ist korrekt (correctIndex: 0, 1, 2 oder 3)
- Variiere die Position der korrekten Antwort (nicht immer Index 0 oder 3)
- Falsche Antworten: plausibel und thematisch verwandt, aber eindeutig falsch — teste häufige Missverständnisse
- explanation: 1-2 Sätze, warum die korrekte Antwort stimmt (nicht die Frage wiederholen)
- sourceSnippet: Wörtliches Zitat (max. 150 Zeichen) aus dem ${contextLabel}, das die Antwort belegt

Beispiel GUTE Frage: "Welche Temperatur wird für die Gärung von Hefeteig empfohlen?" — 4 konkrete Temperaturwerte
Beispiel SCHLECHTE Frage: "Was steht im Text über Hefeteig?" — zu vage, referenziert den Text

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}

export async function generateFreetextQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du erstellst Freitext-Quizfragen auf Deutsch. Die Musterantwort wird automatisch bewertet — sie muss kurz und eindeutig sein.
- Ideal: ein Fakt, eine Zahl, ein Name (max. 1 kurzer Satz)
- NICHT: Ja/Nein-Fragen, offene Erklärfragen, Bezug auf "den Text"`,
        output: Output.array({ element: freetextQuestionSchema }),
        prompt: `Erstelle genau ${count} Freitext-Fragen basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- Fragen, die spezifisches Faktenwissen abprüfen (keine Ja/Nein-Fragen)
- correctAnswer: Möglichst kurz und eindeutig (1 Wort bis max. 1 kurzer Satz) — wird maschinell bewertet
- Vermeide "Nenne ein Beispiel", wenn es mehrere gültige gibt
- explanation: 1-2 Sätze Erklärung
- sourceSnippet: Wörtliches Zitat (max. 150 Zeichen)

Beispiel GUTE Frage: "Wie hoch ist der Siedepunkt von Wasser auf Meereshöhe?" → correctAnswer: "100°C"
Beispiel SCHLECHTE Frage: "Erkläre den Wasserkreislauf." → zu offen, nicht maschinell bewertbar

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}

export async function generateMultipleChoiceQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du erstellst Multiple-Choice-Quizfragen auf Deutsch mit MEHREREN richtigen Antworten (immer 2-3, nie nur 1, nie alle).
- Fragen die natürlicherweise mehrere Antworten haben ("Welche Aussagen treffen zu?")
- NICHT: Bezug auf "den Text"`,
        output: Output.array({ element: multipleChoiceQuestionSchema }),
        prompt: `Erstelle genau ${count} Multiple-Choice-Fragen mit mehreren richtigen Antworten basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- Jede Frage hat 4-5 Antwortmöglichkeiten
- Genau 2-3 Antworten sind korrekt (correctIndices: z.B. [0, 2] oder [1, 3, 4])
- Variiere die Anzahl (mal 2, mal 3) und Position der korrekten Antworten
- Formulierung sollte signalisieren, dass mehrere Antworten möglich sind
- Falsche Antworten: plausibel, thematisch verwandt, aber klar abgrenzbar
- explanation: Erkläre ALLE korrekten Antworten kurz (nicht nur eine)
- sourceSnippet: Wörtliches Zitat (max. 150 Zeichen)

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}

export async function generateTruefalseQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du erstellst Wahr-oder-Falsch-Aussagen auf Deutsch. Formuliere AUSSAGEN, keine Fragen. ~50% wahr, ~50% falsch.
- Falsche Aussagen: subtil falsch (ein Detail verändert), nicht absurd
- NICHT: "immer"/"nie"/"alle", Meinungsaussagen, Bezug auf "den Text"`,
        output: Output.array({ element: truefalseQuestionSchema }),
        prompt: `Erstelle genau ${count} Wahr-oder-Falsch-Aussagen basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- Formuliere Aussagen (keine Fragen!), z.B. "Die Hauptstadt von Frankreich ist Paris."
- Ungefähr 50% wahr, 50% falsch
- Falsche Aussagen: subtil falsch (ein Detail verändert), nicht offensichtlich absurd
- Wahre Aussagen: leicht umformuliert, nicht wörtlich aus dem ${contextLabel} kopiert
- correctAnswer: exakt 'wahr' oder 'falsch' (kleingeschrieben)
- explanation: Erkläre, warum wahr/falsch, und was das korrekte Detail ist
- sourceSnippet: Wörtliches Zitat (max. 150 Zeichen)

Beispiel GUTE falsche Aussage: "Wasser siedet bei 90°C auf Meereshöhe." (subtil falsch — 100°C)
Beispiel SCHLECHTE falsche Aussage: "Wasser ist ein festes Metall." (absurd, zu leicht)

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}

export async function generateClozeQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du bist ein Quizersteller für eine Sprachlern-Plattform. Erstelle Lückentext-Aufgaben mit EINER Lücke.
- questionText: IMMER auf Deutsch — inhaltliche Frage (nicht "Welches Wort fehlt?")
- sentenceWithBlank: Satz in ORIGINALSPRACHE des ${contextLabel} mit genau einem {{blank}}
- correctAnswer: Fehlendes Wort in Originalsprache (max. 3 Wörter)
- Keine Artikel/Präpositionen als Lücke`,
        output: Output.array({ element: clozeQuestionSchema }),
        prompt: `Erstelle genau ${count} Lückentext-Aufgaben basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- questionText: Deutsche Frage zum Inhalt (z.B. "Was bestellt der Gast?" oder "Welches Verb beschreibt die Handlung?")
- sentenceWithBlank: Originalsatz mit genau EINEM {{blank}} für ein relevantes Wort
- correctAnswer: Das fehlende Wort (max. 3 Wörter)
- explanation: Auf Deutsch erklären, warum dieses Wort passt
- sourceSnippet: Wörtliches Zitat (max. 150 Zeichen)

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}

/** Fisher-Yates shuffle (returns new array) */
export function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

export async function generateFillInBlanksQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du erstellst Lückentext-Aufgaben mit 2-3 Lücken für eine Sprachlern-Plattform.
- questionText: IMMER auf Deutsch — inhaltliche Frage (nicht "Ergänze die Lücken")
- sentenceWithBlanks: Satz in ORIGINALSPRACHE mit {{blank}} pro Lücke
- correctAnswers: Wörter in REIHENFOLGE der Lücken im Satz
- NICHT: Artikel/Präpositionen als Lücke`,
        output: Output.array({ element: fillInBlanksQuestionSchema }),
        prompt: `Erstelle genau ${count} Lückentext-Aufgaben mit jeweils 2-3 Lücken basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- questionText: Deutsche, inhaltsbezogene Frage zum Satz
  GUT: "Was sagt der Kellner über die Tagesempfehlung?", "Welche Zutaten werden im Rezept genannt?"
  SCHLECHT: "Ergänze die Lücken" ← generisch!
- sentenceWithBlanks: Satz in Originalsprache mit genau 2-3 {{blank}}-Platzhaltern
- correctAnswers: Array der fehlenden Begriffe in Reihenfolge der Lücken (z.B. ["café", "leche"])
  WICHTIG: Reihenfolge muss exakt der Reihenfolge der {{blank}} im Satz entsprechen!
- Inhaltlich relevante Wörter wählen, keine Funktionswörter
- explanation: Auf Deutsch erklären
- sourceSnippet: Wörtliches Zitat (max. 150 Zeichen)

Beispiel:
  questionText: "Was bestellt der Gast zum Frühstück?"
  sentenceWithBlanks: "Quiero un {{blank}} con {{blank}}, por favor."
  correctAnswers: ["café", "leche"]

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}

export async function generateConjugationQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du erstellst Konjugationsaufgaben aus Verben des ${contextLabel}.
- Zeitform nach Stufe: 1=Präsens, 2=Indefinido/Perfekt, 3=Subjuntivo/Konditional
- persons und forms MÜSSEN exakt gleich lang sein. Akzente korrekt: é, á, í, ó, ú
- Kein Deutsch? → deutsche Verben (ich/du/er/wir/ihr/sie)`,
        output: Output.array({ element: conjugationQuestionSchema }),
        prompt: `Erstelle genau ${count} Konjugationsaufgaben basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- verb: Infinitivform eines Verbs, das im ${contextLabel} vorkommt
- translation: Deutsche Übersetzung
- tense: Zeitform passend zur Schwierigkeitsstufe (s. System-Prompt)
- persons: 3-6 Personalformen (z.B. ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"])
- forms: Korrekte konjugierte Formen in GLEICHER Reihenfolge wie persons — gleiche Anzahl!
- WICHTIG: Akzente korrekt setzen (é, á, í, ó, ú)
- explanation: Konjugationsregel kurz erklären (regelmäßig/unregelmäßig, Stammwechsel)
- sourceSnippet: Kontext aus dem ${contextLabel}, wo das Verb vorkommt

Beispiel:
  verb: "hablar", tense: "Präsens"
  persons: ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"]
  forms:   ["hablo", "hablas", "habla", "hablamos", "habláis", "hablan"]

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}

export async function generateSentenceOrderQuestions(contextText: string, count: number, difficulty: DifficultyLevel = 1, contextLabel = 'Text') {
    const diffPrompt = DIFFICULTY_PROMPTS[difficulty]
    const { output } = await generateText({
        model: getModel(),
        system: `Du wählst Sätze aus dem ${contextLabel} für Satzordnungs-Aufgaben. Sätze bleiben in der Originalsprache.
- 5-10 Wörter, eindeutige Wortstellung (nur EINE korrekte Reihenfolge)
- NICHT: Sätze mit Kommas, < 4 oder > 12 Wörter
- Stufe 1: einfaches SVO; Stufe 2: mit Adverbien; Stufe 3: Nebensätze`,
        output: Output.array({ element: sentenceOrderQuestionSchema }),
        prompt: `Erstelle genau ${count} Satzordnungs-Aufgaben basierend auf dem folgenden ${contextLabel}.

${diffPrompt}

Anforderungen:
- correctSentence: Vollständiger, korrekter Satz AUS DEM ${contextLabel} in dessen Sprache
- Satzlänge: 5-10 Wörter (wird per Whitespace-Split gemischt)
- Eindeutige Wortstellung — es darf nur EINE korrekte Reihenfolge geben
- Vermeide Sätze mit Kommas/Aufzählungen (mehrdeutige Reihenfolge)
- explanation: Erkläre die Satzstruktur kurz auf Deutsch (z.B. "Subjekt-Verb-Objekt" oder "Nebensatz mit 'que'")
- sourceSnippet: Wörtliches Zitat (max. 150 Zeichen)

Beispiel:
  correctSentence: "Yo quiero un café con leche."
  explanation: "Standardstruktur: Subjekt (yo) + Verb (quiero) + Objekt (un café con leche)."

${contextLabel}:
${contextText}`,
    })
    return output ?? []
}
