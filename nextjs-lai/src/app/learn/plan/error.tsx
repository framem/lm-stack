'use client'

import { Button } from '@/src/components/ui/button'

export default function PlanError({ reset }: { reset: () => void }) {
    return (
        <div className="p-8 max-w-md mx-auto text-center space-y-4">
            <h2 className="text-lg font-semibold">Fehler beim Laden des Lernplans</h2>
            <p className="text-sm text-muted-foreground">
                Der Lernplan konnte nicht geladen werden. Versuche es erneut.
            </p>
            <Button onClick={reset}>Erneut versuchen</Button>
        </div>
    )
}
