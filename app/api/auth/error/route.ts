// Dynamic error page that shows NextAuth error details
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const errorDescriptions: Record<string, string> = {
    "google": "Google sign-in failed. Check that your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct, and that the callback URL matches in Google Cloud Console.",
    "CredentialsSignin": "Invalid email or password.",
    "OAuthCallback": "OAuth callback error. Check provider configuration.",
    "OAuthCreateAccount": "Could not create account. This email may already be registered with a different sign-in method.",
    "EmailCreateAccount": "Could not create account with this email.",
    "Callback": "Callback error.",
    "JWTSessionError": "Session error.",
    "AccessDenied": "Access denied.",
    "Verification": "Verification error.",
    "default": "Sign-in failed. Please try again.",
  };
  const description = errorDescriptions[error || ""] || errorDescriptions.default;
  
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error || "")}&error_description=${encodeURIComponent(description)}`, 
    url.origin)
  );
};