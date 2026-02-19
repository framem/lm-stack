'use client'

import dynamic from 'next/dynamic'

// ssr: false must live in a Client Component — not allowed in Server Components.
// This wrapper is the boundary so layout.tsx (Server Component) can import it safely.
const GlobalSearch = dynamic(
    () => import('./GlobalSearch').then((m) => m.GlobalSearch),
    { ssr: false }
)

export { GlobalSearch }
