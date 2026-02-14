import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "LAI - Lernplattform",
  description: "KI-gestützte Lernplattform mit RAG und Quiz",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
