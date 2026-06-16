"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { EagleMark } from "@/components/brand/eaglecram-logo";

const signupSchema = z
  .object({
    full_name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupInput = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const supabase = createClient();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    setAuthMessage(null);
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname.startsWith("/cramdeck-study") ? "/cramdeck-study" : ""}/auth/login`
        : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name },
        emailRedirectTo,
      },
    });
    setLoading(false);

    if (error) {
      const message = friendlyErrorMessage(error, "Could not create account.");
      setAuthMessage({ type: "error", text: message });
      toast.error(message);
      return;
    }

    if (data.session) {
      const message = "Account created. Welcome to EagleCram!";
      setAuthMessage({ type: "success", text: message });
      toast.success(message);
      router.push("/dashboard");
    } else {
      const message = "Account created. Check your email to confirm, then sign in.";
      setAuthMessage({ type: "success", text: message });
      toast.success(message);
      router.push("/auth/login");
    }
    router.refresh();
  });

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 inline-flex" aria-label="EagleCram home">
            <EagleMark className="h-12 w-12 rounded-2xl" />
          </Link>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Create your EagleCram account to save progress, points, games, and avatar unlocks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" className="mt-2" {...form.register("full_name")} />
              {form.formState.errors.full_name && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-2" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="mt-2" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" className="mt-2" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="fax_number">Fax number or landline number</Label>
              <Input
                id="fax_number"
                className="mt-2 cursor-not-allowed opacity-80"
                placeholder="Just kidding!"
                disabled
                readOnly
                aria-describedby="fax-helper"
              />
              <p id="fax-helper" className="mt-1 text-xs text-muted-foreground">
                We promise we are not living in 1998.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
            {authMessage && (
              <p
                className={`rounded-lg border px-3 py-2 text-sm ${
                  authMessage.type === "error"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {authMessage.text}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Want to explore first?{" "}
            <Link href="/demo" className="font-medium text-primary hover:underline">
              View Demo
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
