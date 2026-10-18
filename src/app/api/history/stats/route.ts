import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { getOwnerUser } from '@/lib/owner';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public: the fixed history stats (recomputed daily) and the data version the interactive
// routes need as `v`. Not CDN-cached: it's one document read, and it must show a new version
// as soon as new plays are prepared.
export async function GET() {
  try {
    const owner = await getOwnerUser();
    const row = owner && await prisma.historyStats.findUnique({ where: { userId: owner.id } });
    if (!row) return NextResponse.json({ error: 'No listening history yet' }, { status: 404 });
    return NextResponse.json(
      { version: String(row.factsUpdatedAt.getTime()), computedAt: row.computedAt, stats: row.stats },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error fetching history stats:', error);
    return handleApiError(error);
  }
}
