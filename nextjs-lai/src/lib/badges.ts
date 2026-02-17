/** Badge definitions and computation from user stats */

export interface BadgeDefinition {
    id: string
    icon: string  // emoji
    title: string
    description: string
    check: (stats: BadgeStats) => boolean
}

export interface BadgeStats {
    totalVocab: number
    masteredVocab: number
    totalQuizzes: number
    quizCorrectRate: number  // 0-100
    currentStreak: number
    longestStreak: number
    totalFlashcards: number
    totalDocuments: number
    totalXp: number
}

export interface EarnedBadge extends BadgeDefinition {
    earned: true
}

export const BADGES: BadgeDefinition[] = [
    // Vocabulary milestones
    {
        id: 'vocab-10',
        icon: '\u{1F331}',
        title: 'Erste Schritte',
        description: '10 Vokabeln gelernt',
        check: (s) => s.masteredVocab >= 10,
    },
    {
        id: 'vocab-50',
        icon: '\u{1F33F}',
        title: 'Wortschatz-Sammler',
        description: '50 Vokabeln gelernt',
        check: (s) => s.masteredVocab >= 50,
    },
    {
        id: 'vocab-100',
        icon: '\u{1F333}',
        title: 'Wortschatz-Profi',
        description: '100 Vokabeln beherrscht',
        check: (s) => s.masteredVocab >= 100,
    },
    {
        id: 'vocab-250',
        icon: '\u{1F3C6}',
        title: 'Vokabel-Champion',
        description: '250 Vokabeln beherrscht',
        check: (s) => s.masteredVocab >= 250,
    },

    // Streak milestones
    {
        id: 'streak-3',
        icon: '\u{1F525}',
        title: 'Auf Kurs',
        description: '3-Tage-Streak erreicht',
        check: (s) => s.longestStreak >= 3,
    },
    {
        id: 'streak-7',
        icon: '\u{1F525}\u{1F525}',
        title: 'Fleißig!',
        description: '7-Tage-Streak erreicht',
        check: (s) => s.longestStreak >= 7,
    },
    {
        id: 'streak-30',
        icon: '\u{2B50}',
        title: 'Lern-Maschine',
        description: '30-Tage-Streak erreicht',
        check: (s) => s.longestStreak >= 30,
    },

    // Quiz milestones
    {
        id: 'quiz-first',
        icon: '\u{2753}',
        title: 'Erstes Quiz',
        description: 'Erstes Quiz abgeschlossen',
        check: (s) => s.totalQuizzes >= 1,
    },
    {
        id: 'quiz-10',
        icon: '\u{1F4DA}',
        title: 'Quiz-Enthusiast',
        description: '10 Quizze absolviert',
        check: (s) => s.totalQuizzes >= 10,
    },
    {
        id: 'quiz-ace',
        icon: '\u{1F451}',
        title: 'Perfektionist',
        description: 'Quiz mit 100% bestanden',
        check: (s) => s.totalQuizzes >= 1 && s.quizCorrectRate >= 100,
    },

    // Document milestones
    {
        id: 'doc-first',
        icon: '\u{1F4C4}',
        title: 'Erster Upload',
        description: 'Erstes Lernmaterial hochgeladen',
        check: (s) => s.totalDocuments >= 1,
    },
    {
        id: 'doc-5',
        icon: '\u{1F4DA}',
        title: 'Bibliothek',
        description: '5 Lernmaterialien hochgeladen',
        check: (s) => s.totalDocuments >= 5,
    },

    // XP milestones
    {
        id: 'xp-100',
        icon: '\u{26A1}',
        title: 'Lernbeginn',
        description: '100 XP gesammelt',
        check: (s) => s.totalXp >= 100,
    },
    {
        id: 'xp-500',
        icon: '\u{1F4AB}',
        title: 'Aufsteiger',
        description: '500 XP gesammelt',
        check: (s) => s.totalXp >= 500,
    },
    {
        id: 'xp-1000',
        icon: '\u{1F31F}',
        title: 'Lern-Veteran',
        description: '1.000 XP gesammelt',
        check: (s) => s.totalXp >= 1000,
    },
]

/** Compute which badges the user has earned */
export function computeEarnedBadges(stats: BadgeStats): EarnedBadge[] {
    return BADGES
        .filter((b) => b.check(stats))
        .map((b) => ({ ...b, earned: true as const }))
}

/** XP values for different activities */
export const XP_VALUES = {
    flashcardReview: 5,
    quizAnswer: 10,
    quizCorrect: 5,  // bonus for correct answer
    documentUpload: 20,
    dailyGoalReached: 25,
    streakDay: 10,
} as const
