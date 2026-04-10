import { createNowPlayingResponse } from '../src/server/now-playing';

export const runtime = 'nodejs';

export async function GET(request?: Request) {
  const start = Date.now();
  const requestId = request?.headers.get('x-vercel-id') ?? null;

  console.log(
    JSON.stringify({
      level: 'info',
      msg: 'now-playing.start',
      requestId,
    }),
  );

  try {
    const response = await createNowPlayingResponse({
      env: process.env,
      fetchImpl: fetch,
    });

    console.log(
      JSON.stringify({
        level: 'info',
        msg: 'now-playing.done',
        requestId,
        status: response.status,
        ms: Date.now() - start,
      }),
    );

    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'now-playing.failed',
        requestId,
        error: error instanceof Error ? error.message : String(error),
        ms: Date.now() - start,
      }),
    );

    return Response.json(
      {
        error: 'Failed to load now playing state',
      },
      {
        status: 500,
      },
    );
  }
}
