import { ref } from "vue";

const NAMESPACE = "legend-of-mortal.scriptindexer";

export const keys = {
  lang: `${NAMESPACE}.lang.v1`,
  prefs: `${NAMESPACE}.prefs.v4`,
  bookmarks: `${NAMESPACE}.bookmarks.v1`,
  infer: `${NAMESPACE}.infer.v1`,
};

export const readRaw = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeRaw = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const readJson = <T,>(key: string): T | null => {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const writeJson = (key: string, value: unknown): boolean => {
  let payload = "";
  try {
    payload = JSON.stringify(value);
  } catch {
    return false;
  }
  return writeRaw(key, payload);
};

export const bookmarks = new Set<string>();
export const bookmarkTick = ref(0);

const loadBookmarks = () => {
  const saved = readJson<string[]>(keys.bookmarks);
  if (!Array.isArray(saved)) return;
  for (const id of saved) if (typeof id === "string") bookmarks.add(id);
};

const saveBookmarks = () => writeJson(keys.bookmarks, Array.from(bookmarks));

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
