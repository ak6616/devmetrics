import { NextRequest, NextResponse } from "next/server";
import { isDemoWriteRequest } from "@/lib/demo-mode";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const ipHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now >= entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demo rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  if (isDemoWriteRequest(request.method, pathname)) {
    return NextResponse.json({
      success: true,
      demo: true,
      message: "Demo mode – zmiany nie zostały zapisane",
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
