import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, Sparkles, Mail, Download } from "lucide-react";
import { InstallAppButton } from "@/components/layout/install-app-button";

const faqs = [
  {
    q: "How does AI extraction work?",
    a: "Paste assignment text, upload a screenshot/PDF, or type manually. Our AI analyzes the content and extracts deadlines, requirements, and creates a step-by-step plan.",
  },
  {
    q: "What file types can I upload?",
    a: "Screenshots (PNG, JPG) and PDFs up to 10MB. For best results today, paste the assignment text alongside your upload.",
  },
  {
    q: "How is priority calculated?",
    a: "Priority is based on due date proximity, assignment difficulty, and estimated time. Urgent = due within 24 hours or overdue.",
  },
  {
    q: "Can I edit AI-extracted details?",
    a: "Yes! After extraction, you'll see a review screen where you can edit every field before saving.",
  },
];

export default function HelpPage() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & About</h1>
          <p className="mt-1 text-muted-foreground">
            Learn how EagleCram helps you stay on top of schoolwork.
          </p>
        </div>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">About EagleCram</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  EagleCram is an intelligent homework organizer for students. It combines
                  structured assignment extraction with smart scheduling, calendar views, and
                  productivity analytics — like Notion + Google Calendar + an AI assistant,
                  focused entirely on school assignments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-4 w-4" /> Install EagleCram
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install the app on supported desktop and mobile browsers for a standalone experience.
              </p>
              <InstallAppButton className="w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" /> Quick start
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Create an account and set up your profile</p>
              <p>2. Add courses for your classes</p>
              <p>3. Add assignments via paste, upload, or manual entry</p>
              <p>4. Review AI-extracted details and save</p>
              <p>5. Track progress on your dashboard and calendar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="h-4 w-4" /> Need help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Contact support or check our documentation for setup guides.
              </p>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" /> support@eaglecram.app
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Frequently asked questions</h2>
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardContent className="p-5">
                <h3 className="font-medium">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild>
            <Link href="/assignments/new">Add your first assignment</Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
