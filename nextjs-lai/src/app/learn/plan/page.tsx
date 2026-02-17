import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { PlanContent } from './plan-content'

export default function PlanPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <PlanContent />
        </Suspense>
    )
}
