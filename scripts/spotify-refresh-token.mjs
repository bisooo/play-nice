// One-off: sign in with Spotify on your own machine and print a refresh token
// for DEV_SPOTIFY_REFRESH_TOKEN (used by /api/dev/login in cloud sessions).
//
//   node scripts/spotify-refresh-token.mjs
//
// Needs SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (from .env.local or the shell),
// port 3000 free, and http://127.0.0.1:3000/api/auth/callback/spotify registered
// as a redirect URI. The token is printed here only; it never reaches a browser.
// Spotify refresh tokens last 6 months from sign-in; rerun this when it expires.

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { exec } from 'node:child_process';

// Keep in sync with SPOTIFY_SCOPES in src/lib/authOptions.ts
const SCOPES = 'user-read-email user-read-currently-playing user-library-read user-top-read';
const REDIRECT_URI = 'http://127.0.0.1:3000/api/auth/callback/spotify';

try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
} catch {
  // No .env.local; rely on the shell environment
}

const { SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: clientSecret } = process.env;
if (!clientId || !clientSecret) {
  console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (in .env.local or the shell).');
  process.exit(1);
}

const state = randomBytes(16).toString('hex');
const authorizeUrl = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
  state,
  show_dialog: 'true',
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/api/auth/callback/spotify') {
    res.writeHead(404).end();
    return;
  }
  if (url.searchParams.get('state') !== state || !url.searchParams.get('code')) {
    res.writeHead(400).end(`Sign-in failed: ${url.searchParams.get('error') ?? 'bad state'}`);
    return;
  }

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: url.searchParams.get('code'),
      redirect_uri: REDIRECT_URI,
    }),
  });
  const body = await tokenRes.json();

  if (!tokenRes.ok || !body.refresh_token) {
    res.writeHead(500).end('Token exchange failed; see the terminal.');
    console.error('Token exchange failed:', tokenRes.status, body.error, body.error_description);
    process.exitCode = 1;
  } else {
    res.writeHead(200).end('Done. The refresh token is in your terminal; you can close this tab.');
    console.log('\nDEV_SPOTIFY_REFRESH_TOKEN=' + body.refresh_token + '\n');
    console.log('Add that line to the cloud environment\'s env vars. Valid for 6 months.');
  }
  server.close();
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Opening Spotify sign-in. If no browser opens, visit:\n\n' + authorizeUrl + '\n');
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
  exec(`${opener} "${authorizeUrl}"`);
});
