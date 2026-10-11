import type { Prisma } from "@/app/generated/prisma/client";

// What visitors are allowed to see: active events that haven't started yet.
// Used by the events list and (with categories) by My Feed.
export function visibleEventsWhere(filters: {
  categories?: string[];
  city?: string;
  q?: string;
}): Prisma.EventWhereInput {
  const { categories, city, q } = filters;
  return {
    isActive: true,
    startsAt: { gte: new Date() },
    ...(categories && { category: { in: categories } }),
    ...(city && { city }),
    // SQLite's LIKE is case-insensitive for English letters, so "night" matches "Night"
    ...(q && { OR: [{ title: { contains: q } }, { description: { contains: q } }] }),
  };
}
