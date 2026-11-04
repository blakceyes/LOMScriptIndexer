import { ref } from "vue";

const NAMESPACE = "legend-of-mortal.scriptindexer";
const LEGACY_NAMESPACE = "legend-of-mortal.explorer";
const SUFFIX = { lang: "lang.v1", prefs: "prefs.v3", bookmarks: "bookmarks.v1" } as const;

export const keyOf = (suffix: string): string => `${NAMESPACE}.${suffix}`;

export const keys = {
  lang: keyOf(SUFFIX.lang),
  prefs: keyOf(SUFFIX.prefs),
  bookmarks: keyOf(SUFFIX.bookmarks),
};

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

export const getJson = <T,>(key: string): T | null => {
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

const migrate = (): void => {
  for (const suffix of Object.values(SUFFIX)) {
    const key = keyOf(suffix);
    if (get(key) !== null) continue;
    const legacy = get(`${LEGACY_NAMESPACE}.${suffix}`);
    if (legacy !== null) set(key, legacy);
  }
};

migrate();

export const bookmarks = new Set<string>();
export const bookmarkTick = ref(0);

const loadBookmarks = () => {
  const saved = getJson<string[]>(keys.bookmarks);
  if (!Array.isArray(saved)) return;
  for (const id of saved) if (typeof id === "string") bookmarks.add(id);
};

const saveBookmarks = () => setJson(keys.bookmarks, Array.from(bookmarks));

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
