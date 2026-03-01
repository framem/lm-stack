import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getStudyPlans } from '@/src/data-access/study-plan'
import { getDocuments } from '@/src/data-access/documents'
import { PlanContent } from './plan-content'

async function PlanData() {
    const [plansRaw, docsRaw] = await Promise.all([
        getStudyPlans(),
        getDocuments(),
    ])

    const plans = plansRaw.map((p) => ({
        id: p.id,
        title: p.title,
        examDate: p.examDate.toISOString(),
        documentIds: p.documentIds,
        status: p.status,
        tasks: p.tasks.map((t) => ({
            id: t.id,
            date: t.date.toISOString(),
            topic: t.topic,
            description: t.description,
            taskType: t.taskType,
            documentId: t.documentId,
            status: t.status,
            completedAt: t.completedAt?.toISOString() ?? null,
        })),
    }))

    const documents = docsRaw.map((d) => ({
        id: d.id,
        title: d.title,
        fileType: d.fileType,
        subject: d.subject,
    }))

    return <PlanContent initialPlans={plans} initialDocuments={documents} />
}

export default function PlanPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <PlanData />
        </Suspense>
    )
}
