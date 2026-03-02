import { prisma } from '@/src/lib/prisma'

// ── Competency area definitions ──

export type CompetencyArea =
    | 'grammar'
    | 'vocabulary'
    | 'listening'
    | 'reading'
    | 'writing'
    | 'speaking'

export interface CompetencyScore {
    area: CompetencyArea
    label: string
    score: number          // 0-100
    sampleSize: number     // number of data points used
    trend: 'up' | 'down' | 'stable'
}

export interface LearningRecommendation {
    area: CompetencyArea
    label: string
    priority: 'high' | 'medium' | 'low'
    message: string
    action: string         // URL path
    actionLabel: string
}

export interface AdaptiveLearningData {
    competencies: CompetencyScore[]
    recommendations: LearningRecommendation[]
    overallLevel: string   // estimated CEFR level
}

// ── Analyze quiz performance by question type to infer grammar vs. vocabulary skill ──

async function getQuizCompetencies(languageName: string) {
    // Find all quizzes belonging to documents for this language
    const quizzes = await prisma.quiz.findMany({
        where: {
            document: { subject: languageName },
        },
        select: { id: true },
    })

    if (quizzes.length === 0) return { grammar: null, vocabulary: null }

    const quizIds = quizzes.map((q) => q.id)

    // Get all attempts for these quizzes grouped by question type
    const questions = await prisma.quizQuestion.findMany({
        where: { quizId: { in: quizIds } },
        select: {
            id: true,
            questionType: true,
            attempts: {
                select: { isCorrect: true, freeTextScore: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 5, // last 5 attempts per question
            },
        },
    })

    // Grammar-related question types
    const grammarTypes = new Set(['conjugation', 'cloze', 'fillInBlanks', 'sentenceOrder'])
    // Vocabulary-related question types
    const vocabTypes = new Set(['singleChoice', 'multipleChoice', 'freetext', 'truefalse'])

    let grammarCorrect = 0, grammarTotal = 0
    let vocabCorrect = 0, vocabTotal = 0

    for (const q of questions) {
        for (const attempt of q.attempts) {
            const score = attempt.freeTextScore !== null ? attempt.freeTextScore : (attempt.isCorrect ? 1 : 0)
            if (grammarTypes.has(q.questionType)) {
                grammarTotal++
                grammarCorrect += score
            } else if (vocabTypes.has(q.questionType)) {
                vocabTotal++
                vocabCorrect += score
            }
        }
    }

    return {
        grammar: grammarTotal > 0 ? { score: Math.round((grammarCorrect / grammarTotal) * 100), count: grammarTotal } : null,
        vocabulary: vocabTotal > 0 ? { score: Math.round((vocabCorrect / vocabTotal) * 100), count: vocabTotal } : null,
    }
}

// ── Analyze flashcard mastery for vocabulary competency ──

async function getFlashcardCompetency(languageName: string) {
    const cards = await prisma.flashcard.findMany({
        where: {
            document: { subject: languageName },
            isVocabulary: true,
        },
        select: {
            id: true,
            progress: {
                select: { reps: true, lapses: true, repetitions: true },
            },
        },
    })

    if (cards.length === 0) return null

    let mastered = 0
    let learning = 0
    for (const card of cards) {
        const reps = card.progress?.reps ?? card.progress?.repetitions ?? 0
        if (reps >= 3) mastered++
        else if (reps > 0) learning++
    }

    const score = Math.round(((mastered + learning * 0.3) / cards.length) * 100)
    return { score: Math.min(score, 100), count: cards.length }
}

// ── Analyze conversation evaluations for speaking competency ──

async function getSpeakingCompetency(languageCode: string) {
    const evaluations = await prisma.conversationEvaluation.findMany({
        where: { language: languageCode },
        select: {
            grammarScore: true,
            vocabularyScore: true,
            communicationScore: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    })

    if (evaluations.length === 0) return null

    // Communication score is the best proxy for speaking
    const avgComm = evaluations.reduce((s, e) => s + e.communicationScore, 0) / evaluations.length
    // Scale from 1-10 to 0-100
    const score = Math.round((avgComm / 10) * 100)

    return { score, count: evaluations.length }
}

// ── Analyze listening exercises (listening quizzes) ──

async function getListeningCompetency(languageName: string) {
    const questions = await prisma.quizQuestion.findMany({
        where: {
            questionType: 'listening',
            quiz: { document: { subject: languageName } },
        },
        select: {
            attempts: {
                select: { isCorrect: true, freeTextScore: true },
                orderBy: { createdAt: 'desc' },
                take: 5,
            },
        },
    })

    let correct = 0, total = 0
    for (const q of questions) {
        for (const a of q.attempts) {
            total++
            correct += a.freeTextScore !== null ? a.freeTextScore : (a.isCorrect ? 1 : 0)
        }
    }

    if (total === 0) return null
    return { score: Math.round((correct / total) * 100), count: total }
}

// ── Analyze learning session time for reading/writing activity ──

async function getActivityTime(activityType: string) {
    const sessions = await prisma.learningSession.findMany({
        where: {
            activityType,
            durationSeconds: { not: null },
        },
        select: { durationSeconds: true },
        orderBy: { startedAt: 'desc' },
        take: 20,
    })

    if (sessions.length === 0) return null
    const totalMinutes = sessions.reduce((s, sess) => s + (sess.durationSeconds ?? 0), 0) / 60
    return { totalMinutes: Math.round(totalMinutes), count: sessions.length }
}

// ── Compute trend by comparing recent vs older performance ──

function computeTrend(recentScore: number, olderScore: number | null): 'up' | 'down' | 'stable' {
    if (olderScore === null) return 'stable'
    const diff = recentScore - olderScore
    if (diff > 5) return 'up'
    if (diff < -5) return 'down'
    return 'stable'
}

// ── Estimate overall CEFR level from competency scores ──

function estimateCEFR(scores: CompetencyScore[]): string {
    const validScores = scores.filter((s) => s.sampleSize > 0)
    if (validScores.length === 0) return 'A1'

    const avg = validScores.reduce((s, c) => s + c.score, 0) / validScores.length
    if (avg >= 90) return 'C1'
    if (avg >= 75) return 'B2'
    if (avg >= 60) return 'B1'
    if (avg >= 40) return 'A2'
    return 'A1'
}

// ── Build recommendations based on weaknesses ──

function buildRecommendations(
    competencies: CompetencyScore[],
    languageCode: string,
): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = []

    // Sort by score ascending (weakest first)
    const sorted = [...competencies].sort((a, b) => a.score - b.score)

    for (const comp of sorted) {
        // Skip areas with no data — suggest trying them
        if (comp.sampleSize === 0) {
            recommendations.push({
                area: comp.area,
                label: comp.label,
                priority: 'medium',
                message: `Du hast noch keine ${comp.label}-Übungen gemacht. Probiere es aus!`,
                action: getActionUrl(comp.area, languageCode),
                actionLabel: getActionLabel(comp.area),
            })
            continue
        }

        if (comp.score < 40) {
            recommendations.push({
                area: comp.area,
                label: comp.label,
                priority: 'high',
                message: `${comp.label} ist ein Schwachpunkt (${comp.score}%). Konzentriere dich auf gezielte Übungen.`,
                action: getActionUrl(comp.area, languageCode),
                actionLabel: getActionLabel(comp.area),
            })
        } else if (comp.score < 70) {
            recommendations.push({
                area: comp.area,
                label: comp.label,
                priority: 'medium',
                message: `${comp.label} kann noch verbessert werden (${comp.score}%). Regelmäßiges Üben hilft.`,
                action: getActionUrl(comp.area, languageCode),
                actionLabel: getActionLabel(comp.area),
            })
        }
    }

    // If all areas are good, encourage maintenance
    if (recommendations.length === 0 && competencies.some((c) => c.sampleSize > 0)) {
        const weakest = sorted[0]
        recommendations.push({
            area: weakest.area,
            label: weakest.label,
            priority: 'low',
            message: `Sehr gut! Alle Bereiche sind auf einem guten Niveau. Halte deinen ${weakest.label}-Bereich aktuell.`,
            action: getActionUrl(weakest.area, languageCode),
            actionLabel: getActionLabel(weakest.area),
        })
    }

    return recommendations.slice(0, 4) // max 4 recommendations
}

function getActionUrl(area: CompetencyArea, code: string): string {
    switch (area) {
        case 'grammar': return `/learn/language/${code}/writing`
        case 'vocabulary': return `/learn/language/${code}/study?mode=flip`
        case 'listening': return `/learn/language/${code}/listening`
        case 'reading': return `/learn/language/${code}/reading`
        case 'writing': return `/learn/language/${code}/writing`
        case 'speaking': return `/learn/language/${code}/conversation`
    }
}

function getActionLabel(area: CompetencyArea): string {
    switch (area) {
        case 'grammar': return 'Grammatik üben'
        case 'vocabulary': return 'Vokabeln lernen'
        case 'listening': return 'Hörübung starten'
        case 'reading': return 'Leseübung starten'
        case 'writing': return 'Schreibübung starten'
        case 'speaking': return 'Konversation starten'
    }
}

// ── Main entry point ──

export async function getAdaptiveLearningData(
    languageCode: string,
    languageName: string,
): Promise<AdaptiveLearningData> {
    const [quizComp, flashcardComp, speakingComp, listeningComp, readingActivity, writingActivity] =
        await Promise.all([
            getQuizCompetencies(languageName),
            getFlashcardCompetency(languageName),
            getSpeakingCompetency(languageCode),
            getListeningCompetency(languageName),
            getActivityTime('reading'),
            getActivityTime('writing'),
        ])

    // Merge vocabulary signal from quizzes + flashcards
    let vocabScore = 0
    let vocabSamples = 0
    if (quizComp.vocabulary && flashcardComp) {
        vocabScore = Math.round(quizComp.vocabulary.score * 0.4 + flashcardComp.score * 0.6)
        vocabSamples = quizComp.vocabulary.count + flashcardComp.count
    } else if (flashcardComp) {
        vocabScore = flashcardComp.score
        vocabSamples = flashcardComp.count
    } else if (quizComp.vocabulary) {
        vocabScore = quizComp.vocabulary.score
        vocabSamples = quizComp.vocabulary.count
    }

    // Reading/writing scores based on quiz grammar + activity time
    // If no direct reading quiz data, use activity presence as a low-confidence signal
    const readingScore = quizComp.grammar
        ? Math.round(quizComp.grammar.score * 0.8 + (readingActivity ? 20 : 0))
        : readingActivity ? 30 : 0
    const readingSamples = (quizComp.grammar?.count ?? 0) + (readingActivity?.count ?? 0)

    const writingScore = quizComp.grammar
        ? Math.round(quizComp.grammar.score * 0.7 + (writingActivity ? 20 : 0))
        : writingActivity ? 25 : 0
    const writingSamples = (quizComp.grammar?.count ?? 0) + (writingActivity?.count ?? 0)

    const competencies: CompetencyScore[] = [
        {
            area: 'grammar',
            label: 'Grammatik',
            score: quizComp.grammar?.score ?? 0,
            sampleSize: quizComp.grammar?.count ?? 0,
            trend: 'stable',
        },
        {
            area: 'vocabulary',
            label: 'Wortschatz',
            score: vocabScore,
            sampleSize: vocabSamples,
            trend: 'stable',
        },
        {
            area: 'listening',
            label: 'Hörverstehen',
            score: listeningComp?.score ?? 0,
            sampleSize: listeningComp?.count ?? 0,
            trend: 'stable',
        },
        {
            area: 'reading',
            label: 'Leseverstehen',
            score: Math.min(readingScore, 100),
            sampleSize: readingSamples,
            trend: 'stable',
        },
        {
            area: 'writing',
            label: 'Schreiben',
            score: Math.min(writingScore, 100),
            sampleSize: writingSamples,
            trend: 'stable',
        },
        {
            area: 'speaking',
            label: 'Sprechen',
            score: speakingComp?.score ?? 0,
            sampleSize: speakingComp?.count ?? 0,
            trend: 'stable',
        },
    ]

    const overallLevel = estimateCEFR(competencies)
    const recommendations = buildRecommendations(competencies, languageCode)

    return { competencies, recommendations, overallLevel }
}
