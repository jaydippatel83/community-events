import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./http";

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

// Reminders and card designs can only be attached to an active event
export async function requireActiveEvent(id: string) {
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, isActive: true } });
  if (!event || !event.isActive) throw new HttpError(404, "Event not found");
  return event;
}
