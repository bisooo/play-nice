import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { badRequest, cached, checkVersion, SPOTIFY_ID } from '@/lib/historyApi';
import { prisma } from '@/lib/prisma';
import { artistDeepDive } from '@/lib/historyStats.mjs';

export const dynamic = 'force-dynamic';

// Public: one artist's history (stat #3). ?v=<version>
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const check = await checkVersion(request);
    if (check.error) return check.error;
    if (!SPOTIFY_ID.test(params.id)) return badRequest('Invalid artist id');

    const result = await artistDeepDive(prisma, check.userId, params.id);
    if (!result) return NextResponse.json({ error: 'No plays for this artist' }, { status: 404 });
    return cached(result);
  } catch (error) {
    console.error('Error fetching artist history:', error);
    return handleApiError(error);
  }
}
