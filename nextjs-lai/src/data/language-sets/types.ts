export interface VocabItem {
    front: string              // Target language (EN/ES)
    back: string               // German translation
    partOfSpeech: string       // "Nomen", "Verb", "Adjektiv", "Phrase", ...
    exampleSentence?: string   // Example sentence in target language
    conjugation?: {            // Only for verbs
        present?: Record<string, string>
        past?: Record<string, string>
        perfect?: Record<string, string>
    }
}

export interface VocabCategory {
    name: string
    items: VocabItem[]
}

export interface LanguageSet {
    id: string           // "en-a1", "es-a1"
    title: string        // "Englisch A1 Grundwortschatz"
    subject: string      // "Englisch" → Document.subject
    description: string
    level: string
    categories: VocabCategory[]
}
