import { prisma } from "@/lib/prisma";
import { visibleEventsWhere } from "@/lib/events";
import { handler } from "@/lib/http";

// GET /api/events/cities — cities that currently have visible events, for the city filter
export const GET = handler(async () => {
  const rows = await prisma.event.findMany({
    where: visibleEventsWhere({}),
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return Response.json({ cities: rows.map((r) => r.city) });
});
