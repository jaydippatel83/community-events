import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/http";

export const GET = handler(async (req) => {
  const session = await requireUser(req);
  return Response.json({ user: { id: session.userId, email: session.email, role: session.role } });
});
