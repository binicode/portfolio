import { clientEnv } from './config';

/**
 * Thrown for any failed API call — both HTTP error responses and
 * network-level failures (server unreachable, CORS rejection, etc) are
 * normalized into this one type, so calling code only ever needs to
 * handle a single error shape.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, string[] | undefined>;

  constructor(message: string, statusCode: number, details?: Record<string, string[] | undefined>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface ApiErrorResponseBody {
  error: {
    message: string;
    details?: Record<string, string[] | undefined>;
  };
}

/**
 * Core fetch wrapper. Always sends credentials so the httpOnly
 * admin_token cookie set by admin-auth.controller.ts is included
 * automatically — callers never touch the token directly. Error
 * responses are parsed to match errorHandler.ts's exact
 * `{ error: { message, details? } }` shape.
 *
 * Not used for the ai-chat SSE endpoint — that's a streaming response,
 * not a single JSON body, and gets its own dedicated function.
 */
async function apiFetch<T>(path: string, method: string, body?: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch() itself throws on network failure (server down, no
    // connection, CORS rejection) — normalized into the same ApiError
    // type as an HTTP error response.
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0);
  }

  if (!response.ok) {
    let parsedBody: ApiErrorResponseBody | null = null;
    try {
      parsedBody = (await response.json()) as ApiErrorResponseBody;
    } catch {
      // Response body wasn't valid JSON (e.g. a proxy error page) —
      // fall back to a generic message rather than letting a JSON
      // parse failure mask the real HTTP error.
    }

    throw new ApiError(
      parsedBody?.error?.message ?? `Request failed with status ${response.status}`,
      response.status,
      parsedBody?.error?.details,
    );
  }

  // DELETE responds 204 No Content — nothing to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => apiFetch<T>(path, 'GET'),
  post: <T>(path: string, body?: unknown): Promise<T> => apiFetch<T>(path, 'POST', body),
  patch: <T>(path: string, body?: unknown): Promise<T> => apiFetch<T>(path, 'PATCH', body),
  delete: <T>(path: string): Promise<T> => apiFetch<T>(path, 'DELETE'),
};
