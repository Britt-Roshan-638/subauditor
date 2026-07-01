import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    // Validate and clamp limit and offset to prevent excessive resource usage
    let limit = parseInt(searchParams.get('limit') || '50', 10);
    let offset = parseInt(searchParams.get('offset') || '0', 10);

    // Ensure limit is between 1 and 100
    if (isNaN(limit) || limit < 1) {
      limit = 50; // default
    } else if (limit > 100) {
      limit = 100; // max
    }

    // Ensure offset is non-negative
    if (isNaN(offset) || offset < 0) {
      offset = 0;
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.transaction.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ transactions, total });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}