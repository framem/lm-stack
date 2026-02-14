import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-destructive mb-4">404</h1>
                <h2 className="text-2xl font-semibold mb-4">
                    Seite nicht gefunden
                </h2>
                <p className="text-muted-foreground mb-8">
                    Die angeforderte Seite existiert nicht oder wurde verschoben.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                    Zur Startseite
                </Link>
            </div>
        </div>
    )
}
