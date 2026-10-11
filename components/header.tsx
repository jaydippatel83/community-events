"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "./providers/auth-provider";

const isActive = (href: string, pathname: string | null) =>
  pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

function NavLinks({ pathname }: { pathname: string | null }) {
  const { user } = useAuth();
  const links = [
    { href: "/", label: "Events", show: true },
    { href: "/feed", label: "My Feed", show: Boolean(user) },
    { href: "/admin", label: "Admin", show: user?.role === "ADMIN" },
  ];
  return (
    <nav className="flex items-center gap-1">
      {links
        .filter((l) => l.show)
        .map((l) => (
          <Button
            key={l.href}
            asChild
            variant="ghost"
            size="lg"
            className={cn(isActive(l.href, pathname) && "bg-secondary text-secondary-foreground")}
          >
            <Link href={l.href}>{l.label}</Link>
          </Button>
        ))}
    </nav>
  );
}

// usePathname() is URL data, which Next.js needs inside <Suspense> (see the header below)
function NavLinksWithActive() {
  return <NavLinks pathname={usePathname()} />;
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

        {/* Fallback shows the same links without the highlight until the URL is known */}
        <Suspense fallback={<NavLinks pathname={null} />}>
          <NavLinksWithActive />
        </Suspense>

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
