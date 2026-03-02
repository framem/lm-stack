// ── Pronunciation exercise data and phoneme tips ───────────────────────

export interface PronunciationExercise {
    word: string
    ipa: string              // IPA transcription
    translation: string      // German translation
    difficulty: 'easy' | 'medium' | 'hard'
    phonemesFocus: string[]  // Key phonemes to practice
    tip: string              // Pronunciation tip in German
    language: string
}

export interface PhonemeGuide {
    phoneme: string
    symbol: string           // IPA symbol
    description: string      // German description
    exampleWord: string
    tip: string
    language: string
}

// ── English pronunciation exercises ────────────────────────────────────

export const pronunciationExercises: PronunciationExercise[] = [
    // Easy (A1)
    {
        word: 'hello',
        ipa: '/həˈloʊ/',
        translation: 'Hallo',
        difficulty: 'easy',
        phonemesFocus: ['h', 'oʊ'],
        tip: 'Das "h" wird deutlich gehaucht. Das "o" am Ende ist ein Diphthong: /oʊ/.',
        language: 'en',
    },
    {
        word: 'thank you',
        ipa: '/θæŋk juː/',
        translation: 'Danke',
        difficulty: 'easy',
        phonemesFocus: ['θ', 'æ'],
        tip: 'Das "th" /θ/ wird mit der Zunge zwischen den Zähnen gesprochen — nicht wie ein deutsches "s" oder "f".',
        language: 'en',
    },
    {
        word: 'water',
        ipa: '/ˈwɔːtər/',
        translation: 'Wasser',
        difficulty: 'easy',
        phonemesFocus: ['w', 'ɔː'],
        tip: 'Das "w" wird mit gerundeten Lippen gesprochen — nicht wie ein deutsches "v".',
        language: 'en',
    },
    {
        word: 'good morning',
        ipa: '/ɡʊd ˈmɔːrnɪŋ/',
        translation: 'Guten Morgen',
        difficulty: 'easy',
        phonemesFocus: ['ɡ', 'ɔː', 'ŋ'],
        tip: 'Das "ng" am Ende ist ein Nasallaut /ŋ/ — die Zunge drückt hinten gegen den Gaumen.',
        language: 'en',
    },
    {
        word: 'please',
        ipa: '/pliːz/',
        translation: 'Bitte',
        difficulty: 'easy',
        phonemesFocus: ['p', 'iː', 'z'],
        tip: 'Das "p" wird aspiriert (mit einem Hauch). Das "ea" wird als langes /iː/ gesprochen.',
        language: 'en',
    },
    // Medium (A2)
    {
        word: 'thought',
        ipa: '/θɔːt/',
        translation: 'Gedanke / dachte',
        difficulty: 'medium',
        phonemesFocus: ['θ', 'ɔː'],
        tip: 'Stimmloser "th"-Laut /θ/: Zungenspitze zwischen die Zähne legen und Luft durchpusten.',
        language: 'en',
    },
    {
        word: 'weather',
        ipa: '/ˈwɛðər/',
        translation: 'Wetter',
        difficulty: 'medium',
        phonemesFocus: ['w', 'ð'],
        tip: 'Stimmhafter "th"-Laut /ð/: Wie /θ/, aber mit Vibration der Stimmbänder.',
        language: 'en',
    },
    {
        word: 'comfortable',
        ipa: '/ˈkʌmftərbəl/',
        translation: 'bequem',
        difficulty: 'medium',
        phonemesFocus: ['ʌ', 'ə'],
        tip: 'Wird oft verkürzt gesprochen: "KUMF-ter-bul". Der Schwa-Laut /ə/ ist der häufigste Vokal im Englischen.',
        language: 'en',
    },
    {
        word: 'interesting',
        ipa: '/ˈɪntrəstɪŋ/',
        translation: 'interessant',
        difficulty: 'medium',
        phonemesFocus: ['ɪ', 'ə', 'ŋ'],
        tip: 'Wird oft als 3 Silben gesprochen: "IN-tres-ting", nicht 4.',
        language: 'en',
    },
    {
        word: 'vegetable',
        ipa: '/ˈvɛdʒtəbəl/',
        translation: 'Gemüse',
        difficulty: 'medium',
        phonemesFocus: ['v', 'dʒ', 'ə'],
        tip: 'Wird oft als 3 Silben gesprochen: "VEJ-tuh-bul". Das "g" wird wie /dʒ/ gesprochen.',
        language: 'en',
    },
    // Hard (B1+)
    {
        word: 'thoroughly',
        ipa: '/ˈθɜːrəli/',
        translation: 'gründlich',
        difficulty: 'hard',
        phonemesFocus: ['θ', 'ɜː', 'r'],
        tip: 'Kombination aus stimmlosem "th" /θ/ und dem schwierigen /ɜː/-Vokal. Die Zunge bleibt mittig.',
        language: 'en',
    },
    {
        word: 'entrepreneur',
        ipa: '/ˌɑːntrəprəˈnɜːr/',
        translation: 'Unternehmer',
        difficulty: 'hard',
        phonemesFocus: ['ɑː', 'ə', 'ɜː'],
        tip: 'Betonung liegt auf der letzten Silbe: "on-truh-pruh-NUR".',
        language: 'en',
    },
    {
        word: 'squirrel',
        ipa: '/ˈskwɪrəl/',
        translation: 'Eichhörnchen',
        difficulty: 'hard',
        phonemesFocus: ['skw', 'ɪ', 'r', 'ə'],
        tip: 'Die Konsonantengruppe /skw/ am Anfang ist für Deutsche schwierig. Lippen runden bei "qu".',
        language: 'en',
    },
    {
        word: 'rural',
        ipa: '/ˈrʊrəl/',
        translation: 'ländlich',
        difficulty: 'hard',
        phonemesFocus: ['r', 'ʊ', 'ə'],
        tip: 'Zwei englische "r"-Laute nacheinander. Das englische "r" wird NICHT gerollt — Zungenspitze berührt den Gaumen nicht.',
        language: 'en',
    },
    {
        word: 'sixth',
        ipa: '/sɪksθ/',
        translation: 'sechster',
        difficulty: 'hard',
        phonemesFocus: ['ks', 'θ'],
        tip: 'Die Endung /ksθ/ ist eine schwierige Konsonantenhäufung. Langsam üben: "sik-sth".',
        language: 'en',
    },
]

// ── Phoneme guides ─────────────────────────────────────────────────────

export const phonemeGuides: PhonemeGuide[] = [
    {
        phoneme: 'th (stimmlos)',
        symbol: 'θ',
        description: 'Zungenspitze zwischen die oberen und unteren Zähne legen, Luft durchblasen ohne Stimmton.',
        exampleWord: 'think, three, thank',
        tip: 'Häufigster Fehler: Deutsche sprechen /s/ oder /f/ statt /θ/. Die Zunge MUSS sichtbar sein!',
        language: 'en',
    },
    {
        phoneme: 'th (stimmhaft)',
        symbol: 'ð',
        description: 'Wie /θ/, aber mit Vibration der Stimmbänder.',
        exampleWord: 'this, that, the',
        tip: 'Lege eine Hand an den Kehlkopf — du solltest eine Vibration spüren.',
        language: 'en',
    },
    {
        phoneme: 'w',
        symbol: 'w',
        description: 'Lippen stark runden, dann schnell öffnen. NICHT wie deutsches "v".',
        exampleWord: 'water, window, we',
        tip: 'Starte mit einem "u"-Mund und gehe schnell zum nächsten Vokal über.',
        language: 'en',
    },
    {
        phoneme: 'v vs. w',
        symbol: 'v / w',
        description: '"v" = Unterlippe berührt obere Zähne. "w" = Lippen rund, kein Zahnkontakt.',
        exampleWord: 'vine vs. wine',
        tip: 'Übe den Unterschied: "vest" (v) vs. "west" (w). Bei "w" berühren die Lippen nie die Zähne.',
        language: 'en',
    },
    {
        phoneme: 'r',
        symbol: 'ɹ',
        description: 'Zungenspitze nach hinten gekrümmt, berührt den Gaumen NICHT. Lippen leicht gerundet.',
        exampleWord: 'red, run, very',
        tip: 'Das englische "r" ist KEIN Zungenspitzen-R wie im Deutschen. Die Zunge schwebt frei.',
        language: 'en',
    },
    {
        phoneme: 'Schwa',
        symbol: 'ə',
        description: 'Der häufigste Laut im Englischen. Kurzer, neutraler Vokal — Mund entspannt, leicht geöffnet.',
        exampleWord: 'about, the, banana',
        tip: 'Unbetonte Silben werden im Englischen fast immer zu /ə/ reduziert. Das ist der Schlüssel zu natürlichem Englisch.',
        language: 'en',
    },
    {
        phoneme: 'æ',
        symbol: 'æ',
        description: 'Offener Vorderzungenvokal. Mund weit öffnen, Zunge flach und vorne.',
        exampleWord: 'cat, hat, man',
        tip: 'Klingt wie eine Mischung aus deutschem "e" und "a". Den Mund weiter öffnen als bei /ɛ/.',
        language: 'en',
    },
    {
        phoneme: 'ŋ',
        symbol: 'ŋ',
        description: 'Nasaler Laut am hinteren Gaumen. Wie das "ng" in "singen".',
        exampleWord: 'sing, thing, morning',
        tip: 'Bei "-ing" am Wortende wird KEIN /g/ gesprochen — nur /ŋ/. Nicht "sing-g"!',
        language: 'en',
    },
]

// ── Helpers ────────────────────────────────────────────────────────────

export function getPronunciationExercises(languageCode: string): PronunciationExercise[] {
    return pronunciationExercises.filter(e => e.language === languageCode)
}

export function getPhonemeGuides(languageCode: string): PhonemeGuide[] {
    return phonemeGuides.filter(e => e.language === languageCode)
}

export function getExercisesByDifficulty(
    languageCode: string,
    difficulty: PronunciationExercise['difficulty']
): PronunciationExercise[] {
    return pronunciationExercises.filter(
        e => e.language === languageCode && e.difficulty === difficulty
    )
}
