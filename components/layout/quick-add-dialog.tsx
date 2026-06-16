"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, PenLine, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type QuickAddDialogProps = {
  compact?: boolean;
  className?: string;
};

const draftKey = "cramdeck-quick-import-draft";

export function QuickAddDialog({ compact = false, className }: QuickAddDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualText, setManualText] = useState("");

  const sendDraft = (draft: { source_type: "paste" | "manual"; text: string }) => {
    if (draft.text.trim().length < 10) {
      toast.error("Add a little more assignment detail first.");
      return;
    }
    const payload = { ...draft, created_at: new Date().toISOString() };
    window.localStorage.setItem(draftKey, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("cramdeck-quick-import", { detail: payload }));
    setOpen(false);
    router.push("/import?quick=1");
  };

  if (compact) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className={className} aria-label="Quick Add">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <QuickAddContent
          pasteText={pasteText}
          setPasteText={setPasteText}
          manualTitle={manualTitle}
          setManualTitle={setManualTitle}
          manualText={manualText}
          setManualText={setManualText}
          sendDraft={sendDraft}
          openUploadImporter={() => {
            setOpen(false);
            router.push("/import#direct-import");
          }}
        />
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2", className)}>
          <Plus className="h-4 w-4" />
          Quick Add
        </Button>
      </DialogTrigger>
      <QuickAddContent
        pasteText={pasteText}
        setPasteText={setPasteText}
        manualTitle={manualTitle}
        setManualTitle={setManualTitle}
        manualText={manualText}
        setManualText={setManualText}
        sendDraft={sendDraft}
        openUploadImporter={() => {
          setOpen(false);
          router.push("/import#direct-import");
        }}
      />
    </Dialog>
  );
}

function QuickAddContent({
  pasteText,
  setPasteText,
  manualTitle,
  setManualTitle,
  manualText,
  setManualText,
  sendDraft,
  openUploadImporter,
}: {
  pasteText: string;
  setPasteText: (value: string) => void;
  manualTitle: string;
  setManualTitle: (value: string) => void;
  manualText: string;
  setManualText: (value: string) => void;
  sendDraft: (draft: { source_type: "paste" | "manual"; text: string }) => void;
  openUploadImporter: () => void;
}) {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Quick Add Assignment</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="paste">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paste" className="gap-2">
            <ClipboardPaste className="h-4 w-4" />
            Paste
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <PenLine className="h-4 w-4" />
            Type
          </TabsTrigger>
        </TabsList>
        <TabsContent value="paste" className="space-y-3">
          <Label htmlFor="quick-paste">Paste from Classroom, Canvas, email, or a syllabus</Label>
          <Textarea
            id="quick-paste"
            className="min-h-36"
            placeholder="Paste the full assignment text. EagleCram will pull out the clean title, course, due date, tasks, and study topics."
            value={pasteText}
            onChange={(event) => setPasteText(event.target.value)}
          />
          <Button onClick={() => sendDraft({ source_type: "paste", text: pasteText })}>Analyze in Import Hub</Button>
        </TabsContent>
        <TabsContent value="upload" className="space-y-3">
          <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Uploads are handled in the Import Hub so file storage and extraction stay reliable.
          </div>
          <Button onClick={openUploadImporter}>
            Open upload importer
          </Button>
        </TabsContent>
        <TabsContent value="manual" className="space-y-3">
          <div className="grid gap-3">
            <div>
              <Label htmlFor="quick-title">Title</Label>
              <Input id="quick-title" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} placeholder="Cell Membrane Transport Review" />
            </div>
            <div>
              <Label htmlFor="quick-manual">Details</Label>
              <Textarea
                id="quick-manual"
                className="min-h-32"
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                placeholder="Due date, course, instructions, requirements, links, and any notes."
              />
            </div>
          </div>
          <Button onClick={() => sendDraft({ source_type: "manual", text: `Title: ${manualTitle}\n\n${manualText}` })}>Analyze in Import Hub</Button>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

export { draftKey as quickImportDraftKey };
