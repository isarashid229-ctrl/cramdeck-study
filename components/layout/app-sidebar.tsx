"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  HelpCircle,
  User,
  Sparkles,
  LogOut,
  BrainCircuit,
  Gamepad2,
  Wand2,
  BookOpenCheck,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Gift,
  Layers3,
  PlugZap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeModeToggle } from "./theme-mode-toggle";

const navSections = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/assignments", label: "Assignments", icon: ListTodo },
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/integrations", label: "Integrations", icon: PlugZap },
    ],
  },
  {
    label: "Study",
    items: [
      { href: "/study", label: "Study Hub", icon: BookOpenCheck },
      { href: "/test-me", label: "Test Me", icon: BrainCircuit },
      { href: "/games", label: "Games", icon: Gamepad2 },
      { href: "/study#flashcards", label: "Flashcards", icon: Layers3 },
      { href: "/assignments/new", label: "Add Assignment", icon: PlusCircle },
    ],
  },
  {
    label: "Progress",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/profile", label: "Rewards", icon: Gift },
      { href: "/avatar", label: "Avatar", icon: Wand2 },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/profile", label: "Profile", icon: User },
      { href: "/help", label: "Help", icon: HelpCircle },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className={cn("hidden lg:flex lg:flex-col lg:border-r lg:bg-card/80 lg:backdrop-blur", collapsed ? "lg:w-20" : "lg:w-72")}>
      <div className={cn("flex h-16 items-center gap-3 border-b px-4", collapsed ? "justify-center" : "px-6")}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        {!collapsed && <div>
          <span className="block text-lg font-bold leading-tight">CramDeck Scholar</span>
          <span className="block text-xs text-muted-foreground">Study command center</span>
        </div>}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed && <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</p>}
            {section.items.map((item) => {
              const baseHref = item.href.split("#")[0];
              const isActive =
                pathname === baseHref ||
                (baseHref !== "/dashboard" && pathname.startsWith(baseHref) && baseHref !== "/profile") ||
                (item.label === "Profile" && pathname === "/profile");
              return (
                <Link
                  key={`${section.label}-${item.href}-${item.label}`}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t p-4">
        {!collapsed && <ThemeModeToggle />}
        <Button variant="ghost" className={cn("w-full gap-3 text-muted-foreground", collapsed ? "px-2" : "justify-start")} onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
