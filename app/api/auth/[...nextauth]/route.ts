// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Log errors for debugging OAuth failures
export async function GET(request: Request) {
  try {
    return await handler.GET(request);
  } catch (e) {
    console.error("NextAuth GET error:", e);
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    return await handler.POST(request);
  } catch (e) {
    console.error("NextAuth POST error:", e);
    throw e;
  }
}
