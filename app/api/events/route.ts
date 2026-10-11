import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { visibleEventsWhere } from "@/lib/events";
import { handler } from "@/lib/http";

// Empty strings (e.g. ?city=) are treated as "no filter"
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const Query = z.object({
  category: z.preprocess(emptyToUndefined, z.enum(CATEGORIES, "Unknown category").optional()),
  city: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  q: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  page: z.coerce.number("Page must be a number").int().min(1, "Page must be 1 or more").default(1),
  limit: z.coerce.number("Limit must be a number").int().min(1).max(50, "Limit can be at most 50").default(9),
});

// GET /api/events?category=Music&city=Coimbatore&q=night&page=1&limit=9
export const GET = handler(async (req) => {
  const { category, city, q, page, limit } = Query.parse(
    Object.fromEntries(req.nextUrl.searchParams),
  );

  // All filters are combined with AND, so they narrow each other down
  const where = visibleEventsWhere({ categories: category && [category], city, q });

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startsAt: "asc" }, // nearest date first
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return Response.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
});
