"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

type ThemeModeToggleProps = {
  compact?: boolean;
};

export function ThemeModeToggle({ compact = false }: ThemeModeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("h-10 rounded-xl bg-muted", compact ? "w-10" : "w-full")} />;
  }

  if (compact) {
    const current = modes.find((mode) => mode.value === theme) ?? modes[0];
    const Icon = current.icon;
    const nextMode = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Theme: ${current.label}`}
        title={`Theme: ${current.label}`}
        onClick={() => setTheme(nextMode)}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border bg-background p-1">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = theme === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => setTheme(mode.value)}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors",
              isActive && "bg-primary text-primary-foreground shadow-sm"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
