// app/api/auth/signout/route.ts
import { NextRequest, NextResponse } from "next/server";

function clearSessionCookies(response: NextResponse) {
  response.cookies.set("next-auth.session-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("__Secure-next-auth.session-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ message: "Signed out successfully" });
    clearSessionCookies(response);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sign out";
    console.error("Error signing out:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
