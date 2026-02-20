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
  BookOpen,
} from "lucide-react";

import dynamic from "next/dynamic";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { FeatureCard } from "@/src/components/landing/FeatureCard";
import { UseCases } from "@/src/components/landing/UseCases";
import { FAQ } from "@/src/components/landing/FAQ";

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
    href: "/learn/progress",
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
  {
    icon: BookOpen,
    title: "Vokabeltrainer",
    description:
      "Lerne Spanisch und Englisch mit fertigen Wortschatz-Sets (A1–A2) oder eigenen Vokabeln — mit intelligentem Spaced Repetition.",
    href: "/learn/vocabulary",
    accent: "blue" as const,
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
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <Link href="#features" className="transition-colors hover:text-foreground">Funktionen</Link>
            <Link href="#faq" className="transition-colors hover:text-foreground">FAQ</Link>
          </nav>
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
              Lade deine Skripte hoch oder starte direkt mit fertigen Vokabel-Sets —
              LAI erstellt Karteikarten, beantwortet Fragen und testet dein Wissen.
              Ohne Cloud, ohne Registrierung.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" asChild>
                <Link href="/learn">Kostenlos ausprobieren</Link>
              </Button>
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="mt-3 text-xs text-muted-foreground"
            >
              Keine Registrierung · Keine Kreditkarte · 2 Min Setup
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-5 flex flex-wrap gap-2"
            >
              <Link
                href="/learn"
                className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:bg-muted"
              >
                <FileText className="size-3.5 shrink-0 text-primary" />
                <span>PDF/DOCX → KI-Analyse</span>
              </Link>
              <Link
                href="/learn/vocabulary"
                className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-xs transition-colors hover:border-orange-400/40 hover:bg-muted"
              >
                <span className="shrink-0 leading-none">🇪🇸</span>
                <span>Spanisch &amp; Englisch A1–A2</span>
              </Link>
            </motion.div>
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
              Für jeden Lerntyp die richtige Methode
            </h2>
            <p className="mt-2 text-muted-foreground">
              Ob Klausurvorbereitung oder Sprachkurs — LAI passt sich deinem Lernziel an.
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
              Zwei Wege, ein Ziel — ob eigene Unterlagen oder fertige Sprach-Sets.
            </p>
          </motion.div>
          <motion.div
            className="mt-12 h-[700px] md:h-[780px] pointer-events-none"
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
      <section id="features" className="px-6 py-24">
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
              <div
                key={feature.title}
                className={index === features.length - 1 ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""}
              >
                <FeatureCard index={index} {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Language Learning */}
      <section className="px-6 py-24 bg-muted/20">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="secondary"
              className="mb-4 border border-orange-400/25 px-3 py-1 text-xs tracking-wide"
            >
              Sprachen lernen
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Vokabeln lernen — von A1{" "}
              <span className="bg-gradient-to-r from-orange-400 to-primary bg-clip-text text-transparent">
                bis zur Flüssigkeit
              </span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Kein Buch, keine App — fertige Sets für Spanisch und Englisch, direkt im Browser.
              Spaced Repetition bringt jede Vokabel genau dann zurück, wenn du sie fast vergessen hättest.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                flag: "🇪🇸",
                lang: "Spanisch",
                level: "A1",
                sample: ["hola", "Hallo"],
                color: "from-orange-500/10 to-red-500/5",
              },
              {
                flag: "🇪🇸",
                lang: "Spanisch",
                level: "A2",
                sample: ["ciudad", "Stadt"],
                color: "from-orange-500/10 to-red-500/5",
              },
              {
                flag: "🇬🇧",
                lang: "Englisch",
                level: "A1",
                sample: ["hello", "Hallo"],
                color: "from-blue-500/10 to-sky-500/5",
              },
              {
                flag: "🇬🇧",
                lang: "Englisch",
                level: "A2",
                sample: ["quickly", "schnell"],
                color: "from-blue-500/10 to-sky-500/5",
              },
            ].map((set, i) => (
              <motion.div
                key={`${set.lang}-${set.level}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link href="/learn/vocabulary" className="group block h-full">
                  <div
                    className={`h-full rounded-xl border bg-gradient-to-br ${set.color} p-5 transition-all group-hover:border-primary/40 group-hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{set.flag}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {set.level}
                      </Badge>
                    </div>
                    <p className="mt-3 font-semibold">{set.lang}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Grundwortschatz</p>
                    <div className="mt-4 rounded-lg bg-background/60 px-3 py-2 text-center text-sm">
                      <span className="font-medium">{set.sample[0]}</span>
                      <span className="mx-2 text-muted-foreground">→</span>
                      <span className="text-muted-foreground">{set.sample[1]}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Button variant="outline" asChild>
              <Link href="/learn/vocabulary">Alle Vokabel-Sets ansehen →</Link>
            </Button>
          </motion.div>
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
