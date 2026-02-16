'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/src/components/ui/collapsible'

interface ConjugationData {
    present?: Record<string, string>
    past?: Record<string, string>
    perfect?: Record<string, string>
}

interface ConjugationTableProps {
    conjugation: ConjugationData
}

const TENSE_LABELS: Record<string, string> = {
    present: 'Präsens',
    past: 'Präteritum',
    perfect: 'Perfekt',
}

function TenseTable({ label, forms }: { label: string; forms: Record<string, string> }) {
    const entries = Object.entries(forms)
    if (entries.length === 0) return null

    return (
        <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                {entries.map(([pronoun, form]) => (
                    <div key={pronoun} className="flex gap-2">
                        <span className="text-muted-foreground w-8 text-right shrink-0">{pronoun}</span>
                        <span>{form}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function ConjugationTable({ conjugation }: ConjugationTableProps) {
    const [open, setOpen] = useState(false)

    const tenses = (['present', 'past', 'perfect'] as const).filter(
        (t) => conjugation[t] && Object.keys(conjugation[t]!).length > 0
    )

    if (tenses.length === 0) return null

    return (
        <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
            <CollapsibleTrigger
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
                />
                Konjugation
            </CollapsibleTrigger>
            <CollapsibleContent onClick={(e) => e.stopPropagation()}>
                <div className="mt-2 space-y-3 rounded-md border bg-muted/30 p-3">
                    {tenses.map((t) => (
                        <TenseTable key={t} label={TENSE_LABELS[t]} forms={conjugation[t]!} />
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
