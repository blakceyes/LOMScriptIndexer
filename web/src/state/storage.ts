import { ref } from "vue";

const BOOKMARK_KEY = "legend-of-mortal.explorer.bookmarks.v1";

export const get = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const set = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const getJson = <T>(key: string): T | null => {
  const raw = get(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const setJson = (key: string, value: unknown): boolean => {
  let payload = "";
  try {
    payload = JSON.stringify(value);
  } catch {
    return false;
  }
  return set(key, payload);
};

export const bookmarks = new Set<string>();
export const bookmarkTick = ref(0);

const loadBookmarks = () => {
  const saved = getJson<string[]>(BOOKMARK_KEY);
  if (!Array.isArray(saved)) return;
  for (const id of saved) if (typeof id === "string") bookmarks.add(id);
};

const saveBookmarks = () => setJson(BOOKMARK_KEY, Array.from(bookmarks));

loadBookmarks();

export const toggleBookmark = (id: string): boolean => {
  if (!id) return false;
  if (bookmarks.has(id)) bookmarks.delete(id);
  else bookmarks.add(id);
  saveBookmarks();
  bookmarkTick.value++;
  return bookmarks.has(id);
};

export const clearBookmarks = (): void => {
  bookmarks.clear();
  saveBookmarks();
  bookmarkTick.value++;
};

const positions = new Map<string, number>();

export const rememberPosition = (id: string, fraction: number): void => {
  if (!id || typeof fraction !== "number" || !Number.isFinite(fraction)) return;
  positions.set(id, Math.max(0, Math.min(1, fraction)));
};

export const positionOf = (id: string): number => positions.get(id) ?? 0;
