// app/api/auth/login/route.ts
// Custom login endpoint that validates credentials and delegates to NextAuth
// The actual login is handled by NextAuth's signIn() from the client,
// but this endpoint can be used for direct API calls or custom flows.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic input validation
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: "Email is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { error: "Password is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    // Optional: add more specific validation (e.g., email format, password length)

    // TODO: Implement rate limiting to prevent brute force attacks
    // For example, limit login attempts per IP or per email.
    // In production, consider using a Redis-based rate limiter or Vercel Edge Middleware.

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}