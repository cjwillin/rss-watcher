import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { SIGN_IN_PATH } from "@/lib/paths";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = SIGN_IN_PATH;
  url.searchParams.set(
    "callbackUrl",
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  );
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/app/:path*"] };
