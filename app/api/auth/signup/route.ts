import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, TOKEN_COOKIE, tokenCookieOptions } from "@/lib/auth";
import { handler, HttpError, readJson } from "@/lib/http";

const SignupBody = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = handler(async (req) => {
  const { email, password } = SignupBody.parse(await readJson(req));

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });

  const token = await signToken({ userId: user.id, email: user.email, role: "USER" });
  const res = NextResponse.json(
    { token, user: { id: user.id, email: user.email, role: user.role } },
    { status: 201 },
  );
  res.cookies.set(TOKEN_COOKIE, token, tokenCookieOptions);
  return res;
});
