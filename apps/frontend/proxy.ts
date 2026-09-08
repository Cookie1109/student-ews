import { NextRequest, NextResponse } from "next/server";
import { backendOrigin } from "@/lib/backend-origin";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/v1/")) {
    // Runtime routing keeps cookies and API URLs on the browser's own origin.
    return NextResponse.rewrite(new URL(`${pathname}${search}`, backendOrigin()));
  }

  // Optimistic navigation guard; backend verifies the session and permissions.
  if (!request.cookies.get("sms_access_token")?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
