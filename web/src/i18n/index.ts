import { dataset } from "../data/dataset";
import { slotById } from "../lib/fontTypes";
import { scriptStore as script } from "../lib/scriptStore";
import { fillTemplate } from "../lib/template";
import { dict, languageMeta } from "./dict";

const FALLBACK = "zh-tw";

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

const rawOf = (lang: string, key: string): string | undefined => {
  const table = dict[lang] || {};
  if (table[key] !== undefined) return table[key];
  return (dict[FALLBACK] || {})[key];
};

export const t = (key: string, vars?: Record<string, unknown>): string => {
  const text = rawOf(script().lang, key);
  if (text !== undefined) return vars ? fillTemplate(text, vars) : text;
  if (vars && vars.defaultValue !== undefined) return String(vars.defaultValue);
  return key;
};

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

export const languages = (): { id: string; native: string; label: string; html: string }[] =>
  ORDER.filter((id) => dict[id] && Object.keys(dict[id]).length).map((id) => ({
    id,
    native: languageMeta[id]?.native || id,
    label: languageMeta[id]?.label || id,
    html: languageMeta[id]?.html || id,
  }));

export const langShort = (id: string): string =>
  languageMeta[id]?.short || languageMeta[id]?.native || String(id || "");

export const typeLabel = (slotId: string): string => {
  const slot = slotById(slotId);
  return slot ? t(slot.label) : String(slotId || "");
};

export const chapterTitle = (
  chapter: { kind?: string; number?: number | null } | null | undefined,
): string => {
  if (!chapter) return t("chOther");
  const key = CHAPTER_KEYS[chapter.kind || "other"] || "chOther";
  if (chapter.kind === "chapter" || chapter.kind === "act") {
    return t(key, { n: chapter.number });
  }
  if (chapter.kind === "event") {
    const number = chapter.number === null || chapter.number === undefined ? 0 : chapter.number;
    return t(key, { n: String(number).padStart(2, "0") });
  }
  return t(key);
};

const calendar = dataset.calendar || {};

const dateOf = (rounds: number): { year: number; month: number; period: number } => {
  const perYear = calendar.roundsPerYear || 36;
  const perMonth = calendar.roundsPerMonth || 3;
  const index = Math.max(0, Math.floor(rounds) - 1);
  const year = Math.floor(index / perYear) + 1;
  const rest = index % perYear;
  return {
    year,
    month: Math.floor(rest / perMonth) + 1,
    period: (rest % perMonth) + 1,
  };
};

const stageNames = (): string[] => String(t("timeStages")).split(",");

export const timeText = (rounds: number): string => {
  const date = dateOf(rounds);
  return t("timeFull", {
    y: date.year,
    m: date.month,
    s: stageNames()[date.period - 1] || "",
  });
};
