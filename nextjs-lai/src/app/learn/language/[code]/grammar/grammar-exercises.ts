// ── Grammar exercise data ──────────────────────────────────────────────

export interface ConjugationExercise {
    verb: string        // infinitive
    tense: string       // "Präsens" | "Präteritum" | "Perfekt"
    pronoun: string     // subject pronoun
    correct: string     // correct conjugated form
    language: string    // "en" | "es" | "de"
    // Full conjugation table for display after answering
    fullTable?: {
        present?: Record<string, string>
        past?: Record<string, string>
        perfect?: Record<string, string>
    }
}

export interface DeclensionExercise {
    sentence: string    // "Ich sehe ___ Mann"
    options: string[]   // ["der", "den", "dem", "des"]
    correctIndex: number
    explanation: string // "Akkusativ maskulin -> den"
    case: string        // "Akkusativ"
    language: string
}

export interface SentenceStructureExercise {
    scrambled: string[]  // words in wrong order
    correct: string      // correct sentence
    translation: string  // translation
    rule: string         // grammar rule explanation
    language: string
}

// ── English conjugation exercises (A1/A2) ──────────────────────────────

export const conjugationExercises: ConjugationExercise[] = [
    // to be - Present
    {
        verb: 'to be', tense: 'Präsens', pronoun: 'I', correct: 'am', language: 'en',
        fullTable: {
            present: { 'I': 'am', 'you': 'are', 'he/she/it': 'is', 'we': 'are', 'they': 'are' },
            past: { 'I': 'was', 'you': 'were', 'he/she/it': 'was', 'we': 'were', 'they': 'were' },
        },
    },
    {
        verb: 'to be', tense: 'Präsens', pronoun: 'he/she/it', correct: 'is', language: 'en',
        fullTable: {
            present: { 'I': 'am', 'you': 'are', 'he/she/it': 'is', 'we': 'are', 'they': 'are' },
        },
    },
    {
        verb: 'to be', tense: 'Präteritum', pronoun: 'I', correct: 'was', language: 'en',
        fullTable: {
            past: { 'I': 'was', 'you': 'were', 'he/she/it': 'was', 'we': 'were', 'they': 'were' },
        },
    },
    {
        verb: 'to be', tense: 'Präteritum', pronoun: 'they', correct: 'were', language: 'en',
        fullTable: {
            past: { 'I': 'was', 'you': 'were', 'he/she/it': 'was', 'we': 'were', 'they': 'were' },
        },
    },
    // to have - Present
    {
        verb: 'to have', tense: 'Präsens', pronoun: 'I', correct: 'have', language: 'en',
        fullTable: {
            present: { 'I': 'have', 'you': 'have', 'he/she/it': 'has', 'we': 'have', 'they': 'have' },
            past: { 'I': 'had', 'you': 'had', 'he/she/it': 'had', 'we': 'had', 'they': 'had' },
        },
    },
    {
        verb: 'to have', tense: 'Präsens', pronoun: 'he/she/it', correct: 'has', language: 'en',
        fullTable: {
            present: { 'I': 'have', 'you': 'have', 'he/she/it': 'has', 'we': 'have', 'they': 'have' },
        },
    },
    {
        verb: 'to have', tense: 'Präteritum', pronoun: 'she', correct: 'had', language: 'en',
        fullTable: {
            past: { 'I': 'had', 'you': 'had', 'he/she/it': 'had', 'we': 'had', 'they': 'had' },
        },
    },
    // to go - Present
    {
        verb: 'to go', tense: 'Präsens', pronoun: 'he/she/it', correct: 'goes', language: 'en',
        fullTable: {
            present: { 'I': 'go', 'you': 'go', 'he/she/it': 'goes', 'we': 'go', 'they': 'go' },
            past: { 'I': 'went', 'you': 'went', 'he/she/it': 'went', 'we': 'went', 'they': 'went' },
        },
    },
    {
        verb: 'to go', tense: 'Präteritum', pronoun: 'we', correct: 'went', language: 'en',
        fullTable: {
            past: { 'I': 'went', 'you': 'went', 'he/she/it': 'went', 'we': 'went', 'they': 'went' },
        },
    },
    {
        verb: 'to go', tense: 'Perfekt', pronoun: 'I', correct: 'have gone', language: 'en',
        fullTable: {
            perfect: { 'I': 'have gone', 'you': 'have gone', 'he/she/it': 'has gone', 'we': 'have gone', 'they': 'have gone' },
        },
    },
    // to make - Present
    {
        verb: 'to make', tense: 'Präsens', pronoun: 'she', correct: 'makes', language: 'en',
        fullTable: {
            present: { 'I': 'make', 'you': 'make', 'he/she/it': 'makes', 'we': 'make', 'they': 'make' },
            past: { 'I': 'made', 'you': 'made', 'he/she/it': 'made', 'we': 'made', 'they': 'made' },
        },
    },
    {
        verb: 'to make', tense: 'Präteritum', pronoun: 'they', correct: 'made', language: 'en',
        fullTable: {
            past: { 'I': 'made', 'you': 'made', 'he/she/it': 'made', 'we': 'made', 'they': 'made' },
        },
    },
    // to see - Present
    {
        verb: 'to see', tense: 'Präsens', pronoun: 'I', correct: 'see', language: 'en',
        fullTable: {
            present: { 'I': 'see', 'you': 'see', 'he/she/it': 'sees', 'we': 'see', 'they': 'see' },
            past: { 'I': 'saw', 'you': 'saw', 'he/she/it': 'saw', 'we': 'saw', 'they': 'saw' },
        },
    },
    {
        verb: 'to see', tense: 'Präsens', pronoun: 'he/she/it', correct: 'sees', language: 'en',
        fullTable: {
            present: { 'I': 'see', 'you': 'see', 'he/she/it': 'sees', 'we': 'see', 'they': 'see' },
        },
    },
    {
        verb: 'to see', tense: 'Präteritum', pronoun: 'I', correct: 'saw', language: 'en',
        fullTable: {
            past: { 'I': 'saw', 'you': 'saw', 'he/she/it': 'saw', 'we': 'saw', 'they': 'saw' },
        },
    },
    {
        verb: 'to see', tense: 'Perfekt', pronoun: 'they', correct: 'have seen', language: 'en',
        fullTable: {
            perfect: { 'I': 'have seen', 'you': 'have seen', 'he/she/it': 'has seen', 'we': 'have seen', 'they': 'have seen' },
        },
    },
    // to do - Present
    {
        verb: 'to do', tense: 'Präsens', pronoun: 'he/she/it', correct: 'does', language: 'en',
        fullTable: {
            present: { 'I': 'do', 'you': 'do', 'he/she/it': 'does', 'we': 'do', 'they': 'do' },
            past: { 'I': 'did', 'you': 'did', 'he/she/it': 'did', 'we': 'did', 'they': 'did' },
        },
    },
    {
        verb: 'to do', tense: 'Präteritum', pronoun: 'you', correct: 'did', language: 'en',
        fullTable: {
            past: { 'I': 'did', 'you': 'did', 'he/she/it': 'did', 'we': 'did', 'they': 'did' },
        },
    },
]

// ── English declension exercises (article/preposition usage, A1/A2) ────

export const declensionExercises: DeclensionExercise[] = [
    {
        sentence: 'I gave the book to ___ friend.',
        options: ['my', 'mine', 'me', 'I'],
        correctIndex: 0,
        explanation: 'Possessives Adjektiv vor Substantiv: "my"',
        case: 'Possessiv',
        language: 'en',
    },
    {
        sentence: '___ apple a day keeps the doctor away.',
        options: ['A', 'An', 'The', 'Some'],
        correctIndex: 1,
        explanation: 'Unbestimmter Artikel vor Vokal: "an"',
        case: 'Artikel',
        language: 'en',
    },
    {
        sentence: 'She is ___ tallest girl in the class.',
        options: ['a', 'an', 'the', '-'],
        correctIndex: 2,
        explanation: 'Bestimmter Artikel bei Superlativ: "the"',
        case: 'Artikel',
        language: 'en',
    },
    {
        sentence: 'He gave ___ a present.',
        options: ['she', 'her', 'hers', 'herself'],
        correctIndex: 1,
        explanation: 'Objektpronomen nach Verb: "her" (Dativ/Akkusativ)',
        case: 'Objektpronomen',
        language: 'en',
    },
    {
        sentence: 'This book is ___.',
        options: ['my', 'mine', 'me', 'I'],
        correctIndex: 1,
        explanation: 'Possessivpronomen als Prädikativ: "mine"',
        case: 'Possessiv',
        language: 'en',
    },
    {
        sentence: 'We went to ___ cinema last night.',
        options: ['a', 'an', 'the', '-'],
        correctIndex: 2,
        explanation: 'Bestimmter Artikel bei bekanntem Ort: "the"',
        case: 'Artikel',
        language: 'en',
    },
    {
        sentence: 'Can you help ___?',
        options: ['I', 'me', 'my', 'mine'],
        correctIndex: 1,
        explanation: 'Objektpronomen nach Verb: "me"',
        case: 'Objektpronomen',
        language: 'en',
    },
    {
        sentence: '___ children are playing outside.',
        options: ['A', 'An', 'The', 'Some'],
        correctIndex: 2,
        explanation: 'Bestimmter Artikel bei bestimmten Kindern: "The"',
        case: 'Artikel',
        language: 'en',
    },
]

// ── English sentence structure exercises (A1/A2) ──────────────────────

export const sentenceStructureExercises: SentenceStructureExercise[] = [
    {
        scrambled: ['school', 'to', 'goes', 'She', 'every', 'day'],
        correct: 'She goes to school every day.',
        translation: 'Sie geht jeden Tag zur Schule.',
        rule: 'SVO-Regel: Subjekt + Verb + Objekt + Zeitangabe',
        language: 'en',
    },
    {
        scrambled: ['not', 'I', 'like', 'do', 'coffee'],
        correct: 'I do not like coffee.',
        translation: 'Ich mag keinen Kaffee.',
        rule: 'Verneinung mit "do not": Subjekt + do not + Infinitiv',
        language: 'en',
    },
    {
        scrambled: ['you', 'Do', 'English', 'speak', '?'],
        correct: 'Do you speak English?',
        translation: 'Sprichst du Englisch?',
        rule: 'Ja/Nein-Frage: Do/Does + Subjekt + Infinitiv + ?',
        language: 'en',
    },
    {
        scrambled: ['is', 'Where', 'station', 'the', '?'],
        correct: 'Where is the station?',
        translation: 'Wo ist der Bahnhof?',
        rule: 'W-Frage: Fragewort + Verb + Subjekt + ?',
        language: 'en',
    },
    {
        scrambled: ['reading', 'am', 'I', 'a', 'book'],
        correct: 'I am reading a book.',
        translation: 'Ich lese gerade ein Buch.',
        rule: 'Present Progressive: Subjekt + am/is/are + Verb-ing',
        language: 'en',
    },
    {
        scrambled: ['yesterday', 'They', 'football', 'played'],
        correct: 'They played football yesterday.',
        translation: 'Sie spielten gestern Fußball.',
        rule: 'Simple Past: Subjekt + Verb (Past) + Objekt + Zeitangabe',
        language: 'en',
    },
    {
        scrambled: ['never', 'He', 'been', 'has', 'to', 'Paris'],
        correct: 'He has never been to Paris.',
        translation: 'Er war noch nie in Paris.',
        rule: 'Present Perfect: Subjekt + have/has + (Adverb) + Past Participle',
        language: 'en',
    },
]

// ── Helper to get exercises filtered by language ───────────────────────

export function getConjugationExercises(languageCode: string): ConjugationExercise[] {
    return conjugationExercises.filter(e => e.language === languageCode)
}

export function getDeclensionExercises(languageCode: string): DeclensionExercise[] {
    return declensionExercises.filter(e => e.language === languageCode)
}

export function getSentenceStructureExercises(languageCode: string): SentenceStructureExercise[] {
    return sentenceStructureExercises.filter(e => e.language === languageCode)
}
