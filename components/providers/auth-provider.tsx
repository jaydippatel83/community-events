"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";

type AuthState = {
  user: User | null | undefined; // undefined = still checking
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Ask the API who is logged in (the httpOnly cookie is sent automatically)
  useEffect(() => {
    api<{ user: User }>("/me")
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return <AuthContext value={{ user, setUser, logout }}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// For pages that need a logged-in user: sends visitors to /login and brings them back afterwards.
// (This is only for a smooth UI. The API itself rejects requests without a valid token.)
export function useRequireUser() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user === null) router.replace(`/login?next=${encodeURIComponent(location.pathname)}`);
  }, [user, router]);
  return user;
}
