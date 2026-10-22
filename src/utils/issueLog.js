// Issue records are never auto-deleted, so the log always covers at least this many days.
export const ISSUE_LOG_DEFAULT_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;

// An item counts as issued once its redemption request is approved. `days` of null means all time.
export function getIssuedItems(requests, days) {
  const cutoff = days ? Date.now() - days * DAY_MS : 0;
  return requests
    .filter((r) => r.status === 'approved' && new Date(r.resolvedDate).getTime() >= cutoff)
    .sort((a, b) => new Date(b.resolvedDate) - new Date(a.resolvedDate));
}
