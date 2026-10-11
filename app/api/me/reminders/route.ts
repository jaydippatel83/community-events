import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/http";

// GET /api/me/reminders — ids of events the user asked to be reminded about,
// so the "Remind me" buttons can show the right state after a refresh
export const GET = handler(async (req) => {
  const { userId } = await requireUser(req);
  const rows = await prisma.reminder.findMany({ where: { userId }, select: { eventId: true } });
  return Response.json({ eventIds: rows.map((r) => r.eventId) });
});
