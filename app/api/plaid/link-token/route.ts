import { NextRequest, NextResponse } from "next/server";
import { createLinkToken } from "@/lib/plaid";
import { getServerSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { linkToken } = await createLinkToken(session.user.id);

    return NextResponse.json({ linkToken });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create link token' },
      { status: 500 }
    );
  }
}
