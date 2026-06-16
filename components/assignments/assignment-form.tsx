"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/layout/loading-spinner";
import { ClipboardPaste, Upload, PenLine, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import type { AIExtractionResult } from "@/types/assignment";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { fallbackAssignmentExtraction } from "@/lib/assignments/fallback-extraction";

const pasteSchema = z.object({
  text: z.string().min(10, "Please paste at least 10 characters of assignment text"),
});

const manualSchema = z.object({
  title: z.string().min(1, "Title is required"),
  text: z.string().min(10, "Please provide assignment details"),
});

type AssignmentFormProps = {
  onExtracted: (result: AIExtractionResult, meta: { source_type: string; original_input: string; file_url?: string; file?: File }) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function AssignmentForm({ onExtracted }: AssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pasteForm = useForm({ resolver: zodResolver(pasteSchema), defaultValues: { text: "" } });
  const manualForm = useForm({ resolver: zodResolver(manualSchema), defaultValues: { title: "", text: "" } });

  const callExtractApi = async (payload: Record<string, unknown>, meta?: { file?: File }) => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/extract-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const fallback = fallbackAssignmentExtraction(String(payload.text || payload.file_name || "Uploaded assignment"));
        setNotice(data?.error || "AI extraction is unavailable here. Using clean fallback extraction for now.");
        onExtracted(fallback, {
          source_type: payload.source_type as string,
          original_input: (payload.text as string) || "",
          file_url: payload.file_url as string | undefined,
          file: meta?.file,
        });
        return;
      }

      if (data.provider === "fallback" || data.notice) {
        setNotice(data.notice || "AI features require an OpenAI API key. Using demo extraction for now.");
      }

      onExtracted(data, {
        source_type: payload.source_type as string,
        original_input: (payload.text as string) || "",
        file_url: payload.file_url as string | undefined,
        file: meta?.file,
      });
    } catch (err) {
      toast.error(friendlyErrorMessage(err, "Assignment analysis failed. You can still enter the details manually."));
    } finally {
      setLoading(false);
    }
  };

  const onPasteSubmit = pasteForm.handleSubmit(async (values) => {
    await callExtractApi({ source_type: "paste", text: values.text });
  });

  const onManualSubmit = manualForm.handleSubmit(async (values) => {
    await callExtractApi({
      source_type: "manual",
      text: `Title: ${values.title}\n\n${values.text}`,
    });
  });

  const onUploadSubmit = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be under 10MB");
      return;
    }

    setLoading(true);
    try {
      const isPdf = file.type === "application/pdf";
      const sourceType = isPdf ? "pdf" : "screenshot";

      let text = "";
      if (file.type.startsWith("text/")) {
        text = await file.text();
      }

      await callExtractApi({
        source_type: sourceType,
        text: text || undefined,
        file_name: file.name,
        file_type: file.type,
      }, { file });
    } catch (err) {
      toast.error(friendlyErrorMessage(err, "Upload failed. You can still save the assignment manually."));
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Analyzing your assignment..." />;
  }

  return (
    <Tabs defaultValue="paste" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="paste" className="gap-2">
          <ClipboardPaste className="h-4 w-4" />
          <span className="hidden sm:inline">Paste</span>
        </TabsTrigger>
        <TabsTrigger value="upload" className="gap-2">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </TabsTrigger>
        <TabsTrigger value="manual" className="gap-2">
          <PenLine className="h-4 w-4" />
          <span className="hidden sm:inline">Manual</span>
        </TabsTrigger>
      </TabsList>

      {notice && (
        <div className="mt-4 flex gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 flex-none" />
          <p>{notice}</p>
        </div>
      )}

      <TabsContent value="paste">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onPasteSubmit} className="space-y-4">
              <div>
                <Label htmlFor="paste-text">Paste assignment instructions</Label>
                <Textarea
                  id="paste-text"
                  placeholder="Paste from Canvas, Google Classroom, email, or syllabus..."
                  className="mt-2 min-h-[200px]"
                  {...pasteForm.register("text")}
                />
                {pasteForm.formState.errors.text && (
                  <p className="mt-1 text-sm text-destructive">{pasteForm.formState.errors.text.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze assignment
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="upload">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload screenshot or PDF (max 10MB)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  className="mt-2"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  For best results, also paste text in the Paste tab.
                </p>
              </div>
              <Button onClick={onUploadSubmit} className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="manual">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="manual-title">Assignment title</Label>
                <Input id="manual-title" placeholder="e.g. Chapter 5 Essay" className="mt-2" {...manualForm.register("title")} />
                {manualForm.formState.errors.title && (
                  <p className="mt-1 text-sm text-destructive">{manualForm.formState.errors.title.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="manual-text">Details & instructions</Label>
                <Textarea
                  id="manual-text"
                  placeholder="Describe the assignment, requirements, and due date..."
                  className="mt-2 min-h-[200px]"
                  {...manualForm.register("text")}
                />
                {manualForm.formState.errors.text && (
                  <p className="mt-1 text-sm text-destructive">{manualForm.formState.errors.text.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze assignment
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
