import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { VocabContent } from './vocab-content'

export default function VocabularyPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <VocabContent />
        </Suspense>
    )
}
