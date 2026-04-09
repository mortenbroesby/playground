import { createNowPlayingResponse } from '../src/server/now-playing';

export const runtime = 'nodejs';

export async function GET() {
  return createNowPlayingResponse({
    env: process.env,
    fetchImpl: fetch,
  });
}
