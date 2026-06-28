// app/api/auth/signout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read cookie from request directly (do not use next/headers in route handlers)
    const sessionCookie =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token");

    if (sessionCookie?.value) {
      await prisma.session.deleteMany({
        where: { sessionToken: sessionCookie.value },
      });
    }

    const response = NextResponse.json({ message: "Signed out successfully" });

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

    return response;
  } catch (error: any) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign out" },
      { status: 500 }
    );
  }
}
