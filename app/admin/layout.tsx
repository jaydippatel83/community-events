import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TOKEN_COOKIE, verifyToken } from "@/lib/auth";
import { EventGridSkeleton } from "@/components/states";

// Layer 2 of admin protection: verified on the server before any admin page is sent to the browser.
async function AdminOnly({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/");
  return children;
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Reading cookies is request-time data, which Next.js needs inside <Suspense>
  return (
    <Suspense fallback={<EventGridSkeleton count={3} />}>
      <AdminOnly>{children}</AdminOnly>
    </Suspense>
  );
}
