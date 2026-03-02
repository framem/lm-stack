// ── Client-side PDF certificate generation using jsPDF ─────────────────
// This module generates beautiful certificate and progress report PDFs
// entirely on the client side, with no server round-trip.

import jsPDF from 'jspdf'
import type { CertificateData, LanguageProgressSummary } from '@/src/actions/certificate'

// ── Colour palette ─────────────────────────────────────────────────────
const COLORS = {
    primary: [37, 99, 235] as [number, number, number],       // blue-600
    primaryLight: [219, 234, 254] as [number, number, number], // blue-100
    dark: [15, 23, 42] as [number, number, number],            // slate-900
    muted: [100, 116, 139] as [number, number, number],        // slate-500
    success: [22, 163, 74] as [number, number, number],        // green-600
    gold: [217, 119, 6] as [number, number, number],           // amber-600
    white: [255, 255, 255] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],       // slate-200
}

// ── Helper: draw centred text ──────────────────────────────────────────
function centreText(doc: jsPDF, text: string, y: number) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const textWidth = doc.getTextWidth(text)
    doc.text(text, (pageWidth - textWidth) / 2, y)
}

// ── Helper: format date in German ──────────────────────────────────────
function formatDateDe(isoDate: string): string {
    const d = new Date(isoDate)
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Generate level completion certificate ──────────────────────────────
export function generateCertificatePDF(data: CertificateData, userName: string): jsPDF {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const w = doc.internal.pageSize.getWidth()   // 297
    const h = doc.internal.pageSize.getHeight()  // 210

    // Border frame
    doc.setDrawColor(...COLORS.primary)
    doc.setLineWidth(2)
    doc.rect(8, 8, w - 16, h - 16)
    doc.setLineWidth(0.5)
    doc.rect(12, 12, w - 24, h - 24)

    // Corner decorations (small squares)
    const corners = [[14, 14], [w - 18, 14], [14, h - 18], [w - 18, h - 18]]
    doc.setFillColor(...COLORS.gold)
    for (const [cx, cy] of corners) {
        doc.rect(cx, cy, 4, 4, 'F')
    }

    // Header band
    doc.setFillColor(...COLORS.primary)
    doc.rect(20, 20, w - 40, 18, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    centreText(doc, 'SPRACHLERN-ZERTIFIKAT', 32)

    // Title
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    centreText(doc, 'Zertifikat', 58)

    // Subtitle
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.muted)
    centreText(doc, 'Hiermit wird bestätigt, dass', 68)

    // User name
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    centreText(doc, userName || 'Lernende/r', 82)

    // Decorative line under name
    const nameWidth = doc.getTextWidth(userName || 'Lernende/r')
    const lineStart = (w - nameWidth) / 2 - 10
    doc.setDrawColor(...COLORS.gold)
    doc.setLineWidth(0.8)
    doc.line(lineStart, 85, lineStart + nameWidth + 20, 85)

    // Achievement text
    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    centreText(doc, `das Sprachniveau ${data.level} in ${data.language} erfolgreich abgeschlossen hat.`, 96)

    // Stats section
    const statsY = 110
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.muted)
    centreText(doc, 'Leistungsübersicht', statsY)

    // Stats boxes
    const stats = [
        { label: 'Vokabeln beherrscht', value: `${data.masteredCards}/${data.totalCards}` },
        { label: 'Fortschritt', value: `${data.masteredPct}%` },
        { label: 'Gesamte XP', value: `${data.totalXp.toLocaleString('de-DE')}` },
        { label: 'Quizze', value: `${data.quizzesCompleted}` },
    ]

    const boxW = 50
    const boxH = 20
    const gap = 8
    const totalW = stats.length * boxW + (stats.length - 1) * gap
    let startX = (w - totalW) / 2
    const boxY = statsY + 5

    for (const stat of stats) {
        doc.setFillColor(...COLORS.primaryLight)
        doc.roundedRect(startX, boxY, boxW, boxH, 3, 3, 'F')

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.primary)
        const valW = doc.getTextWidth(stat.value)
        doc.text(stat.value, startX + (boxW - valW) / 2, boxY + 10)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.muted)
        const lblW = doc.getTextWidth(stat.label)
        doc.text(stat.label, startX + (boxW - lblW) / 2, boxY + 16)

        startX += boxW + gap
    }

    // Date and streak
    const footY = 155
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.muted)
    centreText(doc, `Ausgestellt am ${formatDateDe(data.completedAt)}`, footY)

    if (data.longestStreak > 0) {
        centreText(doc, `Längste Streak: ${data.longestStreak} Tage`, footY + 7)
    }

    // Footer band
    doc.setFillColor(...COLORS.border)
    doc.rect(20, h - 35, w - 40, 12, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    centreText(doc, `${data.setTitle} — Generiert von Lernplattform`, h - 27)

    return doc
}

// ── Generate progress export PDF ───────────────────────────────────────
export function generateProgressPDF(data: LanguageProgressSummary, userName: string): jsPDF {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = doc.internal.pageSize.getWidth()  // 210
    const margin = 20
    let y = 25

    // Header
    doc.setFillColor(...COLORS.primary)
    doc.rect(0, 0, w, 40, 'F')
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Lernfortschritt', margin, y)
    y += 8
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`${data.language} — ${userName || 'Lernende/r'}`, margin, y)
    y += 6
    doc.setFontSize(9)
    doc.text(`Exportiert am ${formatDateDe(new Date().toISOString())}`, margin, y)
    y = 50

    // Overall stats
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Gesamtübersicht', margin, y)
    y += 8

    const overviewStats = [
        ['Vokabeln gesamt', `${data.totalCards}`],
        ['Beherrscht', `${data.masteredCards} (${data.masteredPct}%)`],
        ['Gesamte XP', `${data.totalXp.toLocaleString('de-DE')}`],
        ['Aktuelle Streak', `${data.currentStreak} Tage`],
        ['Längste Streak', `${data.longestStreak} Tage`],
        ['Lernzeit gesamt', `${data.totalLearningMinutes} Min.`],
    ]

    doc.setFontSize(10)
    for (const [label, value] of overviewStats) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.muted)
        doc.text(label, margin, y)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text(value, margin + 60, y)
        y += 6
    }

    // Progress bar visualisation
    y += 4
    doc.setFillColor(...COLORS.border)
    doc.roundedRect(margin, y, w - 2 * margin, 6, 3, 3, 'F')
    if (data.masteredPct > 0) {
        doc.setFillColor(...COLORS.success)
        const barW = Math.max(6, ((w - 2 * margin) * data.masteredPct) / 100)
        doc.roundedRect(margin, y, barW, 6, 3, 3, 'F')
    }
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.dark)
    doc.text(`${data.masteredPct}%`, margin + (w - 2 * margin) / 2 - 4, y + 4.5)
    y += 14

    // Level details
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.dark)
    doc.text('Stufen-Details', margin, y)
    y += 8

    for (const lvl of data.levels) {
        // Level card
        doc.setDrawColor(...COLORS.border)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin, y - 4, w - 2 * margin, 22, 2, 2, 'S')

        // Level badge
        if (lvl.completed) {
            doc.setFillColor(...COLORS.success)
        } else {
            doc.setFillColor(...COLORS.primaryLight)
        }
        doc.roundedRect(margin + 3, y - 2, 16, 8, 2, 2, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(lvl.completed ? 255 : COLORS.primary[0], lvl.completed ? 255 : COLORS.primary[1], lvl.completed ? 255 : COLORS.primary[2])
        doc.text(lvl.level, margin + 7, y + 3.5)

        // Title and stats
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text(lvl.setTitle, margin + 22, y + 2)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.muted)
        const statusText = lvl.totalCards > 0
            ? `${lvl.masteredCards}/${lvl.totalCards} Vokabeln beherrscht (${lvl.masteredPct}%)`
            : 'Noch nicht importiert'
        doc.text(statusText, margin + 22, y + 8)

        // Status label on right
        if (lvl.completed) {
            doc.setFontSize(9)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...COLORS.success)
            doc.text('Abgeschlossen', w - margin - 30, y + 5)
        }

        // Mini progress bar
        const barStartX = margin + 22
        const barMaxW = 80
        doc.setFillColor(...COLORS.border)
        doc.roundedRect(barStartX, y + 11, barMaxW, 3, 1.5, 1.5, 'F')
        if (lvl.masteredPct > 0) {
            doc.setFillColor(lvl.completed ? COLORS.success[0] : COLORS.primary[0], lvl.completed ? COLORS.success[1] : COLORS.primary[1], lvl.completed ? COLORS.success[2] : COLORS.primary[2])
            const bW = Math.max(3, (barMaxW * lvl.masteredPct) / 100)
            doc.roundedRect(barStartX, y + 11, bW, 3, 1.5, 1.5, 'F')
        }

        y += 26
    }

    // Footer
    y = doc.internal.pageSize.getHeight() - 15
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.muted)
    centreText(doc, 'Generiert von Lernplattform', y)

    return doc
}
