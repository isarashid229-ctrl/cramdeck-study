"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type SqlCopyBlockProps = {
  title: string;
  filename: string;
  sql: string;
};

export function SqlCopyBlock({ title, filename, sql }: SqlCopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const copySql = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{filename}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copySql}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy SQL"}
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <code>{sql}</code>
      </pre>
    </div>
  );
}
