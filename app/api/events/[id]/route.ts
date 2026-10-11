import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { handler, HttpError } from "@/lib/http";

// GET /api/events/:id — inactive events are hidden from everyone except the admin
export const GET = handler(async (req, ctx: RouteContext<"/api/events/[id]">) => {
  const { id } = await ctx.params;
  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) throw new HttpError(404, "Event not found");
  if (!event.isActive && (await getSession(req))?.role !== "ADMIN") {
    throw new HttpError(404, "Event not found");
  }

  return Response.json({ event });
});
