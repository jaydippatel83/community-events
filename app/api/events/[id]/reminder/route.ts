import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireActiveEvent } from "@/lib/events";
import { handler } from "@/lib/http";

type Ctx = RouteContext<"/api/events/[id]/reminder">;

// PUT /api/events/:id/reminder — turn the reminder on.
// Upsert on the (userId, eventId) primary key, so calling it twice is harmless.
export const PUT = handler(async (req, ctx: Ctx) => {
  const { userId } = await requireUser(req);
  const { id: eventId } = await ctx.params;
  await requireActiveEvent(eventId);

  await prisma.reminder.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId },
    update: {},
  });
  return Response.json({ eventId, reminded: true });
});

// DELETE /api/events/:id/reminder — turn the reminder off (also harmless if it was already off)
export const DELETE = handler(async (req, ctx: Ctx) => {
  const { userId } = await requireUser(req);
  const { id: eventId } = await ctx.params;

  await prisma.reminder.deleteMany({ where: { userId, eventId } });
  return Response.json({ eventId, reminded: false });
});
