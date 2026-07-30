import 'server-only';
import { cookies } from 'next/headers';
import { clientEnv } from './config';
import { ApiError } from './api-client';

interface ApiErrorResponseBody {
  error: {
    message: string;
    details?: Record<string, string[] | undefined>;
  };
}

/**
 * Server Component equivalent of api-client.ts's apiClient. Cannot
 * reuse that wrapper directly — its credentials: 'include' relies on
 * the browser's cookie jar, which doesn't exist here: this fetch runs
 * server-to-server (Next.js server → Express server), so the incoming
 * visitor's cookie has to be read from the request and forwarded by
 * hand. Reuses the same ApiError type and error-body shape so calling
 * code doesn't need two different error-handling patterns depending on
 * which context it's in.
 *
 * The 'server-only' import guarantees a build-time error if this ever
 * gets imported into a Client Component by mistake, instead of a
 * confusing runtime failure the first time cookies() is called outside
 * a server context.
 */
async function serverApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();

  let response: Response;
  try {
    response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieStore.toString(),
        ...init?.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Unable to reach the server.', 0);
  }

  if (!response.ok) {
    let parsedBody: ApiErrorResponseBody | null = null;
    try {
      parsedBody = (await response.json()) as ApiErrorResponseBody;
    } catch {
      // Falls through to the generic message below.
    }

    throw new ApiError(
      parsedBody?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      parsedBody?.error?.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const serverApiClient = {
  get: <T>(path: string): Promise<T> => serverApiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    serverApiFetch<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    serverApiFetch<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string): Promise<T> => serverApiFetch<T>(path, { method: 'DELETE' }),
};
