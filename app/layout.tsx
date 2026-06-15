import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { PwaInstallPrompt } from "@/components/layout/pwa-install-prompt";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { PwaRuntime } from "@/components/layout/pwa-runtime";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CramDeck Scholar — Study, Quiz, and Homework Command Center",
  description: "Academic study platform for assignments, quizzes, games, mastery tracking, and course management.",
  manifest: "/manifest.json",
  applicationName: "CramDeck Scholar",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CramDeck",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <PwaRuntime />
            <OfflineBanner />
            {children}
            <PwaInstallPrompt />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
