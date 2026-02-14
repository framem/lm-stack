import { Upload } from 'lucide-react'
import { DocumentUploader } from '@/src/components/DocumentUploader'

export default function UploadPage() {
    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Upload className="h-6 w-6" />
                    Dokument hochladen
                </h1>
                <p className="text-muted-foreground mt-1">
                    Lade ein Dokument hoch oder füge Text ein, um es für Chat und Quiz zu verarbeiten.
                </p>
            </div>
            <DocumentUploader />
        </div>
    )
}
