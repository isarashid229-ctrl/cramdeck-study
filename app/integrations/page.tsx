"use client";

import { CalendarSync, CheckCircle2, ExternalLink, KeyRound, Mail, PlugZap, RefreshCw, School, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

const integrations = [
  { name: "Google Classroom", type: "LMS", status: "Planned OAuth", permissions: "Classes, coursework, due dates, attachments", auth: "Google OAuth" },
  { name: "Canvas LMS", type: "LMS", status: "Architecture ready", permissions: "Courses, assignments, submissions, due dates", auth: "Canvas URL + token/OAuth" },
  { name: "Microsoft Teams Education", type: "LMS", status: "Planned OAuth", permissions: "Classes, assignments, files", auth: "Microsoft Graph" },
  { name: "Schoology", type: "LMS", status: "Connector planned", permissions: "Courses, sections, assignments", auth: "Schoology API" },
  { name: "Blackboard", type: "LMS", status: "Connector planned", permissions: "Courses, content, deadlines", auth: "REST + institution URL" },
  { name: "Moodle", type: "LMS", status: "Connector planned", permissions: "Courses, activities, deadlines", auth: "Moodle web services" },
  { name: "PowerSchool", type: "SIS", status: "Feasibility", permissions: "Classes and grade data where schools permit", auth: "District dependent" },
  { name: "Gmail", type: "Email", status: "Import design ready", permissions: "Assignment emails, teacher announcements", auth: "Google OAuth" },
  { name: "Outlook", type: "Email", status: "Import design ready", permissions: "Assignment emails, calendar messages", auth: "Microsoft Graph" },
];

const syncPipeline = [
  "Connect account and store provider token securely server-side.",
  "Import courses/classes first, then assignments and due dates.",
  "Normalize provider payloads into CramDeck Scholar courses and assignments.",
  "Estimate study time, difficulty, topics, and recommended plan.",
  "Refresh on schedule and show last sync, permission scope, and disconnect controls.",
];

export default function IntegrationsPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <PlugZap className="h-3.5 w-3.5 text-primary" />
              School system sync
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Integrations</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">
              Connect school platforms so assignments, courses, deadlines, instructions, and study plans can appear automatically.
            </p>
          </div>
          <Button asChild>
            <Link href="/import">
              <RefreshCw className="h-4 w-4" />
              Open Import Hub
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Metric icon={School} label="LMS targets" value="7" />
          <Metric icon={Mail} label="Email imports" value="2" />
          <Metric icon={ShieldCheck} label="Data source" value="Supabase" />
          <Metric icon={CalendarSync} label="Auto import" value="Ready path" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected accounts</CardTitle>
            <CardDescription>Live connectors need provider credentials, OAuth callback URLs, and secure token storage.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {integrations.map((integration) => (
              <div key={integration.name} className="rounded-xl border p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.type}</p>
                  </div>
                  <Badge variant="secondary">{integration.status}</Badge>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Permissions:</span> {integration.permissions}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Auth:</span> {integration.auth}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Last sync:</span> Not connected
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/import">
                    <KeyRound className="h-3.5 w-3.5" />
                    Configure
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.info("Disconnect controls appear after an account is connected in the Import Hub.")}>
                    Sync status
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto assignment import pipeline</CardTitle>
              <CardDescription>How provider data becomes student-ready work inside CramDeck Scholar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {syncPipeline.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-xl border p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Browser extension roadmap</CardTitle>
              <CardDescription>Future “Send to CramDeck” capture from school websites.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "Content script detects assignment pages in Classroom, Canvas, Schoology, Blackboard, and Moodle.",
                "Extension extracts title, course, due date, instructions, attachments, and source URL.",
                "User clicks Send to CramDeck, then reviews or auto-imports into their account.",
                "Background sync watches selected dashboards and sends safe deltas to Supabase-backed import APIs.",
              ].map((item) => (
                <div key={item} className="flex gap-2 rounded-xl border p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>{item}</p>
                </div>
              ))}
              <Button variant="outline" asChild>
                <a href="https://developers.google.com/classroom" target="_blank" rel="noreferrer">
                  Google Classroom API docs
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
