import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { QuizContent } from './quiz-content'

export default function QuizPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <QuizContent />
        </Suspense>
    )
}
