"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  ListChecks,
  Target,
  Clock,
  BarChart3,
  Brain,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: Brain, title: "AI assignment extraction", description: "Paste, upload, or type — AI pulls out deadlines, requirements, and grading details." },
  { icon: Clock, title: "Smart deadline detection", description: "Never miss a due date. EagleCram flags unclear deadlines and prioritizes what's urgent." },
  { icon: ListChecks, title: "Automatic task breakdown", description: "Big projects become 3–8 actionable steps with time estimates for each." },
  { icon: Target, title: "Priority scoring", description: "Urgent, high, medium, or low — based on due date, difficulty, and workload." },
  { icon: Calendar, title: "Calendar planning", description: "Month, week, and list views color-coded by course so you see your week at a glance." },
  { icon: BarChart3, title: "Progress tracking", description: "Check off steps, track study time, and watch your completion rate climb." },
];

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="gradient-card h-full border-0 shadow-md transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
