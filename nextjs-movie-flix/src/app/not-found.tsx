import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-white mb-4">
                    Seite nicht gefunden
                </h2>
                <p className="text-zinc-400 mb-8">
                    Die angeforderte Seite existiert nicht oder wurde verschoben.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors"
                >
                    Zurueck zur Startseite
                </Link>
            </div>
        </div>
    )
}
