"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
          <Sparkles className="h-4 w-4 text-primary" />
          Academic homework organizer
        </span>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
          Turn messy assignments into{" "}
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            clear action plans
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Upload a screenshot, syllabus, or pasted instructions. EagleCram extracts the deadline,
          requirements, and builds your plan.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild className="h-12 px-8 text-base">
            <Link href="/auth/signup">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
            <Link href="/demo">View Demo</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
