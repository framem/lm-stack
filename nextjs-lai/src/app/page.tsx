"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  FileText,
  MessageSquare,
  HelpCircle,
  Layers,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import dynamic from "next/dynamic";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { FeatureCard } from "@/src/components/landing/FeatureCard";
import { UseCases } from "@/src/components/landing/UseCases";
import { FAQ } from "@/src/components/landing/FAQ";

// Lazy load LaiWorkflow — uses @xyflow/react (~50KB+ gzipped)
const LaiWorkflow = dynamic(
  () => import("@/src/components/landing/LaiWorkflow").then((m) => m.LaiWorkflow),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  },
);

const heroVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const foxReveal = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const glowPulse = {
  hidden: { opacity: 0 },
  show: {
    opacity: [0.25, 0.45, 0.25],
    transition: {
      opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      duration: 0.8,
    },
  },
};

const features = [
  {
    icon: MessageSquare,
    title: "KI-Chat mit Quellenangaben",
    description:
      "Frag die KI wie einen Tutor — sie antwortet NUR basierend auf deinen Unterlagen und zeigt dir die exakte Stelle im Dokument.",
    href: "/learn/chat",
    accent: "orange" as const,
  },
  {
    icon: HelpCircle,
    title: "Quiz-Generator",
    description:
      "LAI erstellt automatisch Quizfragen aus deinen Unterlagen. Sieh auf einen Blick, welche Themen sitzen — und wo du nochmal ran musst.",
    href: "/learn/quiz",
    accent: "blue" as const,
  },
  {
    icon: Layers,
    title: "Karteikarten & Spaced Repetition",
    description:
      "KI-generierte Karteikarten, die sich deinem Lernstand anpassen. Nie wieder stundenlang Karten tippen.",
    href: "/learn/flashcards",
    accent: "orange" as const,
  },
  {
    icon: FileText,
    title: "Dein Material, dein Wissen",
    description:
      "Lade Skripte, Folien oder Notizen hoch (PDF, DOCX, Markdown) — LAI extrahiert automatisch die wichtigsten Konzepte.",
    href: "/learn/documents",
    accent: "blue" as const,
  },
  {
    icon: TrendingUp,
    title: "Fortschritt & Lernanalyse",
    description:
      "Sieh auf einen Blick, wo du stehst — mit Streaks, Wissensstand-Tracking und Empfehlungen für deine nächsten Schritte.",
    href: "/learn/stats",
    accent: "blue" as const,
  },
  {
    icon: ShieldCheck,
    title: "Deine Daten bleiben bei dir",
    description:
      "LAI läuft 100% lokal auf deinem Gerät. Keine Cloud, kein Tracking, keine Datensammlung. Deine Skripte bleiben privat.",
    href: "#faq",
    accent: "orange" as const,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/fox.png"
              alt="LAI Logo"
              width={32}
              height={32}
            />
            <span className="text-lg font-bold">LAI</span>
          </Link>
          <Button size="sm" asChild>
            <Link href="/learn">Kostenlos ausprobieren</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-14">
        {/* Ambient background gradient */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
          <div className="absolute -right-16 top-1/3 h-[400px] w-[400px] rounded-full bg-orange-500/[0.05] blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column — Text content */}
          <motion.div
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp}>
              <Badge
                variant="secondary"
                className="mb-5 border border-orange-400/25 px-3 py-1 text-xs tracking-wide"
              >
                100% lokal · Kein Cloud-Upload · Kostenlos
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Von deinen Skripten
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-orange-400 bg-clip-text text-transparent">
                zu Karteikarten in 2 Minuten.
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground"
            >
              Lade PDFs hoch, stelle Fragen und teste dein Wissen —
              ohne manuelles Zusammenfassen. Die KI antwortet nur aus deinen Unterlagen.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" asChild>
                <Link href="/learn">Kostenlos ausprobieren</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#workflow">So funktioniert&apos;s</Link>
              </Button>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="mt-3 text-xs text-muted-foreground"
            >
              Keine Registrierung · Keine Kreditkarte · 2 Min Setup
            </motion.p>
          </motion.div>

          {/* Right column — Fox logo with glow (reduced size) */}
          <motion.div
            className="relative flex items-center justify-center"
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            {/* Layered glow effects (reduced opacity) */}
            <motion.div
              className="absolute h-[340px] w-[340px] rounded-full sm:h-[380px] sm:w-[380px]"
              variants={glowPulse}
              style={{
                background:
                  "radial-gradient(circle, oklch(0.58 0.19 255 / 0.12) 0%, transparent 70%)",
              }}
            />
            <motion.div
              className="absolute h-[280px] w-[280px] rounded-full sm:h-[320px] sm:w-[320px]"
              variants={glowPulse}
              style={{
                background:
                  "radial-gradient(circle, oklch(0.65 0.17 55 / 0.1) 0%, transparent 65%)",
              }}
            />
            {/* Subtle ring */}
            <motion.div
              className="absolute h-[310px] w-[310px] rounded-full border border-primary/10 sm:h-[360px] sm:w-[360px]"
              variants={foxReveal}
            />

            {/* Fox image */}
            <motion.div variants={foxReveal} className="relative">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/images/fox.png"
                  alt="LAI — Geometric fox logo"
                  width={300}
                  height={300}
                  priority
                  className="relative z-10 h-auto w-[220px] drop-shadow-[0_0_40px_oklch(0.58_0.19_255_/_0.3)] sm:w-[280px] lg:w-[300px]"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Gebaut für Studierende
            </h2>
            <p className="mt-2 text-muted-foreground">
              Egal ob Medizin, Jura oder Informatik — LAI arbeitet mit deinem Material.
            </p>
          </motion.div>
          <div className="mt-12">
            <UseCases />
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight">
              So einfach geht&apos;s
            </h2>
            <p className="mt-2 text-muted-foreground">
              Von deinem Lernmaterial zum verifizierten Wissen in vier Schritten.
            </p>
          </motion.div>
          <motion.div
            className="mt-12 h-[350px] md:h-[400px]"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <LaiWorkflow />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Alles, was du zum Lernen brauchst
            </h2>
            <p className="mt-2 text-muted-foreground">
              Kein Wechsel zwischen fünf Apps — alles an einem Ort.
            </p>
          </motion.div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} index={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Häufige Fragen
            </h2>
          </motion.div>
          <div className="mt-12">
            <FAQ />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Probier es aus — in 2 Minuten{" "}
            <span className="text-orange-400">startklar</span>.
          </h2>
          <p className="mt-2 text-muted-foreground">
            Keine Registrierung, kein Abo, keine Kreditkarte. Einfach loslegen.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/learn">Kostenlos ausprobieren</Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
          <span>LAI — KI-Lernplattform · 100% lokal · 100% privat · 100% kostenlos</span>
          <span>2026</span>
        </div>
      </footer>
    </div>
  );
}
