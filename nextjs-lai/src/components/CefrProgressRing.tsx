'use client'

import { useState } from 'react'
import { Languages, Target, Calendar, Plus, Trash2, Info } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/src/components/ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/src/components/ui/tooltip'
import { setLearningGoal, removeLearningGoal } from '@/src/actions/learning-goal'

interface CefrProgressData {
    id: string
    language: string
    targetLevel: string
    deadline: Date | string | null
    vocabMastered: number
    vocabLearning: number
    vocabTotal: number
    targetCount: number
    percentage: number
}

interface CefrProgressRingProps {
    progress: CefrProgressData[]
}

const LANGUAGE_LABELS: Record<string, string> = {
    de: 'Deutsch',
    en: 'Englisch',
    es: 'Spanisch',
}

const LANGUAGE_FLAGS: Record<string, string> = {
    de: '\u{1F1E9}\u{1F1EA}',
    en: '\u{1F1EC}\u{1F1E7}',
    es: '\u{1F1EA}\u{1F1F8}',
}

const LEVEL_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
    A1: { ring: 'stroke-green-500', bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
    A2: { ring: 'stroke-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    B1: { ring: 'stroke-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
}

function ProgressRing({ percentage, level, size = 100 }: { percentage: number; level: string; size?: number }) {
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference
    const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.A1

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className="stroke-muted"
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={`${colors.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${colors.text}`}>{percentage}%</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{level}</span>
            </div>
        </div>
    )
}

export function CefrProgressRing({ progress }: CefrProgressRingProps) {
    const [setupOpen, setSetupOpen] = useState(false)

    if (progress.length === 0) {
        return (
            <>
                <Card className="border-dashed">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-muted">
                                <Target className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Sprachlernziel setzen</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <span>Verfolge deinen CEFR-Fortschritt mit einem Lernziel</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>
                                                    CEFR steht für "Common European Framework of Reference for Languages".
                                                    Es ist ein Standard zur Bewertung von Sprachkenntnissen: A1 (Anfänger),
                                                    A2 (Grundkenntnisse), B1 (fortgeschritten), bis C2 (muttersprachlich).
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSetupOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Ziel setzen
                        </Button>
                    </CardContent>
                </Card>
                <GoalSetupDialog open={setupOpen} onOpenChange={setSetupOpen} />
            </>
        )
    }

    return (
        <>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Languages className="h-5 w-5" />
                            <h3 className="font-semibold">CEFR-Fortschritt</h3>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                        <p>
                                            CEFR steht für "Common European Framework of Reference for Languages".
                                            Es ist ein Standard zur Bewertung von Sprachkenntnissen: A1 (Anfänger),
                                            A2 (Grundkenntnisse), B1 (fortgeschritten), bis C2 (muttersprachlich).
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSetupOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Ziel hinzufügen
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {progress.map((p) => {
                            const colors = LEVEL_COLORS[p.targetLevel] ?? LEVEL_COLORS.A1
                            const deadlineStr = p.deadline
                                ? new Date(p.deadline).toLocaleDateString('de-DE', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })
                                : null

                            return (
                                <div key={p.id} className="flex items-center gap-4">
                                    <ProgressRing percentage={p.percentage} level={p.targetLevel} />
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{LANGUAGE_FLAGS[p.language]}</span>
                                            <span className="font-semibold">
                                                {LANGUAGE_LABELS[p.language] ?? p.language}
                                            </span>
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                                {p.targetLevel}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {p.vocabMastered} / {p.targetCount} Wörter beherrscht
                                        </p>
                                        {p.vocabLearning > p.vocabMastered && (
                                            <p className="text-xs text-muted-foreground">
                                                + {p.vocabLearning - p.vocabMastered} in Wiederholung
                                            </p>
                                        )}
                                        {deadlineStr && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Ziel: {deadlineStr}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={async () => {
                                            await removeLearningGoal(p.id)
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
            <GoalSetupDialog open={setupOpen} onOpenChange={setSetupOpen} />
        </>
    )
}

function GoalSetupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [language, setLanguage] = useState('')
    const [level, setLevel] = useState('A1')
    const [deadline, setDeadline] = useState('')
    const [saving, setSaving] = useState(false)

    async function handleSave() {
        if (!language) return
        setSaving(true)
        try {
            await setLearningGoal({ language, targetLevel: level, deadline: deadline || null })
            onOpenChange(false)
            setLanguage('')
            setLevel('A1')
            setDeadline('')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Lernziel setzen</DialogTitle>
                    <DialogDescription className="flex items-center gap-1.5">
                        <span>Wähle eine Sprache und dein CEFR-Zielniveau</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>
                                        CEFR steht für "Common European Framework of Reference for Languages".
                                        Es ist ein Standard zur Bewertung von Sprachkenntnissen: A1 (Anfänger),
                                        A2 (Grundkenntnisse), B1 (fortgeschritten), bis C2 (muttersprachlich).
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    {/* Language selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Sprache</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { code: 'en', label: 'Englisch', flag: '\u{1F1EC}\u{1F1E7}' },
                                { code: 'es', label: 'Spanisch', flag: '\u{1F1EA}\u{1F1F8}' },
                                { code: 'de', label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => setLanguage(lang.code)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                                        language === lang.code
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'hover:bg-accent'
                                    }`}
                                >
                                    <span className="text-2xl">{lang.flag}</span>
                                    <span className="text-xs font-medium">{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Zielniveau</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['A1', 'A2', 'B1'].map((l) => {
                                const colors = LEVEL_COLORS[l]!
                                return (
                                    <button
                                        key={l}
                                        type="button"
                                        onClick={() => setLevel(l)}
                                        className={`p-3 rounded-lg border text-center font-semibold transition-colors ${
                                            level === l
                                                ? `border-primary ${colors.bg} ${colors.text} ring-1 ring-primary`
                                                : 'hover:bg-accent'
                                        }`}
                                    >
                                        {l}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Optional deadline */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Zieldatum (optional)</label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={!language || saving}
                        className="w-full"
                    >
                        {saving ? 'Wird gespeichert...' : 'Lernziel speichern'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
