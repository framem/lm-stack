"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { FileText, MessageSquare, HelpCircle } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
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

const features = [
  {
    icon: FileText,
    title: "Dokumente verwalten",
    description:
      "Lade PDFs, DOCX oder Markdown hoch und organisiere deine Lernmaterialien an einem Ort.",
    href: "/documents",
  },
  {
    icon: MessageSquare,
    title: "KI-Chat mit Quellenangaben",
    description:
      "Stelle Fragen zu deinen Dokumenten und erhalte verifizierte Antworten mit Quellenangaben.",
    href: "/chat",
  },
  {
    icon: HelpCircle,
    title: "Quiz & Wissensstand",
    description:
      "Teste dein Wissen mit automatisch generierten Quizfragen und verfolge deinen Fortschritt.",
    href: "/quiz",
  },
] as const;

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
            <Link href="/chat">Jetzt starten</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex min-h-screen items-center justify-center px-6 pt-14">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={heroVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="mb-4">
              KI-gestütztes Lernen
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Lerne smarter, nicht härter.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg text-muted-foreground"
          >
            LAI kombiniert deine Lernmaterialien mit KI — für Antworten, die auf
            deinen Dokumenten basieren, und Quizfragen, die dein Wissen
            wirklich testen.
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button size="lg" asChild>
              <Link href="/chat">Jetzt starten</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#workflow">Mehr erfahren</Link>
            </Button>
          </motion.div>
        </motion.div>
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
              Von deinem Dokument zum verifizierten Wissen in fünf Schritten.
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
            Bereit, smarter zu lernen?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Lade deine Dokumente hoch und starte sofort mit dem Lernen.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/chat">Jetzt starten</Link>
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
