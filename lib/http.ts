import type { NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Wraps a route handler so every error becomes the same JSON shape: { error: "message" }
export function handler<Ctx>(fn: (req: NextRequest, ctx: Ctx) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      unstable_rethrow(err); // let Next.js's own internal signals pass through untouched
      if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return Response.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
      }
      console.error(err);
      return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function readJson(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}
