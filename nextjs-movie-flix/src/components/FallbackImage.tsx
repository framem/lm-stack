'use client'

import Image from 'next/image'
import { useState } from 'react'

// Client wrapper for next/image with onError fallback support
export default function FallbackImage({
    fallback,
    ...props
}: React.ComponentProps<typeof Image> & { fallback?: React.ReactNode }) {
    const [error, setError] = useState(false)

    if (error) {
        return <>{fallback ?? null}</>
    }

    return <Image {...props} onError={() => setError(true)} />
}
