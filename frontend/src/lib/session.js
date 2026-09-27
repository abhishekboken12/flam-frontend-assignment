const HISTORY_KEY = 'recall:history:v1';
const MAX_HISTORY = 4;

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Returns up to the 4 most recently touched decks, newest first.
 * Wrapped in try/catch throughout because localStorage can throw
 * (private browsing, quota, disabled) and that should degrade
 * quietly — losing history is not worth crashing the app over.
 */
export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => e?.studySet?.cards?.length) : [];
  } catch {
    return [];
  }
}

/**
 * Upserts one deck into the history by id (so grading a quiz or
 * adding follow-up cards updates the same entry in place instead of
 * creating a duplicate), moves it to the front, and caps the list
 * at 4 — oldest falls off automatically.
 */
export function saveHistoryEntry(entry) {
  try {
    const existing = loadHistory().filter((e) => e.id !== entry.id);
    const next = [{ ...entry, savedAt: new Date().toISOString() }, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadHistory();
  }
}

export function removeHistoryEntry(id) {
  try {
    const next = loadHistory().filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadHistory();
  }
}

export { newId };
