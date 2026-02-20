"use client";

import { motion } from "motion/react";
import { Stethoscope, Scale, Code, Languages } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";

const cases = [
  {
    icon: Stethoscope,
    name: "Laura, Medizin",
    quote:
      "Ich lade meine Anatomie-Skripte hoch und LAI erstellt 50 Karteikarten — in 30 Sekunden. Früher hab ich dafür einen ganzen Abend gebraucht.",
  },
  {
    icon: Scale,
    name: "Max, Jura",
    quote:
      "Statt stundenlang BGB-Kommentare zu lesen, frage ich LAI — mit Quellenangaben aus meinen Unterlagen. Endlich eine KI, der ich vertrauen kann.",
  },
  {
    icon: Code,
    name: "Sarah, Informatik",
    quote:
      "Die automatisch generierten Quizfragen zu Datenbanken sind besser als alles, was ich selbst geschrieben hätte. Und die KI zeigt mir genau, wo die Info herkommt.",
  },
  {
    icon: Languages,
    name: "Elena, Spanisch A1",
    quote:
      "Ich übe täglich 20 neue Vokabeln im Tipp-Modus — 15 Minuten, kein Schnickschnack. Spaced Repetition zeigt mir jede Vokabel genau dann, wenn ich sie fast vergessen hätte.",
  },
];

export function UseCases() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cases.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{c.name}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  &ldquo;{c.quote}&rdquo;
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
