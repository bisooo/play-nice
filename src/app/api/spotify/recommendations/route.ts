import { SpotifyService } from '@/lib/spotifyService';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { handleApiError } from '@/lib/apiUtils';
import { TrackParams } from '@/types/spotifyTypes';

const markets = ["AD", "AE", "AG", "AL", "AM", "AO", "AR", "AT", "AU", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CG", "CH", "CI", "CL", "CM", "CO", "CR", "CV", "CW", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "ES", "ET", "FI", "FJ", "FM", "FR", "GA", "GB", "GD", "GE", "GH", "GM", "GN", "GQ", "GR", "GT", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IN", "IQ", "IS", "IT", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KR", "KW", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MG", "MH", "MK", "ML", "MN", "MO", "MR", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NZ", "OM", "PA", "PE", "PG", "PH", "PK", "PL", "PR", "PS", "PT", "PW", "PY", "QA", "RO", "RS", "RW", "SA", "SB", "SC", "SE", "SG", "SI", "SK", "SL", "SM", "SN", "SR", "ST", "SV", "SZ", "TD", "TG", "TH", "TJ", "TL", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VC", "VE", "VN", "VU", "WS", "XK", "ZA", "ZM", "ZW"];

function getTrackParams(searchParams: URLSearchParams): TrackParams {
  return {
    seed_genres: searchParams.get('genre') ?? "hip-hop",
    target_tempo: searchParams.get('tempo') ?? "120",
    target_energy: searchParams.get('energy') ?? "0.5",
    target_acousticness: searchParams.get('acousticness') ?? "0.5",
    target_danceability: searchParams.get('danceability') ?? "0.5",
    target_instrumentalness: searchParams.get('instrumentalness') ?? "0.5",
    target_liveness: searchParams.get('liveness') ?? "0.5",
    target_speechiness: searchParams.get('speechiness') ?? "0.5",
    target_popularity: searchParams.get('popularity') ?? "50",
    market: markets[Math.floor(Math.random() * markets.length)],
    limit: '9',
    offset: Math.floor(Math.random() * 100).toString()
  };
}
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const spotifyApi = new SpotifyService(session);
  const trackParams = getTrackParams(req.nextUrl.searchParams);
  
  try {
    const recommendations = await spotifyApi.getRecommendations(trackParams);
    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}