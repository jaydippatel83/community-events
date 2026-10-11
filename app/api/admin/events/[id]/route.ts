import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { handler, HttpError, readJson } from "@/lib/http";

const StatusBody = z.object({ isActive: z.boolean("isActive must be true or false") });

// PATCH /api/admin/events/:id — make an event Active or Inactive.
// There is deliberately no DELETE: events are only ever deactivated.
export const PATCH = handler(async (req, ctx: RouteContext<"/api/admin/events/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { isActive } = StatusBody.parse(await readJson(req));

  const exists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Event not found");

  const event = await prisma.event.update({ where: { id }, data: { isActive } });
  return Response.json({ event });
});
