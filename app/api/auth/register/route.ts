import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

function generateReferralCode(name: string, email: string): string {
  const base = (name || email.split("@")[0]).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || "USER"}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, password, referralCode } = await req.json();

    // Input validation
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: "Email is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { error: "Password is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (password.trim().length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    // Optional: add email format validation

    // TODO: Implement rate limiting to prevent brute force/account enumeration
    // For example, limit registration attempts per IP or per email domain.
    // In production, consider using a Redis-based rate limiter or Vercel Edge Middleware.

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    let referredBy: string | undefined;
    if (referralCode && typeof referralCode === "string" && referralCode.trim().length >= 3) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.trim() },
      });
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name: name.trim(),
        password: hashedPassword,
        referralCode: generateReferralCode(name.trim(), normalizedEmail),
        referredBy,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}