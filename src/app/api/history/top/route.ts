import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { badRequest, cached, checkVersion, intParam } from '@/lib/historyApi';
import { prisma } from '@/lib/prisma';
import { topOfSlice } from '@/lib/historyStats.mjs';

export const dynamic = 'force-dynamic';

// Public: top artists and tracks for a slice (stat #1). ?v=<version> plus any of year, month
// (1-12, alone = every year's), from/to (local hours 0-23, from > to wraps past midnight),
// country (ISO code).
export async function GET(request: NextRequest) {
  try {
    const check = await checkVersion(request);
    if (check.error) return check.error;

    const year = intParam(request, 'year', 2000, 2100);
    const month = intParam(request, 'month', 1, 12);
    const from = intParam(request, 'from', 0, 23);
    const to = intParam(request, 'to', 0, 23);
    const country = request.nextUrl.searchParams.get('country') ?? undefined;
    if (year === null || month === null || from === null || to === null) return badRequest('Invalid year, month or hours');
    if ((from === undefined) !== (to === undefined)) return badRequest('Give both from and to');
    if (country !== undefined && !/^[A-Z]{2}$/.test(country)) return badRequest('Invalid country');

    const result = await topOfSlice(prisma, check.userId, {
      year,
      month,
      hours: from === undefined ? undefined : [from, to],
      country,
    });
    return cached(result);
  } catch (error) {
    console.error('Error fetching history slice:', error);
    return handleApiError(error);
  }
}
