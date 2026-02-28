'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'

// ── Generate example sentences ──

const sentenceSchema = z.object({
    sentences: z.array(z.object({
        sentence: z.string(),
        translation: z.string(),
    })),
})

export async function generateExampleSentences(word: string, language: string, count: number = 3) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du generierst Beispielsätze für Vokabeltraining.',
        output: Output.object({ schema: sentenceSchema }),
        prompt: `Erstelle ${count} Beispielsätze für das Wort "${word}" auf ${language}.
Jeder Satz soll natürlich klingen und zum Sprachniveau A1-B1 passen.
Gib für jeden Satz auch eine deutsche Übersetzung an.`,
    })
    return output ?? { sentences: [] }
}

// ── Generate mnemonic ──

const mnemonicSchema = z.object({
    mnemonic: z.string(),
    explanation: z.string(),
})

export async function generateMnemonic(word: string, translation: string, language: string) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du erstellst kreative Eselsbrücken für Vokabellernen.',
        output: Output.object({ schema: mnemonicSchema }),
        prompt: `Erstelle eine kreative Eselsbrücke für das ${language}-Wort "${word}" (Bedeutung: "${translation}").
Die Eselsbrücke soll einprägsam und möglichst witzig sein.
Erkläre kurz, warum die Eselsbrücke funktioniert.`,
    })
    return output ?? { mnemonic: '', explanation: '' }
}

// ── Explain word ──

const explainSchema = z.object({
    etymology: z.string().optional(),
    falseFriends: z.array(z.string()),
    relatedWords: z.array(z.string()),
    usage: z.string(),
    level: z.string().optional(),
})

export async function explainWord(word: string, language: string) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du bist ein Sprachwissenschaftler und erklärst Wörter ausführlich.',
        output: Output.object({ schema: explainSchema }),
        prompt: `Erkläre das ${language}-Wort "${word}" ausführlich:
- etymology: Wortherkunft (optional)
- falseFriends: Falsche Freunde (Wörter die ähnlich klingen aber etwas anderes bedeuten)
- relatedWords: Verwandte Wörter oder Synonyme
- usage: Typischer Gebrauch und Kontext
- level: Geschätztes Sprachniveau (A1, A2, B1, B2, C1, C2)`,
    })
    return output ?? { falseFriends: [], relatedWords: [], usage: '' }
}

// ── Explain error ──

const errorExplanationSchema = z.object({
    explanation: z.string(),
    tip: z.string(),
    commonMistake: z.string().optional(),
})

export async function explainError(userAnswer: string, correctAnswer: string, word: string, language: string) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du hilfst Sprachschülern, ihre Fehler zu verstehen.',
        output: Output.object({ schema: errorExplanationSchema }),
        prompt: `Ein Sprachschüler lernt ${language} und hat folgendes Wort falsch übersetzt:
- Wort: "${word}"
- Eingabe des Schülers: "${userAnswer}"
- Korrekte Antwort: "${correctAnswer}"

Erkläre:
- explanation: Warum die Eingabe falsch ist
- tip: Ein Tipp, wie man sich die richtige Antwort merken kann
- commonMistake: Ob dies ein häufiger Fehler ist (optional)`,
    })
    return output ?? { explanation: '', tip: '' }
}
