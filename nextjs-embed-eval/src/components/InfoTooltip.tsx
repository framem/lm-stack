'use client'

import { Info } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/src/components/ui/tooltip'

interface InfoTooltipProps {
    text: string
}

/** Small info icon that reveals a tooltip on hover. */
export function InfoTooltip({ text }: InfoTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground inline-block ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
