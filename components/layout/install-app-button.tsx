"use client";

import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallApp } from "@/lib/pwa/install";

type InstallAppButtonProps = {
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
};

export function InstallAppButton({ variant = "outline", className }: InstallAppButtonProps) {
  const { canInstall, installed, install, standalone } = useInstallApp();

  const handleInstall = async () => {
    if (installed || standalone) return;
    if (!canInstall) {
      toast.info("Use your browser menu to add CramDeck Scholar to your home screen or dock.");
      return;
    }
    const accepted = await install();
    toast[accepted ? "success" : "info"](accepted ? "CramDeck Scholar installed" : "Install dismissed");
  };

  if (installed || standalone) {
    return (
      <Button variant={variant} className={className} disabled>
        <CheckCircle2 className="h-4 w-4" />
        App Installed
      </Button>
    );
  }

  return (
    <Button variant={variant} className={className} onClick={handleInstall}>
      {canInstall ? <Download className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
      Install CramDeck Scholar
    </Button>
  );
}
