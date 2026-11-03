import { dict, languageMeta } from "../i18n/dict";
import { get, set } from "./storage";

const KEY = "legend-of-mortal.explorer.lang.v1";
const DEFAULT = "zh-tw";

const LANGS: string[] = (() => {
  const out: string[] = [];
  for (const id of Object.keys(languageMeta)) if (out.indexOf(id) < 0) out.push(id);
  for (const id of Object.keys(dict)) if (out.indexOf(id) < 0) out.push(id);
  return out;
})();

const has = (id: unknown): id is string => typeof id === "string" && LANGS.indexOf(id) >= 0;

const match = (raw: unknown): string => {
  const tag = String(raw ?? "").toLowerCase();
  if (!tag) return "";
  if (tag.indexOf("en") === 0) return "en";
  if (tag.indexOf("zh") !== 0) return "";
  return /hans|-cn|-sg|-my/.test(tag) ? "zh-cn" : "zh-tw";
};

const read = (): string => get(KEY) || "";

const pinned = (): string => {
  const id = read();
  return has(id) ? id : "";
};

const detect = (): string => {
  const tags = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ""];
  for (const raw of tags) {
    const id = match(raw);
    if (has(id)) return id;
  }
  return has(DEFAULT) ? DEFAULT : (LANGS[0] || DEFAULT);
};

const initial = (): string => pinned() || detect();

const pin = (id: string): boolean => {
  if (!has(id)) return false;
  return set(KEY, id);
};

const htmlOf = (id: string): string => languageMeta[id]?.html || String(id || DEFAULT);

const titleOf = (id: string): string => dict[id]?.appTitle || "";

const applyDocument = (id?: string): string => {
  const value = id && has(id) ? id : initial();
  document.documentElement.lang = htmlOf(value);
  const title = titleOf(value);
  if (title) document.title = title;
  return value;
};

export const lang = {
  has,
  htmlOf,
  initial,
  pin,
  applyDocument,
  languages: LANGS.slice(),
};
