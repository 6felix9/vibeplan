const sessionStorageKey = "vibeplan:session-id";

export function getOrInitializeSessionId() {
  if (typeof window === "undefined") return "";

  let sessionId = window.localStorage.getItem(sessionStorageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem(sessionStorageKey, sessionId);
  }

  return sessionId;
}
