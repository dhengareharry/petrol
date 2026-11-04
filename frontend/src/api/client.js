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

// The signed-in session lives here (AuthContext keeps it in sync), so every call is authenticated automatically.
// The access token is short-lived; when the server says it expired we swap the refresh token for a new pair and retry.
let session = { token: null, refreshToken: null };
let onUnauthorized = null; // the session is over: sign the user out
let onSessionChanged = null; // new tokens were issued: persist them

export function setSession(next) {
  session = { token: next?.token || null, refreshToken: next?.refreshToken || null };
}

export function setSessionHandlers({ unauthorized, changed }) {
  onUnauthorized = unauthorized || null;
  onSessionChanged = changed || null;
}

async function send(path, { method = 'GET', body, token, timeoutMs = 15000 } = {}) {
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
    throw new ApiError(payload?.error?.message || `Something went wrong (error ${response.status}).`, {
      status: response.status,
      code: payload?.error?.code,
    });
  }
  return payload;
}

// One refresh at a time: several requests can hit an expired token together, but the refresh token is single-use.
let refreshing = null;

function refreshSession() {
  if (!session.refreshToken) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const payload = await send('/auth/refresh', { method: 'POST', body: { refreshToken: session.refreshToken } });
        session = { token: payload.data.token, refreshToken: payload.data.refreshToken };
        if (onSessionChanged) await onSessionChanged(session);
        return true;
      } catch (error) {
        // A rejected refresh token ends the session. A network failure does not: the user stays signed in and can retry.
        if (error.status === 401 || error.status === 400) return false;
        throw error;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

/** Calls the backend and returns the response's `data` (plus `meta` for lists when `withMeta`). Failures throw an ApiError. */
export async function apiRequest(path, { withMeta = false, authenticated = true, ...options } = {}) {
  const usedToken = authenticated ? session.token : null;
  try {
    const payload = await send(path, { ...options, token: usedToken });
    return withMeta ? { data: payload?.data, meta: payload?.meta } : payload?.data;
  } catch (error) {
    if (error.status !== 401 || !usedToken) throw error;

    // The token we sent was rejected. If another request already renewed the session, just retry; otherwise renew it.
    const renewed = usedToken !== session.token || (await refreshSession());
    if (!renewed) {
      if (onUnauthorized) onUnauthorized();
      throw error;
    }
    const payload = await send(path, { ...options, token: session.token });
    return withMeta ? { data: payload?.data, meta: payload?.meta } : payload?.data;
  }
}

/** Fetches every page of a list endpoint (the server caps a page at 100 rows). Use only for small, bounded lists. */
export async function apiRequestAll(path, params = {}) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const query = new URLSearchParams({ ...params, page: String(page), pageSize: '100' }).toString();
    const { data, meta } = await apiRequest(`${path}?${query}`, { withMeta: true });
    items.push(...(data || []));
    if (!meta || page >= meta.totalPages) return items;
  }
}
