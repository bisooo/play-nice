import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { badRequest, cached, checkVersion, intParam } from '@/lib/historyApi';
import { prisma } from '@/lib/prisma';
import { onThisDay } from '@/lib/historyStats.mjs';

export const dynamic = 'force-dynamic';

// Public: what was played on a calendar date in past years (stat #10). ?v=<version>&month&day
// (the page passes today's date in Europe/Prague).
export async function GET(request: NextRequest) {
  try {
    const check = await checkVersion(request);
    if (check.error) return check.error;

    const month = intParam(request, 'month', 1, 12);
    const day = intParam(request, 'day', 1, 31);
    if (!month || !day) return badRequest('Give a valid month and day');

    return cached(await onThisDay(prisma, check.userId, { month, day }));
  } catch (error) {
    console.error('Error fetching on this day:', error);
    return handleApiError(error);
  }
}
