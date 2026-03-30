import { NextRequest, NextResponse } from "next/server";
import { isDemoWriteRequest } from "@/lib/demo-mode";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
