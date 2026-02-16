import type { Metadata } from "next"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/src/components/ThemeProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Embed-Eval — Embedding-Modell-Vergleich",
  description: "Vergleichstool für verschiedene Embedding-Modelle",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
