// Dynamic error page that shows NextAuth error details
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const errorDescriptions: Record<string, string> = {
    "google": "Google sign-in failed. Check that your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct, and that the callback URL matches in Google Cloud Console.",
    "CredentialsSignin": "Invalid email or password.",
    "OAuthCallback": "OAuth callback error. Check provider configuration.",
    "OAuthCreateAccount": "Could not create account. This email may already be registered with a different sign-in method.",
    "default": "Sign-in failed. Please try again.",
  };
  const description = errorDescriptions[error || ""] || errorDescriptions.default;
  
  const redirectUrl = new URL("/login", url.origin);
  if (error) {
    redirectUrl.searchParams.set("error", error);
    redirectUrl.searchParams.set("error_description", description);
  }
  return NextResponse.redirect(redirectUrl);
}