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
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  index,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <Card className="h-full transition-colors hover:border-primary/20">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
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
