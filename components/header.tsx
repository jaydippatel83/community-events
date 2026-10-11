"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "./providers/auth-provider";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Button asChild variant="ghost" size="lg" className={cn(active && "bg-secondary text-secondary-foreground")}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-1 px-4">
        <Link href="/" className="mr-auto flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <CalendarHeart className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">Community Events</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/">Events</NavLink>
          {user && <NavLink href="/feed">My Feed</NavLink>}
          {user?.role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
        </nav>

        {/* Reserve the space while we check the session so the header doesn't jump */}
        <div className="flex min-w-20 justify-end">
          {user === undefined ? null : user ? (
            <Button variant="ghost" size="lg" onClick={handleLogout} className="text-muted-foreground">
              Log out
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
