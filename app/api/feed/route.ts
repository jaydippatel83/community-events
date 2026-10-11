import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { visibleEventsWhere } from "@/lib/events";
import { handler } from "@/lib/http";

const Query = z.object({
  page: z.coerce.number("Page must be a number").int().min(1, "Page must be 1 or more").default(1),
  limit: z.coerce.number("Limit must be a number").int().min(1).max(50, "Limit can be at most 50").default(9),
});

// GET /api/feed?page=1 — upcoming events from the user's favourite categories
export const GET = handler(async (req) => {
  const { userId } = await requireUser(req);
  const { page, limit } = Query.parse(Object.fromEntries(req.nextUrl.searchParams));

  const favourites = await prisma.favouriteCategory.findMany({ where: { userId } });
  const categories = favourites.map((f) => f.category);

  // No favourites yet: tell the client so it can prompt the user to pick some
  if (categories.length === 0) {
    return Response.json({ items: [], page, limit, total: 0, totalPages: 0, categories });
  }

  const where = visibleEventsWhere({ categories });
  const [items, total] = await Promise.all([
    prisma.event.findMany({ where, orderBy: { startsAt: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.event.count({ where }),
  ]);

  return Response.json({ items, page, limit, total, totalPages: Math.ceil(total / limit), categories });
});
