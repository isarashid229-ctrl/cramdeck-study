import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { DatabaseSetupAlert } from "./database-setup-alert";
import { QuickAddDialog } from "./quick-add-dialog";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
          <DatabaseSetupAlert />
          <div className="sticky top-0 z-30 hidden border-b bg-background/85 px-4 py-3 backdrop-blur lg:block">
            <div className="mx-auto flex max-w-7xl justify-end">
              <QuickAddDialog />
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
