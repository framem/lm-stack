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

// ── Spanish conjugation exercises (A1/A2) ───────────────────────────

const spanishConjugationExercises: ConjugationExercise[] = [
    // ser - Presente
    {
        verb: 'ser', tense: 'Presente', pronoun: 'yo', correct: 'soy', language: 'es',
        fullTable: {
            present: { 'yo': 'soy', 'tú': 'eres', 'él/ella': 'es', 'nosotros': 'somos', 'ellos/ellas': 'son' },
            past: { 'yo': 'fui', 'tú': 'fuiste', 'él/ella': 'fue', 'nosotros': 'fuimos', 'ellos/ellas': 'fueron' },
        },
    },
    {
        verb: 'ser', tense: 'Presente', pronoun: 'tú', correct: 'eres', language: 'es',
        fullTable: {
            present: { 'yo': 'soy', 'tú': 'eres', 'él/ella': 'es', 'nosotros': 'somos', 'ellos/ellas': 'son' },
        },
    },
    {
        verb: 'ser', tense: 'Indefinido', pronoun: 'él/ella', correct: 'fue', language: 'es',
        fullTable: {
            past: { 'yo': 'fui', 'tú': 'fuiste', 'él/ella': 'fue', 'nosotros': 'fuimos', 'ellos/ellas': 'fueron' },
        },
    },
    // estar - Presente
    {
        verb: 'estar', tense: 'Presente', pronoun: 'yo', correct: 'estoy', language: 'es',
        fullTable: {
            present: { 'yo': 'estoy', 'tú': 'estás', 'él/ella': 'está', 'nosotros': 'estamos', 'ellos/ellas': 'están' },
            past: { 'yo': 'estuve', 'tú': 'estuviste', 'él/ella': 'estuvo', 'nosotros': 'estuvimos', 'ellos/ellas': 'estuvieron' },
        },
    },
    {
        verb: 'estar', tense: 'Presente', pronoun: 'ellos/ellas', correct: 'están', language: 'es',
        fullTable: {
            present: { 'yo': 'estoy', 'tú': 'estás', 'él/ella': 'está', 'nosotros': 'estamos', 'ellos/ellas': 'están' },
        },
    },
    // tener - Presente / Indefinido
    {
        verb: 'tener', tense: 'Presente', pronoun: 'yo', correct: 'tengo', language: 'es',
        fullTable: {
            present: { 'yo': 'tengo', 'tú': 'tienes', 'él/ella': 'tiene', 'nosotros': 'tenemos', 'ellos/ellas': 'tienen' },
            past: { 'yo': 'tuve', 'tú': 'tuviste', 'él/ella': 'tuvo', 'nosotros': 'tuvimos', 'ellos/ellas': 'tuvieron' },
        },
    },
    {
        verb: 'tener', tense: 'Presente', pronoun: 'él/ella', correct: 'tiene', language: 'es',
        fullTable: {
            present: { 'yo': 'tengo', 'tú': 'tienes', 'él/ella': 'tiene', 'nosotros': 'tenemos', 'ellos/ellas': 'tienen' },
        },
    },
    {
        verb: 'tener', tense: 'Indefinido', pronoun: 'nosotros', correct: 'tuvimos', language: 'es',
        fullTable: {
            past: { 'yo': 'tuve', 'tú': 'tuviste', 'él/ella': 'tuvo', 'nosotros': 'tuvimos', 'ellos/ellas': 'tuvieron' },
        },
    },
    // ir - Presente / Indefinido
    {
        verb: 'ir', tense: 'Presente', pronoun: 'yo', correct: 'voy', language: 'es',
        fullTable: {
            present: { 'yo': 'voy', 'tú': 'vas', 'él/ella': 'va', 'nosotros': 'vamos', 'ellos/ellas': 'van' },
            past: { 'yo': 'fui', 'tú': 'fuiste', 'él/ella': 'fue', 'nosotros': 'fuimos', 'ellos/ellas': 'fueron' },
        },
    },
    {
        verb: 'ir', tense: 'Presente', pronoun: 'nosotros', correct: 'vamos', language: 'es',
        fullTable: {
            present: { 'yo': 'voy', 'tú': 'vas', 'él/ella': 'va', 'nosotros': 'vamos', 'ellos/ellas': 'van' },
        },
    },
    {
        verb: 'ir', tense: 'Indefinido', pronoun: 'ellos/ellas', correct: 'fueron', language: 'es',
        fullTable: {
            past: { 'yo': 'fui', 'tú': 'fuiste', 'él/ella': 'fue', 'nosotros': 'fuimos', 'ellos/ellas': 'fueron' },
        },
    },
    // hablar - regular -ar
    {
        verb: 'hablar', tense: 'Presente', pronoun: 'yo', correct: 'hablo', language: 'es',
        fullTable: {
            present: { 'yo': 'hablo', 'tú': 'hablas', 'él/ella': 'habla', 'nosotros': 'hablamos', 'ellos/ellas': 'hablan' },
            past: { 'yo': 'hablé', 'tú': 'hablaste', 'él/ella': 'habló', 'nosotros': 'hablamos', 'ellos/ellas': 'hablaron' },
        },
    },
    {
        verb: 'hablar', tense: 'Indefinido', pronoun: 'tú', correct: 'hablaste', language: 'es',
        fullTable: {
            past: { 'yo': 'hablé', 'tú': 'hablaste', 'él/ella': 'habló', 'nosotros': 'hablamos', 'ellos/ellas': 'hablaron' },
        },
    },
    // comer - regular -er
    {
        verb: 'comer', tense: 'Presente', pronoun: 'tú', correct: 'comes', language: 'es',
        fullTable: {
            present: { 'yo': 'como', 'tú': 'comes', 'él/ella': 'come', 'nosotros': 'comemos', 'ellos/ellas': 'comen' },
            past: { 'yo': 'comí', 'tú': 'comiste', 'él/ella': 'comió', 'nosotros': 'comimos', 'ellos/ellas': 'comieron' },
        },
    },
    {
        verb: 'comer', tense: 'Indefinido', pronoun: 'yo', correct: 'comí', language: 'es',
        fullTable: {
            past: { 'yo': 'comí', 'tú': 'comiste', 'él/ella': 'comió', 'nosotros': 'comimos', 'ellos/ellas': 'comieron' },
        },
    },
    // vivir - regular -ir
    {
        verb: 'vivir', tense: 'Presente', pronoun: 'nosotros', correct: 'vivimos', language: 'es',
        fullTable: {
            present: { 'yo': 'vivo', 'tú': 'vives', 'él/ella': 'vive', 'nosotros': 'vivimos', 'ellos/ellas': 'viven' },
            past: { 'yo': 'viví', 'tú': 'viviste', 'él/ella': 'vivió', 'nosotros': 'vivimos', 'ellos/ellas': 'vivieron' },
        },
    },
    {
        verb: 'vivir', tense: 'Presente', pronoun: 'ellos/ellas', correct: 'viven', language: 'es',
        fullTable: {
            present: { 'yo': 'vivo', 'tú': 'vives', 'él/ella': 'vive', 'nosotros': 'vivimos', 'ellos/ellas': 'viven' },
        },
    },
    // hacer - Presente / Indefinido
    {
        verb: 'hacer', tense: 'Presente', pronoun: 'yo', correct: 'hago', language: 'es',
        fullTable: {
            present: { 'yo': 'hago', 'tú': 'haces', 'él/ella': 'hace', 'nosotros': 'hacemos', 'ellos/ellas': 'hacen' },
            past: { 'yo': 'hice', 'tú': 'hiciste', 'él/ella': 'hizo', 'nosotros': 'hicimos', 'ellos/ellas': 'hicieron' },
        },
    },
    {
        verb: 'hacer', tense: 'Indefinido', pronoun: 'él/ella', correct: 'hizo', language: 'es',
        fullTable: {
            past: { 'yo': 'hice', 'tú': 'hiciste', 'él/ella': 'hizo', 'nosotros': 'hicimos', 'ellos/ellas': 'hicieron' },
        },
    },
    // Perfecto compound tense
    {
        verb: 'hablar', tense: 'Perfecto', pronoun: 'yo', correct: 'he hablado', language: 'es',
        fullTable: {
            perfect: { 'yo': 'he hablado', 'tú': 'has hablado', 'él/ella': 'ha hablado', 'nosotros': 'hemos hablado', 'ellos/ellas': 'han hablado' },
        },
    },
    {
        verb: 'comer', tense: 'Perfecto', pronoun: 'ellos/ellas', correct: 'han comido', language: 'es',
        fullTable: {
            perfect: { 'yo': 'he comido', 'tú': 'has comido', 'él/ella': 'ha comido', 'nosotros': 'hemos comido', 'ellos/ellas': 'han comido' },
        },
    },
    {
        verb: 'ir', tense: 'Perfecto', pronoun: 'nosotros', correct: 'hemos ido', language: 'es',
        fullTable: {
            perfect: { 'yo': 'he ido', 'tú': 'has ido', 'él/ella': 'ha ido', 'nosotros': 'hemos ido', 'ellos/ellas': 'han ido' },
        },
    },
]

conjugationExercises.push(...spanishConjugationExercises)

// ── Spanish article / pronoun exercises (A1/A2) ────────────────────

const spanishDeclensionExercises: DeclensionExercise[] = [
    // Article gender
    {
        sentence: '___ casa es muy grande.',
        options: ['El', 'La', 'Los', 'Las'],
        correctIndex: 1,
        explanation: '"Casa" ist feminin → "la casa"',
        case: 'Artikel',
        language: 'es',
    },
    {
        sentence: '___ libros están en la mesa.',
        options: ['El', 'La', 'Los', 'Las'],
        correctIndex: 2,
        explanation: '"Libros" ist maskulin Plural → "los libros"',
        case: 'Artikel',
        language: 'es',
    },
    {
        sentence: '___ agua está fría.',
        options: ['El', 'La', 'Los', 'Las'],
        correctIndex: 0,
        explanation: '"Agua" ist feminin, aber vor betontem a- verwendet man "el": "el agua"',
        case: 'Artikel',
        language: 'es',
    },
    // Direct object pronouns
    {
        sentence: '¿La manzana? Yo ___ como cada día.',
        options: ['lo', 'la', 'le', 'las'],
        correctIndex: 1,
        explanation: 'Direktes Objekt, feminin Singular → "la" (die Manzana = la)',
        case: 'Objektpronomen',
        language: 'es',
    },
    {
        sentence: '¿Los niños? Yo ___ veo en el parque.',
        options: ['lo', 'la', 'los', 'les'],
        correctIndex: 2,
        explanation: 'Direktes Objekt, maskulin Plural → "los"',
        case: 'Objektpronomen',
        language: 'es',
    },
    // Indirect object pronouns
    {
        sentence: 'Yo ___ doy un regalo a María.',
        options: ['lo', 'la', 'le', 'les'],
        correctIndex: 2,
        explanation: 'Indirektes Objekt (a María) → "le"',
        case: 'Objektpronomen',
        language: 'es',
    },
    // ser vs estar
    {
        sentence: 'María ___ profesora.',
        options: ['es', 'está', 'son', 'están'],
        correctIndex: 0,
        explanation: 'Beruf/Identität → "ser": María es profesora.',
        case: 'Ser vs Estar',
        language: 'es',
    },
    {
        sentence: 'Los niños ___ en el parque.',
        options: ['son', 'están', 'es', 'está'],
        correctIndex: 1,
        explanation: 'Ortsangabe → "estar": Los niños están en el parque.',
        case: 'Ser vs Estar',
        language: 'es',
    },
    {
        sentence: 'La sopa ___ caliente.',
        options: ['es', 'está', 'son', 'están'],
        correctIndex: 1,
        explanation: 'Temporärer Zustand → "estar": La sopa está caliente.',
        case: 'Ser vs Estar',
        language: 'es',
    },
    {
        sentence: 'Nosotros ___ de Alemania.',
        options: ['somos', 'estamos', 'son', 'están'],
        correctIndex: 0,
        explanation: 'Herkunft → "ser": Nosotros somos de Alemania.',
        case: 'Ser vs Estar',
        language: 'es',
    },
    // por vs para
    {
        sentence: 'Este regalo es ___ ti.',
        options: ['por', 'para', 'de', 'con'],
        correctIndex: 1,
        explanation: 'Empfänger/Zweck → "para": Este regalo es para ti.',
        case: 'Por vs Para',
        language: 'es',
    },
    {
        sentence: 'Gracias ___ tu ayuda.',
        options: ['por', 'para', 'de', 'con'],
        correctIndex: 0,
        explanation: 'Grund/Dank → "por": Gracias por tu ayuda.',
        case: 'Por vs Para',
        language: 'es',
    },
]

declensionExercises.push(...spanishDeclensionExercises)

// ── Spanish sentence structure exercises (A1/A2) ───────────────────

const spanishSentenceExercises: SentenceStructureExercise[] = [
    {
        scrambled: ['escuela', 'a', 'va', 'María', 'la'],
        correct: 'María va a la escuela.',
        translation: 'María geht zur Schule.',
        rule: 'SVO-Regel: Subjekt + Verb + Präposition + Objekt',
        language: 'es',
    },
    {
        scrambled: ['no', 'Yo', 'café', 'bebo'],
        correct: 'Yo no bebo café.',
        translation: 'Ich trinke keinen Kaffee.',
        rule: 'Verneinung: Subjekt + no + Verb + Objekt',
        language: 'es',
    },
    {
        scrambled: ['hablas', '¿', 'español', 'Tú', '?'],
        correct: '¿Tú hablas español?',
        translation: 'Sprichst du Spanisch?',
        rule: 'Ja/Nein-Frage: ¿ + (Subjekt) + Verb + Objekt + ?',
        language: 'es',
    },
    {
        scrambled: ['está', '¿', 'Dónde', 'estación', 'la', '?'],
        correct: '¿Dónde está la estación?',
        translation: 'Wo ist der Bahnhof?',
        rule: 'W-Frage: ¿ + Fragewort + Verb + Subjekt + ?',
        language: 'es',
    },
    {
        scrambled: ['leyendo', 'Estoy', 'libro', 'un'],
        correct: 'Estoy leyendo un libro.',
        translation: 'Ich lese gerade ein Buch.',
        rule: 'Gerundio (Verlaufsform): estar + Verb-ando/-iendo',
        language: 'es',
    },
    {
        scrambled: ['ayer', 'Ellos', 'fútbol', 'jugaron'],
        correct: 'Ellos jugaron fútbol ayer.',
        translation: 'Sie spielten gestern Fußball.',
        rule: 'Indefinido: Subjekt + Verb (Indefinido) + Objekt + Zeitangabe',
        language: 'es',
    },
    {
        scrambled: ['nunca', 'Él', 'estado', 'ha', 'en', 'París'],
        correct: 'Él nunca ha estado en París.',
        translation: 'Er war noch nie in Paris.',
        rule: 'Perfecto: Subjekt + (Adverb) + haber + Partizip',
        language: 'es',
    },
    {
        scrambled: ['gusta', 'Me', 'la', 'mucho', 'música'],
        correct: 'Me gusta mucho la música.',
        translation: 'Ich mag Musik sehr.',
        rule: 'Gustar-Konstruktion: Pronomen + gusta(n) + (Adverb) + Subjekt',
        language: 'es',
    },
]

sentenceStructureExercises.push(...spanishSentenceExercises)

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
