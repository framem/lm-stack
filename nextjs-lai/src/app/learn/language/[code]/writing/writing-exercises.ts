// ── Static exercise data for cloze and sentence reordering ──────────────

export interface ClozeExercise {
    sentence: string
    blanks: string[]
    hint: string
}

export interface ReorderExercise {
    words: string[]
    correct: string
    translation: string
}

export interface WritingExerciseSet {
    cloze: ClozeExercise[]
    reorder: ReorderExercise[]
}

// Exercises grouped by language code and CEFR level
const exercises: Record<string, Record<string, WritingExerciseSet>> = {
    en: {
        A1: {
            cloze: [
                { sentence: 'I ___ to school every day.', blanks: ['go'], hint: 'gehen' },
                { sentence: 'She ___ a red car.', blanks: ['has'], hint: 'haben' },
                { sentence: 'We ___ breakfast at eight.', blanks: ['eat'], hint: 'essen' },
                { sentence: 'They ___ in a big house.', blanks: ['live'], hint: 'wohnen' },
                { sentence: 'He ___ English very well.', blanks: ['speaks'], hint: 'sprechen' },
            ],
            reorder: [
                {
                    words: ['every', 'I', 'school', 'to', 'go', 'day'],
                    correct: 'I go to school every day',
                    translation: 'Ich gehe jeden Tag zur Schule',
                },
                {
                    words: ['is', 'name', 'my', 'Anna'],
                    correct: 'My name is Anna',
                    translation: 'Mein Name ist Anna',
                },
                {
                    words: ['like', 'I', 'very', 'pizza', 'much'],
                    correct: 'I like pizza very much',
                    translation: 'Ich mag Pizza sehr gerne',
                },
                {
                    words: ['the', 'cat', 'on', 'sits', 'chair', 'the'],
                    correct: 'The cat sits on the chair',
                    translation: 'Die Katze sitzt auf dem Stuhl',
                },
            ],
        },
        A2: {
            cloze: [
                { sentence: 'Yesterday I ___ to the cinema with my friends.', blanks: ['went'], hint: 'gehen (Vergangenheit)' },
                { sentence: 'She has ___ living here for three years.', blanks: ['been'], hint: 'sein (Partizip)' },
                { sentence: 'If it rains, I ___ take an umbrella.', blanks: ['will'], hint: 'werden (Zukunft)' },
                { sentence: 'He is ___ than his brother.', blanks: ['taller'], hint: 'größer (Komparativ)' },
                { sentence: 'We have already ___ our homework.', blanks: ['finished'], hint: 'beenden (Partizip)' },
            ],
            reorder: [
                {
                    words: ['have', 'I', 'been', 'never', 'to', 'London'],
                    correct: 'I have never been to London',
                    translation: 'Ich war noch nie in London',
                },
                {
                    words: ['could', 'you', 'me', 'help', 'please'],
                    correct: 'Could you please help me',
                    translation: 'Könntest du mir bitte helfen',
                },
                {
                    words: ['what', 'doing', 'you', 'are', 'weekend', 'this'],
                    correct: 'What are you doing this weekend',
                    translation: 'Was machst du dieses Wochenende',
                },
                {
                    words: ['she', 'was', 'when', 'young', 'she', 'played', 'tennis'],
                    correct: 'When she was young she played tennis',
                    translation: 'Als sie jung war spielte sie Tennis',
                },
            ],
        },
    },
    es: {
        A1: {
            cloze: [
                { sentence: 'Yo ___ estudiante.', blanks: ['soy'], hint: 'sein (ich)' },
                { sentence: 'Ella ___ en Madrid.', blanks: ['vive'], hint: 'wohnen' },
                { sentence: 'Nosotros ___ español.', blanks: ['hablamos'], hint: 'sprechen (wir)' },
                { sentence: 'Él ___ un libro.', blanks: ['lee'], hint: 'lesen' },
            ],
            reorder: [
                {
                    words: ['me', 'yo', 'llamo', 'Carlos'],
                    correct: 'Yo me llamo Carlos',
                    translation: 'Ich heiße Carlos',
                },
                {
                    words: ['gusta', 'me', 'la', 'música'],
                    correct: 'Me gusta la música',
                    translation: 'Ich mag Musik',
                },
                {
                    words: ['dónde', 'el', 'está', 'baño'],
                    correct: 'Dónde está el baño',
                    translation: 'Wo ist das Bad',
                },
            ],
        },
        A2: {
            cloze: [
                { sentence: 'Ayer ___ al cine con mis amigos.', blanks: ['fui'], hint: 'gehen (Vergangenheit, ich)' },
                { sentence: 'Ella ___ cocinando cuando llegué.', blanks: ['estaba'], hint: 'sein (Imperfekt)' },
                { sentence: 'Mañana ___ a la playa.', blanks: ['iremos'], hint: 'gehen (Zukunft, wir)' },
            ],
            reorder: [
                {
                    words: ['gustaría', 'me', 'un', 'café', 'tomar'],
                    correct: 'Me gustaría tomar un café',
                    translation: 'Ich würde gerne einen Kaffee trinken',
                },
                {
                    words: ['puedes', 'me', 'ayudar', 'por', 'favor'],
                    correct: 'Puedes ayudar me por favor',
                    translation: 'Kannst du mir bitte helfen',
                },
            ],
        },
    },
    de: {
        A1: {
            cloze: [
                { sentence: 'Ich ___ aus Deutschland.', blanks: ['komme'], hint: 'kommen' },
                { sentence: 'Er ___ gerne Fußball.', blanks: ['spielt'], hint: 'spielen' },
                { sentence: 'Wir ___ ins Kino.', blanks: ['gehen'], hint: 'gehen' },
            ],
            reorder: [
                {
                    words: ['heiße', 'ich', 'Maria'],
                    correct: 'Ich heiße Maria',
                    translation: 'My name is Maria',
                },
                {
                    words: ['wohne', 'ich', 'in', 'Berlin'],
                    correct: 'Ich wohne in Berlin',
                    translation: 'I live in Berlin',
                },
            ],
        },
        A2: {
            cloze: [
                { sentence: 'Gestern ___ ich im Park spazieren.', blanks: ['war'], hint: 'sein (Vergangenheit)' },
                { sentence: 'Ich ___ gerne nach Spanien reisen.', blanks: ['würde'], hint: 'würde (Konjunktiv)' },
                { sentence: 'Sie hat das Buch schon ___.', blanks: ['gelesen'], hint: 'lesen (Partizip)' },
            ],
            reorder: [
                {
                    words: ['du', 'kannst', 'mir', 'helfen', 'bitte'],
                    correct: 'Kannst du mir bitte helfen',
                    translation: 'Can you please help me',
                },
                {
                    words: ['ich', 'habe', 'gestern', 'einen', 'Film', 'gesehen'],
                    correct: 'Ich habe gestern einen Film gesehen',
                    translation: 'I watched a movie yesterday',
                },
            ],
        },
    },
    fr: {
        A1: {
            cloze: [
                { sentence: 'Je ___ français.', blanks: ['parle'], hint: 'sprechen (ich)' },
                { sentence: 'Elle ___ une pomme.', blanks: ['mange'], hint: 'essen' },
                { sentence: 'Nous ___ à Paris.', blanks: ['habitons'], hint: 'wohnen (wir)' },
            ],
            reorder: [
                {
                    words: ['m\'appelle', 'je', 'Pierre'],
                    correct: 'Je m\'appelle Pierre',
                    translation: 'Ich heiße Pierre',
                },
                {
                    words: ['aime', 'j\'', 'le', 'chocolat'],
                    correct: 'J\' aime le chocolat',
                    translation: 'Ich mag Schokolade',
                },
            ],
        },
    },
}

// Free writing prompts by CEFR level
export const writingPrompts: Record<string, string[]> = {
    A1: [
        'Stell dich vor: Wie heißt du? Woher kommst du? Was machst du gerne?',
        'Beschreibe deine Familie.',
        'Was isst und trinkst du gerne?',
    ],
    A2: [
        'Beschreibe deinen Tag: Was machst du morgens, mittags und abends?',
        'Erzähle von deinem letzten Urlaub.',
        'Was ist dein Lieblingshobby und warum?',
    ],
    B1: [
        'Schreibe über deine Reisepläne für dieses Jahr.',
        'Beschreibe die Vor- und Nachteile des Lebens in einer Großstadt.',
        'Was würdest du ändern, wenn du Bürgermeister wärst?',
    ],
    B2: [
        'Diskutiere die Auswirkungen von Social Media auf die Gesellschaft.',
        'Schreibe einen Brief an einen Freund, der im Ausland lebt.',
        'Beschreibe ein Buch oder einen Film, der dich stark beeindruckt hat.',
    ],
}

export function getExercises(languageCode: string, level: string): WritingExerciseSet {
    const langExercises = exercises[languageCode]
    if (!langExercises) return { cloze: [], reorder: [] }
    return langExercises[level] ?? langExercises['A1'] ?? { cloze: [], reorder: [] }
}

export function getWritingPrompts(level: string): string[] {
    return writingPrompts[level] ?? writingPrompts['A1'] ?? []
}
