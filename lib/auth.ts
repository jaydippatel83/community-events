import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { HttpError } from "./http";

export const TOKEN_COOKIE = "token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = "USER" | "ADMIN";
type Session = { userId: string; email: string; role: Role };

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(value);
};

// Passwords: bcrypt with a random salt per password, 10 rounds. Never stored or logged in plain text.
export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function signToken(session: Session) {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return { userId: payload.sub!, email: payload.email as string, role: payload.role as Role };
  } catch {
    return null; // expired, tampered or malformed
  }
}

// Web pages send the token as an httpOnly cookie; a mobile app sends "Authorization: Bearer <token>".
export async function getSession(req: NextRequest): Promise<Session | null> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies.get(TOKEN_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export async function requireUser(req: NextRequest) {
  const session = await getSession(req);
  if (!session) throw new HttpError(401, "Please log in to continue");
  return session;
}

export async function requireAdmin(req: NextRequest) {
  const session = await requireUser(req);
  if (session.role !== "ADMIN") throw new HttpError(403, "Admins only");
  return session;
}

export const tokenCookieOptions = {
  httpOnly: true, // not readable from JavaScript, so XSS can't steal it
  sameSite: "lax" as const, // not sent on cross-site POSTs
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
};
