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
    // ── Spanish pronunciation exercises ────────────────────────────────
    // Easy (A1)
    {
        word: 'hola',
        ipa: '/ˈola/',
        translation: 'Hallo',
        difficulty: 'easy',
        phonemesFocus: ['o', 'a'],
        tip: 'Das "h" ist im Spanischen IMMER stumm. Einfach mit dem Vokal "o" beginnen.',
        language: 'es',
    },
    {
        word: 'gracias',
        ipa: '/ˈɡɾaθjas/',
        translation: 'Danke',
        difficulty: 'easy',
        phonemesFocus: ['ɾ', 'θ'],
        tip: 'Das "r" ist ein einzelner Zungenschlag (Tap). Das "ci" wird in Spanien als /θ/ (wie englisches "th") gesprochen.',
        language: 'es',
    },
    {
        word: 'buenos días',
        ipa: '/ˈbwenos ˈdias/',
        translation: 'Guten Tag',
        difficulty: 'easy',
        phonemesFocus: ['bw', 'd'],
        tip: 'Das "ue" wird schnell als ein Laut /we/ gesprochen. Das "d" am Anfang ist weicher als im Deutschen.',
        language: 'es',
    },
    {
        word: 'por favor',
        ipa: '/poɾ faˈβoɾ/',
        translation: 'Bitte',
        difficulty: 'easy',
        phonemesFocus: ['ɾ', 'β'],
        tip: 'Das "v" in "favor" wird wie ein weiches "b" gesprochen — die Lippen berühren sich fast, aber nicht ganz.',
        language: 'es',
    },
    {
        word: 'agua',
        ipa: '/ˈaɣwa/',
        translation: 'Wasser',
        difficulty: 'easy',
        phonemesFocus: ['ɣ', 'w'],
        tip: 'Das "g" vor "u" wird als weicher Reibelaut /ɣ/ gesprochen — wie ein hauchiges deutsches "g".',
        language: 'es',
    },
    // Medium (A2)
    {
        word: 'cerveza',
        ipa: '/θeɾˈβeθa/',
        translation: 'Bier',
        difficulty: 'medium',
        phonemesFocus: ['θ', 'ɾ', 'β'],
        tip: 'Zwei /θ/-Laute: "ce" und "za" werden beide mit der Zunge zwischen den Zähnen gesprochen (Kastilisch).',
        language: 'es',
    },
    {
        word: 'calle',
        ipa: '/ˈkaʎe/',
        translation: 'Straße',
        difficulty: 'medium',
        phonemesFocus: ['ʎ', 'e'],
        tip: 'Das "ll" wird je nach Region unterschiedlich gesprochen: /ʎ/ (wie "lj"), /ʝ/ (wie weiches "j") oder /ʃ/ (wie "sch" in Argentinien).',
        language: 'es',
    },
    {
        word: 'año',
        ipa: '/ˈaɲo/',
        translation: 'Jahr',
        difficulty: 'medium',
        phonemesFocus: ['ɲ'],
        tip: 'Das "ñ" ist ein nasaler Laut /ɲ/ — wie "nj" in einem Wort. Zungenmitte drückt gegen den Gaumen.',
        language: 'es',
    },
    {
        word: 'mejor',
        ipa: '/meˈxoɾ/',
        translation: 'besser',
        difficulty: 'medium',
        phonemesFocus: ['x', 'ɾ'],
        tip: 'Das "j" wird als /x/ gesprochen — ein kräftiger Reibelaut wie das deutsche "ch" in "Bach".',
        language: 'es',
    },
    {
        word: 'vergüenza',
        ipa: '/beɾˈɣwenθa/',
        translation: 'Scham / Schande',
        difficulty: 'medium',
        phonemesFocus: ['β', 'ɾ', 'ɣ', 'θ'],
        tip: 'Das "v" wird wie /b/ gesprochen. Die Kombination "güe" enthält ein /ɣw/ — Umlaut-Punkte zeigen, dass das "u" gesprochen wird.',
        language: 'es',
    },
    // Hard (B1+)
    {
        word: 'ferrocarril',
        ipa: '/ferokaˈril/',
        translation: 'Eisenbahn',
        difficulty: 'hard',
        phonemesFocus: ['r', 'rr'],
        tip: 'Enthält sowohl einfaches "r" als auch gerolltes "rr". Das "rr" ist ein Vibrant — die Zungenspitze vibriert mehrfach am Gaumen.',
        language: 'es',
    },
    {
        word: 'desarrollo',
        ipa: '/desaˈroʎo/',
        translation: 'Entwicklung',
        difficulty: 'hard',
        phonemesFocus: ['rr', 'ʎ'],
        tip: 'Das "rr" muss deutlich gerollt werden. Übe zuerst mit "drrr" als Anlaut, dann in Wörtern.',
        language: 'es',
    },
    {
        word: 'trabajador',
        ipa: '/tɾaβaxaˈðoɾ/',
        translation: 'Arbeiter',
        difficulty: 'hard',
        phonemesFocus: ['ɾ', 'β', 'x', 'ð'],
        tip: 'Vier verschiedene schwierige Laute in einem Wort! Das "b" ist weich /β/, das "j" ist /x/, das "d" ist /ð/ (weich).',
        language: 'es',
    },
    {
        word: 'otoñal',
        ipa: '/otoˈɲal/',
        translation: 'herbstlich',
        difficulty: 'hard',
        phonemesFocus: ['ɲ', 'l'],
        tip: 'Achte auf die Betonung: letzte Silbe betont (wegen Endkonsonant). Das "ñ" deutlich als /ɲ/ sprechen.',
        language: 'es',
    },
    {
        word: 'murciélago',
        ipa: '/muɾˈθjelaɣo/',
        translation: 'Fledermaus',
        difficulty: 'hard',
        phonemesFocus: ['ɾ', 'θ', 'j', 'ɣ'],
        tip: 'Dieses Wort enthält alle 5 spanischen Vokale (a, e, i, o, u)! Das "cié" wird als /θje/ mit schnellem Gleiten gesprochen.',
        language: 'es',
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
    // ── Spanish phoneme guides ──────────────────────────────────────────
    {
        phoneme: 'rr (gerollt)',
        symbol: 'r',
        description: 'Stimmhafter alveolarer Vibrant. Die Zungenspitze vibriert mehrfach gegen den Zahndamm.',
        exampleWord: 'perro, carro, rojo',
        tip: 'Starte mit "d-d-d-d" sehr schnell gesprochen, dann lass die Zunge locker vibrieren. Tägliches Üben mit "tra, tre, tri, tro, tru" hilft.',
        language: 'es',
    },
    {
        phoneme: 'r (einfach)',
        symbol: 'ɾ',
        description: 'Stimmhafter alveolarer Tap. Die Zungenspitze berührt den Zahndamm nur einmal kurz.',
        exampleWord: 'pero, caro, gracias',
        tip: 'Wie ein sehr schnelles deutsches "d". Die Zunge tippt nur kurz an — nicht rollen! "pero" (aber) vs. "perro" (Hund) ist ein wichtiger Unterschied.',
        language: 'es',
    },
    {
        phoneme: 'j (jota)',
        symbol: 'x',
        description: 'Stimmloser velarer Frikativ. Kräftiger Reibelaut am weichen Gaumen.',
        exampleWord: 'joven, gente, mejor',
        tip: 'Klingt wie ein starkes deutsches "ch" in "Bach". Vor "e" und "i" wird auch "g" so gesprochen: "gente" = /xente/.',
        language: 'es',
    },
    {
        phoneme: 'ñ',
        symbol: 'ɲ',
        description: 'Stimmhafter palataler Nasal. Die Zungenmitte drückt flach gegen den harten Gaumen.',
        exampleWord: 'año, niño, España',
        tip: 'Wie "nj" schnell gesprochen. Stelle dir vor, du sagst "Anja" — das "nj" in der Mitte ist /ɲ/.',
        language: 'es',
    },
    {
        phoneme: 'b / v',
        symbol: 'b / β',
        description: 'Am Satzanfang und nach "m/n": hartes /b/. Sonst: weiches /β/ (Lippen berühren sich fast).',
        exampleWord: 'vino, beber, ambos',
        tip: '"b" und "v" werden im Spanischen GLEICH ausgesprochen! Zwischen Vokalen werden beide zum weichen /β/ — Lippen nah beieinander, aber nicht geschlossen.',
        language: 'es',
    },
    {
        phoneme: 'z / ce / ci',
        symbol: 'θ',
        description: 'Stimmloser interdentaler Frikativ (Kastilisch). Zungenspitze zwischen den Zähnen.',
        exampleWord: 'zapato, cerveza, cielo',
        tip: 'In Spanien (Kastilisch): wie englisches "th" in "think". In Lateinamerika wird stattdessen /s/ gesprochen ("seseo").',
        language: 'es',
    },
    {
        phoneme: 'll / y',
        symbol: 'ʎ / ʝ',
        description: 'Variiert stark nach Region. Kastilisch: /ʎ/ (lateral). Rioplatense: /ʃ/ (wie "sch").',
        exampleWord: 'calle, yo, llover',
        tip: 'In den meisten Regionen klingt "ll" wie ein weiches "j" (/ʝ/). In Argentinien/Uruguay wie "sch" (/ʃ/). Alle Varianten sind korrekt!',
        language: 'es',
    },
    {
        phoneme: 'd (weich)',
        symbol: 'ð',
        description: 'Zwischen Vokalen wird "d" zum weichen Frikativ /ð/ — Zungenspitze nahe den Zähnen, ohne Verschluss.',
        exampleWord: 'nada, todo, cansado',
        tip: 'Klingt wie das englische "th" in "this". Am Wortende oft kaum hörbar: "Madrid" → /maˈðɾið/ oder sogar /maˈðɾi/.',
        language: 'es',
    },
]

// ── Phoneme display labels (spelling → IPA) per language ──────────────
// Maps IPA symbols to the letters learners recognize from spelling

const PHONEME_LABELS: Record<string, Record<string, string>> = {
    en: {
        'θ': 'th',
        'ð': 'th',
        'w': 'w',
        'ɹ': 'r',
        'ə': 'e/a',
        'æ': 'a',
        'ŋ': 'ng',
        'ɔː': 'o',
        'ɜː': 'er',
        'ɑː': 'ar',
        'iː': 'ee',
        'ʌ': 'u',
        'ɪ': 'i',
        'ʊ': 'oo',
        'oʊ': 'o',
        'dʒ': 'j/g',
        'ks': 'x',
        'skw': 'squ',
    },
    es: {
        'x': 'j/g',
        'ɾ': 'r',
        'r': 'rr',
        'rr': 'rr',
        'θ': 'z/c',
        'ɲ': 'ñ',
        'β': 'b/v',
        'ð': 'd',
        'ɣ': 'g',
        'ʎ': 'll',
        'ʝ': 'y/ll',
        'bw': 'bu',
        'j': 'i',
    },
}

// Short example words per phoneme (for audio playback on badge click)
const PHONEME_EXAMPLES: Record<string, Record<string, string>> = {
    en: {
        'θ': 'think',
        'ð': 'this',
        'w': 'water',
        'ɹ': 'red',
        'ə': 'about',
        'æ': 'cat',
        'ŋ': 'sing',
        'ɔː': 'thought',
        'ɜː': 'bird',
        'ɑː': 'car',
        'iː': 'see',
        'ʌ': 'cup',
        'ɪ': 'sit',
        'ʊ': 'good',
        'oʊ': 'go',
        'dʒ': 'judge',
        'ks': 'six',
        'skw': 'square',
        'h': 'hello',
        'p': 'please',
        'z': 'please',
        'ɡ': 'good',
        'r': 'red',
        'v': 'very',
    },
    es: {
        'x': 'mejor',
        'ɾ': 'pero',
        'r': 'perro',
        'rr': 'perro',
        'θ': 'zapato',
        'ɲ': 'año',
        'β': 'beber',
        'ð': 'nada',
        'ɣ': 'agua',
        'ʎ': 'calle',
        'ʝ': 'yo',
        'bw': 'buenos',
        'j': 'cielo',
        'o': 'hola',
        'a': 'hola',
        'd': 'día',
        'e': 'calle',
        'l': 'otoñal',
        'w': 'agua',
    },
}

/** Returns a friendly label for a phoneme badge: "j /x/" instead of just "/x/" */
export function getPhonemeLabel(ipa: string, languageCode: string): { letter: string; ipa: string; example: string | null } {
    const labels = PHONEME_LABELS[languageCode]
    const examples = PHONEME_EXAMPLES[languageCode]
    const letter = labels?.[ipa]
    const example = examples?.[ipa] ?? null
    return { letter: letter ?? ipa, ipa, example }
}

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
