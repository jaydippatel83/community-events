import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { handler, readJson } from "@/lib/http";

const NewEvent = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  category: z.enum(CATEGORIES, "Pick a category"),
  city: z.string().trim().min(2, "Enter a city").max(60),
  startsAt: z.iso
    .datetime({ offset: true, message: "Enter a valid date and time" })
    .transform((s) => new Date(s))
    .refine((d) => d > new Date(), "Date must be in the future"),
  pricePaise: z.number().int().min(0, "Price can't be negative").max(100_000_000),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  imageUrl: z.url({ protocol: /^https?$/, message: "Enter a valid http(s) image URL" }),
  isActive: z.boolean().default(true),
});

// GET /api/admin/events — every event, including inactive and past ones
export const GET = handler(async (req) => {
  await requireAdmin(req);
  const items = await prisma.event.findMany({ orderBy: { startsAt: "desc" } });
  return Response.json({ items });
});

// POST /api/admin/events — create an event
export const POST = handler(async (req) => {
  await requireAdmin(req);
  const data = NewEvent.parse(await readJson(req));
  const event = await prisma.event.create({ data });
  return Response.json({ event }, { status: 201 });
});
