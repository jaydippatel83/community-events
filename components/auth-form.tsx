"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";

// Only follow ?next= links inside this site (blocks open-redirects like ?next=//evil.com)
const safeNext = (next: string | null) => (next?.startsWith("/") && !next.startsWith("//") ? next : null);

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await api<{ token: string; user: User }>(`/auth/${mode}`, {
        method: "POST",
        json: { email: form.get("email"), password: form.get("password") },
      });
      setUser(user);
      // New users pick favourite categories first; admins go to their dashboard
      router.push(!isLogin ? "/favourites" : (next ?? (user.role === "ADMIN" ? "/admin" : "/")));
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  const otherHref = `${isLogin ? "/signup" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">{isLogin ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription>
          {isLogin ? "Log in to see your feed and reminders." : "Sign up to get a feed of events you'll love."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
              required
              className="h-10"
            />
            {!isLogin && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
            {submitting && <Spinner />}
            {isLogin ? "Log in" : "Sign up"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link href={otherHref} className="font-medium text-primary hover:underline">
              {isLogin ? "Create an account" : "Log in"}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
