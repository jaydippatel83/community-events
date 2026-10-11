import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

// libSQL works with a local SQLite file (DATABASE_URL="file:./dev.db") and with a hosted
// Turso database in production (DATABASE_URL="libsql://…" + TURSO_AUTH_TOKEN).
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Reuse one client during dev hot-reloads instead of opening a new connection each time
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
