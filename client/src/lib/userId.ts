/**
 * getOrCreateUserId
 *
 * Generates a stable anonymous UUID for this browser, persisted in localStorage.
 * This ID is sent as the x-user-id header on every API call so the server can
 * track Pro status without requiring a full login system.
 *
 * Note: this is a lightweight identity mechanism — not authentication.
 * The UUID acts as a bearer token, so HTTPS is required in production.
 */
export function getOrCreateUserId(): string {
  const KEY = "jmr_user_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    // crypto.randomUUID() is available in all modern browsers and Node 19+
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
