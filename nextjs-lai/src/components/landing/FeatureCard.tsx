"use client";

import type { LucideIcon } from "lucide-react";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  index: number;
  accent?: "blue" | "orange";
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  index,
  accent = "blue",
}: FeatureCardProps) {
  const isOrange = accent === "orange";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <Card className={`h-full transition-colors ${isOrange ? "hover:border-orange-400/20" : "hover:border-primary/20"}`}>
        <CardHeader>
          <div className={`mb-2 flex size-10 items-center justify-center rounded-lg ${isOrange ? "bg-orange-400/10" : "bg-primary/10"}`}>
            <Icon className={`size-5 ${isOrange ? "text-orange-400" : "text-primary"}`} />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter>
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>
              Mehr erfahren <ArrowRight />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
