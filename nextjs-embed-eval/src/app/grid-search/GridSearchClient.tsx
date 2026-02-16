'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/src/components/ui/table'
import { ModelSelector } from '@/src/components/ModelSelector'
import { STRATEGY_LABELS, type ChunkStrategy } from '@/src/lib/chunking'
import { Search, Trophy, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Play, Square, ChevronRight, ChevronDown, CheckCircle2, XCircle } from 'lucide-react'

// ---- Types ----

interface Model {
    id: string
    name: string
    provider: string
    dimensions: number
}

interface GridConfig {
    chunkSize: number
    chunkOverlap: number
    strategy: ChunkStrategy
}

interface GridMetrics {
    avgSimilarity: number
    topKAccuracy1: number
    topKAccuracy3: number
    topKAccuracy5: number
    mrrScore: number
    ndcgScore: number
}

interface RetrievedChunk {
    chunkIndex: number
    content: string
    sourceTitle: string
    similarity: number
    isExpected: boolean
}

interface PhraseDetail {
    phrase: string
    category: string | null
    expectedChunk: {
        chunkIndex: number
        content: string
        sourceTitle: string
    } | null
    retrievedChunks: RetrievedChunk[]
    expectedRank: number | null
    isHit: boolean
}

interface GridResult {
    config: GridConfig
    metrics: GridMetrics
    runId: string
    totalChunks: number
    totalPhrases: number
    details: PhraseDetail[]
}

interface GridCompleteData {
    results: GridResult[]
    recommendation: {
        chunkSize: number
        chunkOverlap: number
        strategy: ChunkStrategy
        metrics: GridMetrics
        runId: string
    } | null
}

interface ConfigProgress {
    current: number
    total: number
    chunkSize: number
    chunkOverlap: number
    strategy: ChunkStrategy
}

// ---- Available values for checkboxes ----

const CHUNK_SIZES = [50, 100, 150, 200, 300, 400, 500, 750, 1000]
const CHUNK_OVERLAPS = [0, 10, 20, 30, 60, 90, 120]
const STRATEGIES: ChunkStrategy[] = ['sentence', 'paragraph', 'recursive']

const DEFAULT_SIZES = new Set([100, 200, 300, 500])
const DEFAULT_OVERLAPS = new Set([0, 30, 60])
const DEFAULT_STRATEGIES = new Set<ChunkStrategy>(['sentence'])

// ---- Sort helpers ----

type SortKey = 'config' | 'chunks' | 'top1' | 'top3' | 'top5' | 'mrr' | 'ndcg' | 'avgSim'
type SortDir = 'asc' | 'desc'

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortDir === 'asc'
        ? <ArrowUp className="h-3 w-3 ml-1" />
        : <ArrowDown className="h-3 w-3 ml-1" />
}

function getSortValue(result: GridResult, key: SortKey): number | string {
    switch (key) {
        case 'config': return `${result.config.chunkSize}-${result.config.chunkOverlap}-${result.config.strategy}`
        case 'chunks': return result.totalChunks
        case 'top1': return result.metrics.topKAccuracy1
        case 'top3': return result.metrics.topKAccuracy3
        case 'top5': return result.metrics.topKAccuracy5
        case 'mrr': return result.metrics.mrrScore
        case 'ndcg': return result.metrics.ndcgScore
        case 'avgSim': return result.metrics.avgSimilarity
    }
}

// ---- Format helpers ----

function formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`
}

function formatScore(value: number): string {
    return value.toFixed(4)
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms} ms`
    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(1)} s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes} min ${remainingSeconds} s`
}

// ---- Highlight helper ----

/**
 * Highlights occurrences of `phrase` within `content`.
 * Normalizes whitespace for matching, shows context around the match.
 */
function highlightPhrase(content: string, phrase: string): React.ReactNode {
    if (!phrase) return content.slice(0, 150) + (content.length > 150 ? '...' : '')

    const normalized = content.replace(/\s+/g, ' ')
    const normalizedPhrase = phrase.replace(/\s+/g, ' ')
    const idx = normalized.toLowerCase().indexOf(normalizedPhrase.toLowerCase())

    if (idx === -1) {
        return content.length > 150 ? content.slice(0, 150) + '...' : content
    }

    const matchEnd = idx + normalizedPhrase.length
    const ctxBefore = 60
    const ctxAfter = 60
    const start = Math.max(0, idx - ctxBefore)
    const end = Math.min(normalized.length, matchEnd + ctxAfter)

    return (
        <>
            {start > 0 && '...'}
            {normalized.slice(start, idx)}
            <mark className="bg-yellow-200 dark:bg-yellow-900/60 rounded px-0.5">
                {normalized.slice(idx, matchEnd)}
            </mark>
            {normalized.slice(matchEnd, end)}
            {end < normalized.length && '...'}
        </>
    )
}

// ---- Component ----

interface GridSearchClientProps {
    models: Model[]
}

export function GridSearchClient({ models }: GridSearchClientProps) {
    // Config state
    const [selectedModelId, setSelectedModelId] = useState('')
    const [selectedSizes, setSelectedSizes] = useState<Set<number>>(new Set(DEFAULT_SIZES))
    const [selectedOverlaps, setSelectedOverlaps] = useState<Set<number>>(new Set(DEFAULT_OVERLAPS))
    const [selectedStrategies, setSelectedStrategies] = useState<Set<ChunkStrategy>>(new Set(DEFAULT_STRATEGIES))

    // SSE state
    const [isRunning, setIsRunning] = useState(false)
    const [configProgress, setConfigProgress] = useState<ConfigProgress | null>(null)
    const [progressMessage, setProgressMessage] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [results, setResults] = useState<GridResult[]>([])
    const [completeData, setCompleteData] = useState<GridCompleteData | null>(null)
    const [elapsed, setElapsed] = useState(0)
    const abortRef = useRef<AbortController | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Sort state
    const [sortKey, setSortKey] = useState<SortKey>('top1')
    const [sortDir, setSortDir] = useState<SortDir>('desc')

    // Expand state for detail rows
    const [expandedRunIds, setExpandedRunIds] = useState<Set<string>>(new Set())

    // Applying recommendation state
    const [isApplying, setIsApplying] = useState(false)
    const [applyDone, setApplyDone] = useState(false)

    // Calculate total combinations (skip where overlap >= size)
    const totalCombinations = Array.from(selectedSizes).reduce((sum, size) => {
        const validOverlaps = Array.from(selectedOverlaps).filter(o => o < size).length
        return sum + validOverlaps * selectedStrategies.size
    }, 0)

    // Toggle helpers
    function toggleSize(size: number) {
        setSelectedSizes(prev => {
            const next = new Set(prev)
            if (next.has(size)) next.delete(size)
            else next.add(size)
            return next
        })
    }

    function toggleOverlap(overlap: number) {
        setSelectedOverlaps(prev => {
            const next = new Set(prev)
            if (next.has(overlap)) next.delete(overlap)
            else next.add(overlap)
            return next
        })
    }

    function toggleStrategy(strategy: ChunkStrategy) {
        setSelectedStrategies(prev => {
            const next = new Set(prev)
            if (next.has(strategy)) next.delete(strategy)
            else next.add(strategy)
            return next
        })
    }

    // Sort handler
    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir('desc')
        }
    }

    // Sorted results for display
    const sortedResults = [...(completeData?.results ?? results)].sort((a, b) => {
        const aVal = getSortValue(a, sortKey)
        const bVal = getSortValue(b, sortKey)
        const cmp = typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal))
        return sortDir === 'asc' ? cmp : -cmp
    })

    // Best values for highlighting
    const bestValues = sortedResults.length > 1 ? {
        top1: Math.max(...sortedResults.map(r => r.metrics.topKAccuracy1)),
        top3: Math.max(...sortedResults.map(r => r.metrics.topKAccuracy3)),
        top5: Math.max(...sortedResults.map(r => r.metrics.topKAccuracy5)),
        mrr: Math.max(...sortedResults.map(r => r.metrics.mrrScore)),
        ndcg: Math.max(...sortedResults.map(r => r.metrics.ndcgScore)),
        avgSim: Math.max(...sortedResults.map(r => r.metrics.avgSimilarity)),
    } : null

    function isBest(value: number, bestValue: number | undefined): boolean {
        return bestValue != null && value === bestValue
    }

    // Start grid search
    const startSearch = useCallback(() => {
        if (!selectedModelId || totalCombinations === 0) return

        // Reset state
        abortRef.current?.abort()
        setIsRunning(true)
        setConfigProgress(null)
        setProgressMessage('')
        setError(null)
        setResults([])
        setCompleteData(null)
        setApplyDone(false)
        setExpandedRunIds(new Set())

        const now = Date.now()
        setElapsed(0)
        timerRef.current = setInterval(() => setElapsed(Date.now() - now), 1000)

        const controller = new AbortController()
        abortRef.current = controller

        const sizes = Array.from(selectedSizes).sort((a, b) => a - b).join(',')
        const overlaps = Array.from(selectedOverlaps).sort((a, b) => a - b).join(',')
        const strats = Array.from(selectedStrategies).join(',')
        const url = `/api/grid-search?modelId=${selectedModelId}&chunkSizes=${sizes}&chunkOverlaps=${overlaps}&strategies=${strats}`

        fetch(url, { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) {
                    const text = await response.text()
                    throw new Error(text || `HTTP ${response.status}`)
                }
                const reader = response.body?.getReader()
                if (!reader) throw new Error('Kein Response-Body')

                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue
                        try {
                            const parsed = JSON.parse(line.slice(6))
                            switch (parsed.type) {
                                case 'config':
                                    setConfigProgress({
                                        current: parsed.current,
                                        total: parsed.total,
                                        chunkSize: parsed.chunkSize,
                                        chunkOverlap: parsed.chunkOverlap,
                                        strategy: parsed.strategy,
                                    })
                                    break
                                case 'progress':
                                    setProgressMessage(parsed.message)
                                    break
                                case 'result':
                                    setResults(prev => [...prev, {
                                        config: parsed.config,
                                        metrics: parsed.metrics,
                                        runId: parsed.runId,
                                        totalChunks: parsed.totalChunks,
                                        totalPhrases: parsed.totalPhrases,
                                        details: parsed.details ?? [],
                                    }])
                                    break
                                case 'complete':
                                    setCompleteData(parsed.data)
                                    break
                                case 'error':
                                    setError(parsed.message)
                                    break
                            }
                        } catch {
                            // Skip malformed JSON
                        }
                    }
                }

                setIsRunning(false)
                if (timerRef.current) clearInterval(timerRef.current)
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError(err.message)
                }
                setIsRunning(false)
                if (timerRef.current) clearInterval(timerRef.current)
            })
    }, [selectedModelId, selectedSizes, selectedOverlaps, selectedStrategies, totalCombinations])

    // Abort
    function abort() {
        abortRef.current?.abort()
        abortRef.current = null
        setIsRunning(false)
        if (timerRef.current) clearInterval(timerRef.current)
    }

    // Apply recommendation via rechunk-embed
    function applyRecommendation() {
        if (!completeData?.recommendation) return
        const rec = completeData.recommendation
        setIsApplying(true)

        const modelParam = selectedModelId ? `&modelId=${selectedModelId}` : ''
        fetch(`/api/rechunk-embed?chunkSize=${rec.chunkSize}&chunkOverlap=${rec.chunkOverlap}&strategy=${rec.strategy}${modelParam}`)
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                // Consume the SSE stream to completion
                const reader = res.body?.getReader()
                if (reader) {
                    while (true) {
                        const { done } = await reader.read()
                        if (done) break
                    }
                }
                setIsApplying(false)
                setApplyDone(true)
            })
            .catch(() => {
                setIsApplying(false)
            })
    }

    const overallPercent = configProgress
        ? Math.round((configProgress.current / configProgress.total) * 100)
        : 0

    return (
        <div className="space-y-6">
            {/* Config Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Grid-Search Konfiguration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Model selector */}
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Modell wählen</label>
                        <ModelSelector
                            models={models}
                            value={selectedModelId}
                            onValueChange={setSelectedModelId}
                        />
                    </div>

                    {/* Chunk sizes */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Chunk-Größen <span className="text-muted-foreground font-normal">(Tokens)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CHUNK_SIZES.map(size => (
                                <label
                                    key={size}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${
                                        selectedSizes.has(size)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background border-input hover:bg-accent'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={selectedSizes.has(size)}
                                        onChange={() => toggleSize(size)}
                                    />
                                    {size}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Chunk overlaps */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Overlap <span className="text-muted-foreground font-normal">(Tokens)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CHUNK_OVERLAPS.map(overlap => (
                                <label
                                    key={overlap}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${
                                        selectedOverlaps.has(overlap)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background border-input hover:bg-accent'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={selectedOverlaps.has(overlap)}
                                        onChange={() => toggleOverlap(overlap)}
                                    />
                                    {overlap}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Strategies */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Strategien</label>
                        <div className="flex flex-wrap gap-2">
                            {STRATEGIES.map(strategy => (
                                <label
                                    key={strategy}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-sm transition-colors ${
                                        selectedStrategies.has(strategy)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background border-input hover:bg-accent'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={selectedStrategies.has(strategy)}
                                        onChange={() => toggleStrategy(strategy)}
                                    />
                                    {STRATEGY_LABELS[strategy]}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Combinations count + start */}
                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            onClick={startSearch}
                            disabled={!selectedModelId || totalCombinations === 0 || isRunning}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Grid-Search starten
                        </Button>
                        {isRunning && (
                            <Button variant="outline" onClick={abort}>
                                <Square className="h-4 w-4 mr-2" />
                                Abbrechen
                            </Button>
                        )}
                        <span className="text-sm text-muted-foreground">
                            {totalCombinations} {totalCombinations === 1 ? 'Konfiguration wird' : 'Konfigurationen werden'} getestet
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Progress Card */}
            {(isRunning || (results.length > 0 && !completeData)) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fortschritt
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {configProgress && (
                            <>
                                <div className="flex items-center justify-between text-sm">
                                    <span>
                                        Konfiguration {configProgress.current}/{configProgress.total}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatDuration(elapsed)}
                                    </span>
                                </div>
                                <Progress value={overallPercent} />
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {configProgress.chunkSize}t / {configProgress.chunkOverlap}o / {STRATEGY_LABELS[configProgress.strategy]}
                                    </Badge>
                                </div>
                            </>
                        )}
                        {progressMessage && (
                            <p className="text-sm text-muted-foreground">{progressMessage}</p>
                        )}
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                        {/* Intermediate results */}
                        {results.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {results.length} {results.length === 1 ? 'Ergebnis' : 'Ergebnisse'} bisher
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Error display */}
            {!isRunning && error && results.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-destructive">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Recommendation Card */}
            {completeData?.recommendation && (
                <Card className="border-amber-300 dark:border-amber-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Empfehlung
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className="text-base px-3 py-1 font-mono bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                                {completeData.recommendation.chunkSize}t / {completeData.recommendation.chunkOverlap}o / {STRATEGY_LABELS[completeData.recommendation.strategy]}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Top-1</span>
                                <span className="font-bold text-lg">
                                    {formatPercent(completeData.recommendation.metrics.topKAccuracy1)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Top-3</span>
                                <span className="font-bold text-lg">
                                    {formatPercent(completeData.recommendation.metrics.topKAccuracy3)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Top-5</span>
                                <span className="font-bold text-lg">
                                    {formatPercent(completeData.recommendation.metrics.topKAccuracy5)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">MRR</span>
                                <span className="font-bold text-lg">
                                    {formatScore(completeData.recommendation.metrics.mrrScore)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">nDCG</span>
                                <span className="font-bold text-lg">
                                    {formatScore(completeData.recommendation.metrics.ndcgScore)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Avg. Sim.</span>
                                <span className="font-bold text-lg">
                                    {formatScore(completeData.recommendation.metrics.avgSimilarity)}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Diese Konfiguration erzielte die höchste Top-1 Accuracy. Bei Gleichstand wird
                            die höhere MRR bevorzugt, danach die kleinere Chunk-Größe für präzisere Ergebnisse.
                        </p>

                        <Button
                            onClick={applyRecommendation}
                            disabled={isApplying || applyDone}
                        >
                            {isApplying ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Wird angewendet...
                                </>
                            ) : applyDone ? (
                                'Konfiguration angewendet'
                            ) : (
                                'Konfiguration anwenden'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Results Table */}
            {sortedResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Ergebnisse
                            {completeData && (
                                <Badge variant="outline" className="font-normal">
                                    {sortedResults.length} Konfigurationen · {formatDuration(elapsed)}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer select-none"
                                            onClick={() => handleSort('config')}
                                        >
                                            <span className="flex items-center">
                                                Chunk-Config
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="config" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer select-none"
                                            onClick={() => handleSort('chunks')}
                                        >
                                            <span className="flex items-center justify-end">
                                                #Chunks
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="chunks" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer select-none"
                                            onClick={() => handleSort('top1')}
                                        >
                                            <span className="flex items-center justify-end">
                                                Top-1
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="top1" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer select-none"
                                            onClick={() => handleSort('top3')}
                                        >
                                            <span className="flex items-center justify-end">
                                                Top-3
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="top3" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer select-none"
                                            onClick={() => handleSort('top5')}
                                        >
                                            <span className="flex items-center justify-end">
                                                Top-5
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="top5" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer select-none"
                                            onClick={() => handleSort('mrr')}
                                        >
                                            <span className="flex items-center justify-end">
                                                MRR
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="mrr" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer select-none"
                                            onClick={() => handleSort('ndcg')}
                                        >
                                            <span className="flex items-center justify-end">
                                                nDCG
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="ndcg" />
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer select-none"
                                            onClick={() => handleSort('avgSim')}
                                        >
                                            <span className="flex items-center justify-end">
                                                Avg. Sim.
                                                <SortIcon sortKey={sortKey} sortDir={sortDir} column="avgSim" />
                                            </span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedResults.map((result, idx) => {
                                        const isRecommended = completeData?.recommendation?.runId === result.runId
                                        const isExpanded = expandedRunIds.has(result.runId)
                                        const toggleExpand = () => {
                                            setExpandedRunIds(prev => {
                                                const next = new Set(prev)
                                                if (next.has(result.runId)) next.delete(result.runId)
                                                else next.add(result.runId)
                                                return next
                                            })
                                        }
                                        return (
                                            <React.Fragment key={result.runId ?? idx}>
                                                <TableRow
                                                    className={`cursor-pointer ${isRecommended ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
                                                    onClick={toggleExpand}
                                                >
                                                    <TableCell className="font-mono text-sm">
                                                        <span className="flex items-center gap-2">
                                                            {isExpanded
                                                                ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                            }
                                                            {isRecommended && <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                                            {result.config.chunkSize}t / {result.config.chunkOverlap}o
                                                            <Badge variant="secondary" className="text-xs">
                                                                {STRATEGY_LABELS[result.config.strategy]}
                                                            </Badge>
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {result.totalChunks}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${isBest(result.metrics.topKAccuracy1, bestValues?.top1) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                                        {formatPercent(result.metrics.topKAccuracy1)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${isBest(result.metrics.topKAccuracy3, bestValues?.top3) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                                        {formatPercent(result.metrics.topKAccuracy3)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${isBest(result.metrics.topKAccuracy5, bestValues?.top5) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                                        {formatPercent(result.metrics.topKAccuracy5)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${isBest(result.metrics.mrrScore, bestValues?.mrr) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                                        {formatScore(result.metrics.mrrScore)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${isBest(result.metrics.ndcgScore, bestValues?.ndcg) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                                        {formatScore(result.metrics.ndcgScore)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${isBest(result.metrics.avgSimilarity, bestValues?.avgSim) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                                        {formatScore(result.metrics.avgSimilarity)}
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && result.details && result.details.length > 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="p-0">
                                                            <div className="bg-muted/30 p-4 space-y-4">
                                                                <p className="text-sm font-medium text-muted-foreground">
                                                                    Detailergebnisse pro Phrase ({result.details.length} Phrasen)
                                                                </p>
                                                                {result.details.map((detail, i) => (
                                                                    <div key={i} className="rounded-md border bg-background p-4 space-y-3">
                                                                        {/* Phrase header */}
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex-1">
                                                                                <p className="font-medium">&ldquo;{detail.phrase}&rdquo;</p>
                                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                                    {detail.category && (
                                                                                        <Badge variant="secondary">{detail.category}</Badge>
                                                                                    )}
                                                                                    {detail.isHit ? (
                                                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                                            Treffer auf Rang {detail.expectedRank}
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge variant="destructive">
                                                                                            Nicht in Top 5
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Expected chunk */}
                                                                        {detail.expectedChunk && (
                                                                            <div className="text-sm">
                                                                                <p className="text-muted-foreground font-medium mb-1">
                                                                                    Erwarteter Chunk:
                                                                                    <span className="font-normal ml-1">
                                                                                        [{detail.expectedChunk.sourceTitle}] Chunk {detail.expectedChunk.chunkIndex}
                                                                                    </span>
                                                                                </p>
                                                                                <p className="text-muted-foreground pl-3 border-l-2 border-blue-300 dark:border-blue-700">
                                                                                    {highlightPhrase(detail.expectedChunk.content, detail.phrase)}
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        {/* Retrieved chunks table */}
                                                                        <div className="text-sm">
                                                                            <p className="text-muted-foreground font-medium mb-1">Gefundene Chunks (Top 5):</p>
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-sm">
                                                                                    <thead>
                                                                                        <tr className="border-b text-left text-muted-foreground">
                                                                                            <th className="py-1.5 pr-3 w-12">Rang</th>
                                                                                            <th className="py-1.5 pr-3 w-24">Similarity</th>
                                                                                            <th className="py-1.5">Chunk</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {detail.retrievedChunks.map((chunk, j) => (
                                                                                            <tr
                                                                                                key={j}
                                                                                                className={`border-b last:border-0 ${
                                                                                                    chunk.isExpected
                                                                                                        ? 'bg-green-50 dark:bg-green-950/30'
                                                                                                        : ''
                                                                                                }`}
                                                                                            >
                                                                                                <td className="py-1.5 pr-3 font-mono">
                                                                                                    <span className="flex items-center gap-1">
                                                                                                        #{j + 1}
                                                                                                        {chunk.isExpected && (
                                                                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                                                                                        )}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-1.5 pr-3 font-mono">
                                                                                                    {chunk.similarity.toFixed(4)}
                                                                                                </td>
                                                                                                <td className="py-1.5 text-muted-foreground">
                                                                                                    <p className="font-medium text-foreground mb-0.5">
                                                                                                        [{chunk.sourceTitle}] Chunk {chunk.chunkIndex}
                                                                                                    </p>
                                                                                                    <p>{highlightPhrase(chunk.content, detail.phrase)}</p>
                                                                                                </td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                            {!detail.isHit && (
                                                                                <p className="mt-2 text-xs flex items-center gap-1 text-destructive">
                                                                                    <XCircle className="h-3 w-3" />
                                                                                    Der erwartete Chunk wurde in den Top 5 nicht gefunden.
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
