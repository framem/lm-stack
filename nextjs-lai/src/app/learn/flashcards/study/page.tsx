import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { StudyContent } from './study-content'

export default function FlashcardStudyPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <StudyContent />
        </Suspense>
    )
}
