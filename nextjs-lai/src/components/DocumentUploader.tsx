'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, ClipboardPaste, X } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Progress } from '@/src/components/ui/progress'
import { Card, CardContent } from '@/src/components/ui/card'

interface ProgressEvent {
    type: 'progress' | 'complete' | 'error'
    step?: string
    progress?: number
    detail?: string
    documentId?: string
    chunkCount?: number
    error?: string
}

export function DocumentUploader() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState('')
    const [pasteText, setPasteText] = useState('')
    const [pasteTitle, setPasteTitle] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [progressValue, setProgressValue] = useState(0)
    const [progressDetail, setProgressDetail] = useState('')
    const [error, setError] = useState('')

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            setFile(droppedFile)
            setError('')
        }
    }, [])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setError('')
        }
    }, [])

    async function processSSE(response: Response) {
        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                const dataMatch = line.match(/^data: (.+)$/m)
                if (!dataMatch) continue

                const event: ProgressEvent = JSON.parse(dataMatch[1])

                if (event.type === 'progress') {
                    setProgressValue(event.progress || 0)
                    setProgressDetail(event.detail || '')
                } else if (event.type === 'complete') {
                    setProgressValue(100)
                    setProgressDetail('Fertig!')
                    setTimeout(() => {
                        router.push(`/documents/${event.documentId}`)
                    }, 500)
                } else if (event.type === 'error') {
                    setError(event.error || 'Unbekannter Fehler')
                    setUploading(false)
                }
            }
        }
    }

    async function handleFileUpload() {
        if (!file) return
        setUploading(true)
        setError('')
        setProgressValue(0)

        const formData = new FormData()
        formData.append('file', file)
        if (title.trim()) formData.append('title', title.trim())

        try {
            const response = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json()
                setError(data.error || 'Hochladen fehlgeschlagen.')
                setUploading(false)
                return
            }

            await processSSE(response)
        } catch {
            setError('Verbindungsfehler beim Hochladen.')
            setUploading(false)
        }
    }

    async function handleTextPaste() {
        if (!pasteText.trim()) return
        setUploading(true)
        setError('')
        setProgressValue(0)

        try {
            const response = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: pasteText,
                    title: pasteTitle.trim() || undefined,
                }),
            })

            if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json()
                setError(data.error || 'Verarbeitung fehlgeschlagen.')
                setUploading(false)
                return
            }

            await processSSE(response)
        } catch {
            setError('Verbindungsfehler beim Verarbeiten.')
            setUploading(false)
        }
    }

    if (uploading) {
        return (
            <Card>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 animate-pulse text-primary" />
                        <span className="font-medium">Verarbeitung laeuft...</span>
                    </div>
                    <Progress value={progressValue} />
                    <p className="text-sm text-muted-foreground">{progressDetail}</p>
                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Tabs defaultValue="upload">
            <TabsList>
                <TabsTrigger value="upload">
                    <Upload className="h-4 w-4" />
                    Datei hochladen
                </TabsTrigger>
                <TabsTrigger value="paste">
                    <ClipboardPaste className="h-4 w-4" />
                    Text einfuegen
                </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-4">
                <Input
                    placeholder="Titel (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                        dragOver
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt,.md"
                        onChange={handleFileSelect}
                    />

                    {file ? (
                        <div className="flex items-center justify-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-left">
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">
                                Datei hierher ziehen oder klicken
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PDF, DOCX, TXT, MD (max. 10 MB)
                            </p>
                        </div>
                    )}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={handleFileUpload} disabled={!file} className="w-full">
                    <Upload className="h-4 w-4" />
                    Hochladen und verarbeiten
                </Button>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4 mt-4">
                <Input
                    placeholder="Titel (optional)"
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                />
                <Textarea
                    placeholder="Text hier einfuegen..."
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    className="min-h-48"
                />

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={handleTextPaste} disabled={!pasteText.trim()} className="w-full">
                    <ClipboardPaste className="h-4 w-4" />
                    Text verarbeiten
                </Button>
            </TabsContent>
        </Tabs>
    )
}
