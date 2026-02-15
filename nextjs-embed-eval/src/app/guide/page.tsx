import Link from 'next/link'
import { Navigation } from '@/src/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import {
    BookText, Brain, MessageSquare, FlaskConical,
    BarChart3, GitCompare, Grid3X3, ArrowRight,
} from 'lucide-react'

// Guide step definition
interface GuideStep {
    number: number
    title: string
    icon: React.ReactNode
    href: string
    description: string
    details?: string[]
    optional?: boolean
}

const steps: GuideStep[] = [
    {
        number: 1,
        title: 'Texte hochladen',
        icon: <BookText className="h-5 w-5" />,
        href: '/texts',
        description:
            'Lade deine Quelltexte hoch, die als Wissensbasis dienen sollen. Diese Texte werden anschließend in kleinere Chunks aufgeteilt, auf denen die Embedding-Suche basiert.',
    },
    {
        number: 2,
        title: 'Embedding-Modelle registrieren',
        icon: <Brain className="h-5 w-5" />,
        href: '/models',
        description:
            'Registriere die Modelle, die du vergleichen möchtest (z.\u00A0B. Nomic, BGE, E5).',
        details: [
            'Manche Modelle benötigen Instruction Prefixes: einen Query-Prefix für Suchphrasen und einen Document-Prefix für Chunks.',
            'Diese Prefixe werden beim Embedding automatisch vorangestellt und verbessern die Suchergebnisse signifikant.',
        ],
    },
    {
        number: 3,
        title: 'Suchphrasen mit Ground Truth anlegen',
        icon: <MessageSquare className="h-5 w-5" />,
        href: '/phrases',
        description:
            'Erstelle Suchphrasen und weise ihnen den erwarteten Chunk (Ground Truth) zu. So kann die Evaluation messen, ob das Modell den richtigen Chunk findet.',
        details: [
            'Die Ground-Truth-Zuordnung wird bei Re-Chunking automatisch neu zugeordnet, sodass du die Phrasen nicht erneut zuweisen musst.',
        ],
    },
    {
        number: 4,
        title: 'Embeddings erstellen',
        icon: <FlaskConical className="h-5 w-5" />,
        href: '/embed',
        description:
            'Wähle Chunk-Größe, Overlap und Strategie, dann starte das Embedding. Alle Chunks und Suchphrasen werden in Vektoren umgewandelt.',
        details: [
            'Satzgrenzen — Splittet an Satzgrenzen. Gut für natürliche Texte.',
            'Absatzgrenzen — Splittet an Absätzen. Gut für strukturierte Dokumente.',
            'Rekursiv — Hierarchisches Splitting (Absätze → Sätze → Wörter). Flexibel für gemischte Inhalte.',
        ],
    },
    {
        number: 5,
        title: 'Evaluation durchführen',
        icon: <BarChart3 className="h-5 w-5" />,
        href: '/evaluate',
        description:
            'Starte die Evaluation, um zu sehen, wie gut jedes Modell die richtigen Chunks findet.',
        details: [
            'Top-K Accuracy — Anteil der Phrasen, bei denen der richtige Chunk unter den Top-K Ergebnissen ist.',
            'MRR (Mean Reciprocal Rank) — Durchschnittlicher Kehrwert der Position des richtigen Chunks.',
            'nDCG (Normalized Discounted Cumulative Gain) — Berücksichtigt die Position aller relevanten Ergebnisse.',
            'Avg. Similarity — Durchschnittliche Kosinus-Ähnlichkeit zwischen Phrase und bestem Chunk.',
        ],
    },
    {
        number: 6,
        title: 'Vergleichen',
        icon: <GitCompare className="h-5 w-5" />,
        href: '/compare',
        description:
            'Vergleiche Modelle und Konfigurationen nebeneinander in Tabelle und Chart. So findest du die beste Kombination aus Modell und Chunk-Einstellungen.',
    },
    {
        number: 7,
        title: 'Grid-Search (optional)',
        icon: <Grid3X3 className="h-5 w-5" />,
        href: '/grid-search',
        description:
            'Teste automatisch verschiedene Kombinationen aus Chunk-Größe, Overlap und Strategie und finde die optimale Einstellung für jedes Modell.',
        optional: true,
    },
]

export default function GuidePage() {
    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Anleitung: Embedding-Evaluierung</h1>
                    <p className="text-muted-foreground mt-1">
                        Schritt-für-Schritt-Anleitung zum Vergleich von Embedding-Modellen
                    </p>
                </div>

                <div className="space-y-4">
                    {steps.map(step => (
                        <Card key={step.number} className={step.optional ? 'border-dashed' : ''}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                                        {step.number}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        {step.icon}
                                        {step.title}
                                        {step.optional && (
                                            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                                        )}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pl-[4.25rem] space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    {step.description}
                                </p>

                                {step.details && step.details.length > 0 && (
                                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                        {step.details.map((detail, i) => (
                                            <li key={i}>{detail}</li>
                                        ))}
                                    </ul>
                                )}

                                <Link href={step.href}>
                                    <Button variant="outline" size="sm" className="mt-1">
                                        {step.title}
                                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    )
}
