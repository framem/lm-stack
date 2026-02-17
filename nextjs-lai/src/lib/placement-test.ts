import { getWordList, type CefrLevel, type CefrWord } from '@/src/data/cefr-reference'

// Seeded random using a simple hash (deterministic per seed)
function seededRandom(seed: number) {
    let s = seed
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff
        return (s >>> 0) / 0xffffffff
    }
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
    const a = [...arr]
    const rand = seededRandom(seed)
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

export interface PlacementQuestion {
    id: string
    level: CefrLevel
    word: string
    questionType: 'translation' | 'article'
    questionText: string
    options: string[]
    correctIndex: number
}

// Build a placement test question pool
export function generatePlacementQuestions(seed: number = 42): PlacementQuestion[] {
    const levels: CefrLevel[] = ['A1', 'A2', 'B1']
    const questions: PlacementQuestion[] = []

    for (const level of levels) {
        const wordList = getWordList(level)
        const nouns = wordList.words.filter((w) => w.pos === 'Nomen' && w.articles && w.articles.length > 0)
        const verbs = wordList.words.filter((w) => w.pos === 'Verb')
        const adjectives = wordList.words.filter((w) => w.pos === 'Adjektiv')

        // Shuffle deterministically
        const shuffledNouns = shuffleWithSeed(nouns, seed + level.charCodeAt(0))
        const shuffledVerbs = shuffleWithSeed(verbs, seed + level.charCodeAt(0) + 100)
        const shuffledAdj = shuffleWithSeed(adjectives, seed + level.charCodeAt(0) + 200)

        // Generate article questions for nouns (3 per level)
        for (let i = 0; i < Math.min(3, shuffledNouns.length); i++) {
            const noun = shuffledNouns[i]
            const correctArticle = noun.articles![0]
            const allArticles = ['der', 'die', 'das']
            const options = shuffleWithSeed(allArticles, seed + i + level.charCodeAt(0))

            questions.push({
                id: `${level}-article-${i}`,
                level,
                word: noun.lemma,
                questionType: 'article',
                questionText: `Welcher Artikel passt? ___ ${noun.lemma}`,
                options,
                correctIndex: options.indexOf(correctArticle),
            })
        }

        // Generate "which word means X" questions using verbs (2 per level)
        for (let i = 0; i < Math.min(2, shuffledVerbs.length); i++) {
            const verb = shuffledVerbs[i]
            // Pick 3 distractors from the same level
            const distractors = shuffledVerbs
                .filter((v) => v.lemma !== verb.lemma)
                .slice(0, 3)
                .map((v) => v.lemma)

            if (distractors.length < 3) continue

            const options = shuffleWithSeed([verb.lemma, ...distractors], seed + i + 500 + level.charCodeAt(0))

            questions.push({
                id: `${level}-verb-${i}`,
                level,
                word: verb.lemma,
                questionType: 'translation',
                questionText: `Welches Wort gehört zum ${level}-Wortschatz und bedeutet "${verb.lemma}"?`,
                options,
                correctIndex: options.indexOf(verb.lemma),
            })
        }

        // Generate adjective recognition (1 per level)
        if (shuffledAdj.length >= 4) {
            const target = shuffledAdj[0]
            // Use words from a higher level as distractors
            const higherLevel = level === 'A1' ? 'B1' : level === 'A2' ? 'B1' : 'A2'
            const higherWords = getWordList(higherLevel).words.filter((w) => w.pos === 'Adjektiv')
            const distractors = shuffleWithSeed(higherWords, seed + 700 + level.charCodeAt(0))
                .slice(0, 3)
                .map((w) => w.lemma)

            if (distractors.length === 3) {
                const options = shuffleWithSeed([target.lemma, ...distractors], seed + 800 + level.charCodeAt(0))
                questions.push({
                    id: `${level}-adj-0`,
                    level,
                    word: target.lemma,
                    questionType: 'translation',
                    questionText: `Welches Adjektiv gehört zum ${level}-Grundwortschatz?`,
                    options,
                    correctIndex: options.indexOf(target.lemma),
                })
            }
        }
    }

    return questions
}

// Evaluate placement test results and determine CEFR level
export function evaluatePlacementResult(
    answers: { questionId: string; isCorrect: boolean }[],
    questions: PlacementQuestion[],
): { level: CefrLevel; scores: Record<CefrLevel, { correct: number; total: number; percentage: number }> } {
    const scores: Record<string, { correct: number; total: number }> = {
        A1: { correct: 0, total: 0 },
        A2: { correct: 0, total: 0 },
        B1: { correct: 0, total: 0 },
    }

    for (const answer of answers) {
        const q = questions.find((qq) => qq.id === answer.questionId)
        if (!q) continue
        scores[q.level].total++
        if (answer.isCorrect) scores[q.level].correct++
    }

    const result = Object.fromEntries(
        Object.entries(scores).map(([level, s]) => [
            level,
            { ...s, percentage: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 },
        ])
    ) as Record<CefrLevel, { correct: number; total: number; percentage: number }>

    // Determine level: highest level with >= 60% correct
    let determinedLevel: CefrLevel = 'A1'
    if (result.A1.percentage >= 60) determinedLevel = 'A1'
    if (result.A2.percentage >= 60) determinedLevel = 'A2'
    if (result.B1.percentage >= 60) determinedLevel = 'B1'

    return { level: determinedLevel, scores: result }
}
