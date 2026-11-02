import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const UNREACHABLE = "Can't reach the server. Check your internet connection and try again.";

// The signed-in user's token lives here (AuthContext keeps it in sync), so every call is authenticated automatically.
let authToken = null;
let unauthorizedHandler = null;

export function setAuthToken(token) {
  authToken = token || null;
}

/** Called when the server rejects a token we sent (expired, or the account was disabled): sign the user out. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

/** Calls the backend and returns the response's `data` (and `meta` for lists when `withMeta`). Failures throw an ApiError. */
export async function apiRequest(path, { method = 'GET', body, token = authToken, timeoutMs = 15000, withMeta = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(UNREACHABLE, { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token && token === authToken && unauthorizedHandler) unauthorizedHandler();
    throw new ApiError(payload?.error?.message || `Something went wrong (error ${response.status}).`, {
      status: response.status,
      code: payload?.error?.code,
    });
  }
  return withMeta ? { data: payload?.data, meta: payload?.meta } : payload?.data;
}

/** Fetches every page of a list endpoint (the server caps a page at 100 rows). */
export async function apiRequestAll(path, params = {}) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const query = new URLSearchParams({ ...params, page: String(page), pageSize: '100' }).toString();
    const { data, meta } = await apiRequest(`${path}?${query}`, { withMeta: true });
    items.push(...(data || []));
    if (!meta || page >= meta.totalPages) return items;
  }
}
