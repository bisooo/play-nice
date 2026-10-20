import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { cached, checkVersion } from '@/lib/historyApi';
import { prisma } from '@/lib/prisma';
import { artistList } from '@/lib/historyStats.mjs';

export const dynamic = 'force-dynamic';

// Public: every artist I've played, for the deep dive's search (stat #3). ?v=<version>
export async function GET(request: NextRequest) {
  try {
    const check = await checkVersion(request);
    if (check.error) return check.error;
    return cached(await artistList(prisma, check.userId));
  } catch (error) {
    console.error('Error fetching artist list:', error);
    return handleApiError(error);
  }
}
