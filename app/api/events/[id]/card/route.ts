import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CARD_THEMES, MAX_STICKERS, STICKERS } from "@/lib/constants";
import { requireActiveEvent } from "@/lib/events";
import { handler, readJson } from "@/lib/http";

type Ctx = RouteContext<"/api/events/[id]/card">;

const DEFAULT_CARD = { theme: CARD_THEMES[0], stickers: [] as string[] };

const CardBody = z.object({
  theme: z.enum(CARD_THEMES, "Unknown theme"),
  stickers: z
    .array(z.enum(STICKERS, "Unknown sticker"))
    .max(MAX_STICKERS, `You can add up to ${MAX_STICKERS} stickers`)
    .refine((s) => new Set(s).size === s.length, "Each sticker can only be added once"),
});

// GET /api/events/:id/card — the user's saved design, or the default if they haven't saved one
export const GET = handler(async (req, ctx: Ctx) => {
  const { userId } = await requireUser(req);
  const { id: eventId } = await ctx.params;
  await requireActiveEvent(eventId);

  const saved = await prisma.cardDesign.findUnique({ where: { userId_eventId: { userId, eventId } } });
  const card = saved ? { theme: saved.theme, stickers: JSON.parse(saved.stickers) } : DEFAULT_CARD;
  return Response.json({ card });
});

// PUT /api/events/:id/card { theme: "ocean", stickers: ["music", "star"] }
export const PUT = handler(async (req, ctx: Ctx) => {
  const { userId } = await requireUser(req);
  const { id: eventId } = await ctx.params;
  await requireActiveEvent(eventId);
  const { theme, stickers } = CardBody.parse(await readJson(req));

  // SQLite has no array type, so the sticker list is stored as a JSON string
  const data = { theme, stickers: JSON.stringify(stickers) };
  await prisma.cardDesign.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId, ...data },
    update: data,
  });
  return Response.json({ card: { theme, stickers } });
});
