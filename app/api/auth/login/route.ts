import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken, verifyPassword, TOKEN_COOKIE, tokenCookieOptions, type Role } from "@/lib/auth";
import { handler, HttpError, readJson } from "@/lib/http";

const LoginBody = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase().trim()),
  password: z.string().min(1, "Enter your password"),
});

export const POST = handler(async (req) => {
  const { email, password } = LoginBody.parse(await readJson(req));

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for "no such user" and "wrong password" so emails can't be probed
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Incorrect email or password");
  }

  const role = user.role as Role;
  const token = await signToken({ userId: user.id, email: user.email, role });
  const res = NextResponse.json({ token, user: { id: user.id, email: user.email, role } });
  res.cookies.set(TOKEN_COOKIE, token, tokenCookieOptions);
  return res;
});
