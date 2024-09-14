import { NextResponse } from 'next/server';

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('429')) {
      // Extract retry-after value if available
      const retryAfterMatch = error.message.match(/Retry-After: (\d+)/);
      const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60; // Default to 60 seconds if not found

      return NextResponse.json(
        { error: 'Too Many Requests', message: 'You have exceeded Spotify\'s rate limit.', retryAfter },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
      );
    } else if (error.message.includes('401')) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Access token has expired.' }, { status: 401 });
    } else {
      return NextResponse.json({ error: 'Spotify API Error', message: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, { status: 500 });
  }
}