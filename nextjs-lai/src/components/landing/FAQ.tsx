"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/src/components/ui/accordion";

const faqs = [
  {
    question: "Ist LAI kostenlos?",
    answer:
      "Ja, komplett kostenlos und Open Source. Keine versteckten Kosten, kein Abo, keine Kreditkarte.",
  },
  {
    question: "Brauche ich einen Account?",
    answer:
      "Nein. LAI läuft lokal in deinem Browser — keine Anmeldung, keine E-Mail-Adresse nötig.",
  },
  {
    question: "Sind meine Daten sicher?",
    answer:
      "Ja. LAI läuft 100% auf deinem Gerät. Deine Dokumente werden nicht auf externe Server hochgeladen. Keine Cloud, kein Tracking, keine Datensammlung.",
  },
  {
    question: "Welche Dateiformate werden unterstützt?",
    answer:
      "PDF, DOCX und Markdown. Auch große Dokumente bis 10 MB — egal ob Vorlesungsfolien, Lehrbücher oder eigene Notizen.",
  },
  {
    question: "Wie gut ist die KI?",
    answer:
      "LAI nutzt lokale Sprachmodelle und antwortet NUR basierend auf deinem Material — mit Quellenangaben. Keine Halluzinationen wie bei ChatGPT, weil die KI nur dein Dokument kennt.",
  },
  {
    question: "Was unterscheidet LAI von ChatGPT?",
    answer:
      "ChatGPT antwortet generisch und erfindet manchmal Fakten. LAI kennt NUR dein hochgeladenes Material und zeigt dir die exakte Quelle jeder Antwort. Außerdem erstellt LAI automatisch Quizfragen und Karteikarten — alles lokal und kostenlos.",
  },
];

export function FAQ() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
