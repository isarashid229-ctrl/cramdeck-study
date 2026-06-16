import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { DatabaseSetupAlert } from "./database-setup-alert";
import { QuickAddDialog } from "./quick-add-dialog";
import { ThemeModeToggle } from "./theme-mode-toggle";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
          <DatabaseSetupAlert />
          <div className="sticky top-0 z-30 border-b bg-background/85 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold lg:hidden">CramDeck Scholar</p>
                <p className="hidden text-sm text-muted-foreground lg:block">Workspace controls</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:block sm:w-72">
                  <ThemeModeToggle />
                </div>
                <div className="sm:hidden">
                  <ThemeModeToggle compact />
                </div>
              <QuickAddDialog />
              </div>
            </div>
          </div>
          <main className="flex-1 overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
