import { Rating } from '@/src/lib/spaced-repetition'

// 3-point flashcard rating scale (document flashcards)
export const FLASHCARD_RATINGS = [
    { quality: 1, label: 'Kenne ich nicht', variant: 'destructive' as const },
    { quality: 3, label: 'Unsicher', variant: 'outline' as const },
    { quality: 5, label: 'Kenne ich', variant: 'default' as const },
]

// 4-point FSRS vocabulary rating scale (spaced repetition)
export const VOCAB_RATINGS = [
    { rating: Rating.Again, label: 'Nochmal', variant: 'destructive' as const },
    { rating: Rating.Hard, label: 'Schwer', variant: 'outline' as const },
    { rating: Rating.Good, label: 'Gut', variant: 'default' as const },
    { rating: Rating.Easy, label: 'Einfach', variant: 'secondary' as const },
]
