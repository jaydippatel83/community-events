import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { handler, readJson } from "@/lib/http";

const FavouritesBody = z.object({
  categories: z.array(z.enum(CATEGORIES, "Unknown category")).max(CATEGORIES.length),
});

// GET /api/me/favourites
export const GET = handler(async (req) => {
  const { userId } = await requireUser(req);
  const rows = await prisma.favouriteCategory.findMany({ where: { userId } });
  return Response.json({ categories: rows.map((r) => r.category) });
});

// PUT /api/me/favourites { categories: ["Music", "Food"] } — replaces the whole list
export const PUT = handler(async (req) => {
  const { userId } = await requireUser(req);
  const categories = [...new Set(FavouritesBody.parse(await readJson(req)).categories)];

  // Delete + insert in one transaction so the list is never half-saved
  await prisma.$transaction([
    prisma.favouriteCategory.deleteMany({ where: { userId } }),
    prisma.favouriteCategory.createMany({ data: categories.map((category) => ({ userId, category })) }),
  ]);

  return Response.json({ categories });
});
