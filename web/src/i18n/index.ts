import { data } from "../data/schema";
import { prefs } from "../state/prefs";
import { state } from "../state/store";
import { dict, languageMeta } from "./dict";

const FALLBACK = "zh-tw";

const PLACEHOLDER = /\{(\w+)\}/g;

const CHAPTER_KEYS: Record<string, string> = {
  prologue: "chPrologue",
  chapter: "chN",
  act: "actN",
  event: "eventN",
  scene: "chScene",
  work: "chWork",
  travel: "chTravel",
  free: "chFree",
  section: "chSection",
  misc: "chMisc",
  other: "chOther",
};

export const LANGS = Object.keys(dict).length ? Object.keys(dict) : [FALLBACK];

const ORDER: string[] = (() => {
  const out: string[] = [];
  for (const id of Object.keys(languageMeta)) if (LANGS.indexOf(id) >= 0) out.push(id);
  for (const id of LANGS) if (out.indexOf(id) < 0) out.push(id);
  return out;
})();

const format = (text: string, vars: Record<string, unknown>): string => (
  text.replace(PLACEHOLDER, (whole, name: string) => (
    vars[name] === undefined ? whole : String(vars[name])
  ))
);

const rawOf = (lang: string, key: string): string | undefined => {
  const table = dict[lang] || {};
  if (table[key] !== undefined) return table[key];
  return (dict[FALLBACK] || {})[key];
};

export const t = (key: string, vars?: Record<string, unknown>): string => {
  const text = rawOf(state.lang, key);
  if (text !== undefined) return vars ? format(text, vars) : text;
  if (vars && vars.defaultValue !== undefined) return String(vars.defaultValue);
  return key;
};

export const has = (key: string): boolean => rawOf(state.lang, key) !== undefined;

export const all = (key: string): string[] => {
  const out: string[] = [];
  for (const id of LANGS) {
    const raw = dict[id] && dict[id][key];
    if (typeof raw !== "string") continue;
    for (const part of raw.split(",")) {
      const value = part.trim();
      if (value && out.indexOf(value) < 0) out.push(value);
    }
  }
  return out;
};

export const languages = (): { id: string; native: string; label: string; html: string }[] => (
  ORDER
    .filter((id) => dict[id] && Object.keys(dict[id]).length)
    .map((id) => ({
      id,
      native: languageMeta[id]?.native || id,
      label: languageMeta[id]?.label || id,
      html: languageMeta[id]?.html || id,
    }))
);

export const typeLabel = (typeId: string): string => {
  const hit = prefs.typeById(typeId);
  return hit ? t(hit.label) : String(typeId || "");
};

export const chapterTitle = (chapter: { kind?: string; number?: number | null } | null | undefined): string => {
  if (!chapter) return t("chOther");
  const key = CHAPTER_KEYS[chapter.kind || "other"] || "chOther";
  if (chapter.kind === "chapter" || chapter.kind === "act") return t(key, { n: chapter.number });
  if (chapter.kind === "event") {
    return t(key, { n: String(chapter.number === null || chapter.number === undefined ? 0 : chapter.number).padStart(2, "0") });
  }
  return t(key);
};

const calendar = data.calendar || {};

const dateOf = (rounds: number): { y: number; m: number; s: number } => {
  const perYear = calendar.roundsPerYear || 36;
  const perMonth = calendar.roundsPerMonth || 3;
  const index = Math.max(0, Math.floor(rounds) - 1);
  const year = Math.floor(index / perYear) + 1;
  const rest = index % perYear;
  return { y: year, m: Math.floor(rest / perMonth) + 1, s: (rest % perMonth) + 1 };
};

const stageNames = (): string[] => String(t("timeStages")).split(",");

export const timeText = (rounds: number): string => {
  const date = dateOf(rounds);
  return t("timeFull", { y: date.y, m: date.m, s: stageNames()[date.s - 1] || "" });
};
