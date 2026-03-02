'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, BookPlus, Pencil } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/src/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select'
import { toast } from 'sonner'
import { lookupWord, type WordLookupResult } from '@/src/actions/vocab-ai'
import { createVocabFromLookup } from '@/src/actions/flashcards'
import { TTSButton } from '@/src/components/TTSButton'

const LANGUAGE_OPTIONS = [
    { value: 'Englisch', label: 'Englisch', tts: 'en-US' },
    { value: 'Spanisch', label: 'Spanisch', tts: 'es-ES' },
    { value: 'Französisch', label: 'Französisch', tts: 'fr-FR' },
    { value: 'Italienisch', label: 'Italienisch', tts: 'it-IT' },
    { value: 'Portugiesisch', label: 'Portugiesisch', tts: 'pt-PT' },
] as const

interface VocabLookupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    word: string
    documentId: string
    chunkId?: string
    chunkContext?: string
    defaultLanguage?: string
}

export function VocabLookupDialog({
    open,
    onOpenChange,
    word,
    documentId,
    chunkId,
    chunkContext,
    defaultLanguage,
}: VocabLookupDialogProps) {
    const [language, setLanguage] = useState(defaultLanguage || 'Englisch')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [result, setResult] = useState<WordLookupResult | null>(null)

    // Editable fields
    const [translation, setTranslation] = useState('')
    const [exampleSentence, setExampleSentence] = useState('')
    const [partOfSpeech, setPartOfSpeech] = useState('')

    const ttsLang = LANGUAGE_OPTIONS.find(l => l.value === language)?.tts ?? 'en-US'

    const doLookup = useCallback(async () => {
        setLoading(true)
        setResult(null)
        try {
            const data = await lookupWord(word, language, chunkContext)
            setResult(data)
            setTranslation(data.translation)
            setExampleSentence(data.exampleSentence)
            setPartOfSpeech(data.partOfSpeech)
        } catch (err) {
            console.error('Word lookup failed:', err)
            toast.error('Wortanalyse fehlgeschlagen. Bitte versuche es erneut.')
        } finally {
            setLoading(false)
        }
    }, [word, language, chunkContext])

    // Auto-lookup when dialog opens
    useEffect(() => {
        if (open && word) {
            doLookup()
        }
    }, [open, word, doLookup])

    async function handleSave() {
        if (!translation.trim()) {
            toast.error('Übersetzung darf nicht leer sein.')
            return
        }
        setSaving(true)
        try {
            await createVocabFromLookup({
                documentId,
                chunkId,
                front: word,
                back: translation.trim(),
                exampleSentence: exampleSentence.trim() || undefined,
                partOfSpeech: partOfSpeech.trim() || undefined,
                conjugation: result?.conjugation as Record<string, Record<string, string>> | undefined,
            })
            toast.success(`„${word}" als Vokabelkarte gespeichert.`)
            onOpenChange(false)
        } catch (err) {
            console.error('Save failed:', err)
            toast.error('Speichern fehlgeschlagen.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookPlus className="h-5 w-5" />
                        Vokabel erstellen
                    </DialogTitle>
                    <DialogDescription>
                        Markiertes Wort als Vokabelkarte speichern.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Word + Language */}
                    <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-sm font-medium">Wort</label>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50">
                                <span className="font-semibold text-lg">{word}</span>
                                <TTSButton text={word} lang={ttsLang} size="sm" />
                            </div>
                        </div>
                        <div className="w-40 space-y-1.5">
                            <label className="text-sm font-medium">Sprache</label>
                            <Select value={language} onValueChange={(v) => { setLanguage(v); setResult(null) }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGE_OPTIONS.map(l => (
                                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-8">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm text-muted-foreground">KI analysiert Wort...</span>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && result && (
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="translation">Übersetzung</label>
                                <Input
                                    id="translation"
                                    value={translation}
                                    onChange={e => setTranslation(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="example">Beispielsatz</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="example"
                                        value={exampleSentence}
                                        onChange={e => setExampleSentence(e.target.value)}
                                        className="flex-1"
                                    />
                                    {exampleSentence && (
                                        <TTSButton text={exampleSentence} lang={ttsLang} size="sm" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="pos">Wortart</label>
                                <Input
                                    id="pos"
                                    value={partOfSpeech}
                                    onChange={e => setPartOfSpeech(e.target.value)}
                                />
                            </div>

                            {result.conjugation && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Konjugation</label>
                                    <div className="rounded-md border p-3 text-sm space-y-2">
                                        {Object.entries(result.conjugation).map(([tense, forms]) => (
                                            forms && (
                                                <div key={tense}>
                                                    <p className="font-medium capitalize text-xs text-muted-foreground mb-1">
                                                        {tense === 'present' ? 'Präsens' : tense === 'past' ? 'Präteritum' : 'Perfekt'}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                                                        {Object.entries(forms).map(([pronoun, form]) => (
                                                            <div key={pronoun} className="flex gap-2">
                                                                <span className="text-muted-foreground w-16">{pronoun}</span>
                                                                <span>{form}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Re-lookup button when language changes */}
                    {!loading && !result && (
                        <div className="flex justify-center py-4">
                            <Button variant="outline" onClick={doLookup}>
                                <Pencil className="h-4 w-4" />
                                Erneut analysieren
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Abbrechen
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading || !translation.trim()}>
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Vokabel speichern
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
