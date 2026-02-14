"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { FileText, MessageSquare, HelpCircle } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { LaiWorkflow } from "@/src/components/landing/LaiWorkflow";
import { FeatureCard } from "@/src/components/landing/FeatureCard";

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
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const glowPulse = {
  hidden: { opacity: 0 },
  show: {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      duration: 0.8,
    },
  },
};

const features = [
  {
    icon: FileText,
    title: "Lernmaterial verwalten",
    description:
      "Lade PDFs, DOCX oder Markdown hoch und organisiere deine Lernmaterialien an einem Ort.",
    href: "/learn/documents",
    accent: "blue" as const,
  },
  {
    icon: MessageSquare,
    title: "KI-Chat mit Quellenangaben",
    description:
      "Stelle Fragen zu deinem Lernmaterial und erhalte verifizierte Antworten mit Quellenangaben.",
    href: "/learn/chat",
    accent: "orange" as const,
  },
  {
    icon: HelpCircle,
    title: "Quiz & Wissensstand",
    description:
      "Teste dein Wissen mit automatisch generierten Quizfragen und verfolge deinen Fortschritt.",
    href: "/learn/quiz",
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
          <Button size="sm" asChild>
            <Link href="/learn/chat">Jetzt starten</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-14">
        {/* Ambient background gradient (top-right bias to sit behind fox) */}
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
                KI-gestütztes Lernen
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Lerne smarter,
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-orange-400 bg-clip-text text-transparent">
                nicht härter.
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground"
            >
              LAI kombiniert deine Lernmaterialien mit KI — für Antworten, die
              auf deinem Lernmaterial basieren, und Quizfragen, die dein Wissen
              wirklich testen.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" asChild>
                <Link href="/learn/chat">Jetzt starten</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#workflow">Mehr erfahren</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right column — Fox logo with glow */}
          <motion.div
            className="relative flex items-center justify-center"
            variants={heroVariants}
            initial="hidden"
            animate="show"
          >
            {/* Layered glow effects */}
            <motion.div
              className="absolute h-[420px] w-[420px] rounded-full sm:h-[480px] sm:w-[480px]"
              variants={glowPulse}
              style={{
                background:
                  "radial-gradient(circle, oklch(0.58 0.19 255 / 0.25) 0%, transparent 70%)",
              }}
            />
            <motion.div
              className="absolute h-[350px] w-[350px] rounded-full sm:h-[400px] sm:w-[400px]"
              variants={glowPulse}
              style={{
                background:
                  "radial-gradient(circle, oklch(0.65 0.17 55 / 0.2) 0%, transparent 65%)",
              }}
            />
            {/* Subtle ring */}
            <motion.div
              className="absolute h-[380px] w-[380px] rounded-full border border-primary/10 sm:h-[440px] sm:w-[440px]"
              variants={foxReveal}
            />

            {/* Fox image */}
            <motion.div variants={foxReveal} className="relative">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/images/fox.png"
                  alt="LAI — Geometric fox logo"
                  width={420}
                  height={420}
                  priority
                  className="relative z-10 h-auto w-[300px] drop-shadow-[0_0_40px_oklch(0.58_0.19_255_/_0.3)] sm:w-[380px] lg:w-[420px]"
                />
              </motion.div>
            </motion.div>
          </motion.div>
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
              So funktioniert LAI
            </h2>
            <p className="mt-2 text-muted-foreground">
              Von deinem Lernmaterial zum verifizierten Wissen in fünf Schritten.
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
          </motion.div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} index={index} {...feature} />
            ))}
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
            Bereit, smarter zu{" "}
            <span className="text-orange-400">lernen</span>?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Lade dein Lernmaterial hoch und starte sofort mit dem Lernen.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/learn/chat">Jetzt starten</Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-muted-foreground">
          <span>LAI — Lernplattform mit KI</span>
          <span>2026</span>
        </div>
      </footer>
    </div>
  );
}
