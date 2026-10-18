import { NextRequest, NextResponse } from 'next/server';
import { getOwnerUser } from '@/lib/owner';
import { prisma } from '@/lib/prisma';

// Shared by the public history stats routes (src/app/api/history/*). Interactive results are
// CDN-cached per data version: the stats route returns `version` (when PlayFact last changed),
// pages pass it back as `v`, so new plays mean new URLs and nothing stale is served. A missing or
// old `v` gets 409 with the current one, so visitors can't bypass the cache with made-up values.

const CDN_CACHE = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600';

export async function historyVersion() {
  const owner = await getOwnerUser();
  if (!owner) return null;
  const row = await prisma.historyStats.findUnique({ where: { userId: owner.id }, select: { factsUpdatedAt: true } });
  return row ? { userId: owner.id, version: String(row.factsUpdatedAt.getTime()) } : null;
}

// The owner and data version if the request's `v` is current, else the response to send
export async function checkVersion(request: NextRequest) {
  const current = await historyVersion();
  if (!current) return { error: NextResponse.json({ error: 'No listening history yet' }, { status: 404 }) };
  if (request.nextUrl.searchParams.get('v') !== current.version) {
    return { error: NextResponse.json({ error: 'Stale version', version: current.version }, { status: 409, headers: { 'Cache-Control': 'no-store' } }) };
  }
  return { userId: current.userId };
}

export const cached = (body: unknown) => NextResponse.json(body, { headers: { 'Cache-Control': CDN_CACHE } });
export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });

// An integer query param within [min, max]; undefined if absent, null if invalid
export function intParam(request: NextRequest, name: string, min: number, max: number) {
  const raw = request.nextUrl.searchParams.get(name);
  if (raw === null || raw === '') return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

export const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
