'use client'

import { Badge } from '@/src/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/src/components/ui/tooltip'

const CEFR_INFO: Record<string, { label: string; description: string }> = {
    A1: { label: 'Anfänger', description: 'Einfache Alltagsausdrücke und grundlegende Sätze' },
    A2: { label: 'Grundlagen', description: 'Häufige Ausdrücke und einfache Routinesituationen' },
    B1: { label: 'Mittelstufe', description: 'Vertraute Themen und einfache zusammenhängende Texte' },
    B2: { label: 'Gute Mittelstufe', description: 'Komplexe Texte und spontane Gespräche' },
    C1: { label: 'Fortgeschritten', description: 'Anspruchsvolle Texte und fließende Kommunikation' },
    C2: { label: 'Experte', description: 'Müheloses Verstehen und nuancierte Ausdrucksweise' },
}

interface CefrBadgeProps {
    level: string
    className?: string
}

export function CefrBadge({ level, className }: CefrBadgeProps) {
    const info = CEFR_INFO[level.toUpperCase()]
    if (!info) {
        return <Badge variant="outline" className={className}>{level}</Badge>
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className={`cursor-help ${className ?? ''}`}>
                        {level} — {info.label}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-[200px]">
                        <strong>CEFR {level}:</strong> {info.description}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
