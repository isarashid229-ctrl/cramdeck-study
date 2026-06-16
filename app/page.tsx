import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { EagleCramLogo } from "@/components/brand/eaglecram-logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-hero">
      <header className="border-b bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="EagleCram home">
            <EagleCramLogo iconClassName="h-9 w-9" />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/demo">View Demo</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />
        <FeatureGrid />

        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold">Ready to stress less about homework?</h2>
            <p className="mt-4 text-muted-foreground">
              Join students who use EagleCram to stay organized, on track, and ahead of deadlines.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/auth/signup">Start for free</Link>
            </Button>
            <Button size="lg" variant="outline" className="ml-0 mt-3 sm:ml-3" asChild>
              <Link href="/demo">Explore the demo</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} EagleCram. Built for students, by students.</p>
      </footer>
    </div>
  );
}
