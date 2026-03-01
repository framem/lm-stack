import { Rating } from '@/src/lib/spaced-repetition'

// 4-point FSRS rating scale (used for all flashcard types)
export const RATINGS = [
    { rating: Rating.Again, label: 'Nochmal', variant: 'destructive' as const },
    { rating: Rating.Hard, label: 'Schwer', variant: 'outline' as const },
    { rating: Rating.Good, label: 'Gut', variant: 'default' as const },
    { rating: Rating.Easy, label: 'Einfach', variant: 'secondary' as const },
]

/** @deprecated Use RATINGS instead */
export const VOCAB_RATINGS = RATINGS
