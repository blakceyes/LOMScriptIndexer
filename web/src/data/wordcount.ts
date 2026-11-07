import { loadScript } from "../lib/browser";
import { pinia } from "../stores";
import { useScriptStore } from "../stores/script";

import type { WordCount, WordCountPack, WordPack, WordRow } from "../types/text";
import { EN_INDEX, ZH_INDEX } from "../types/text";
import { dataset } from "./dataset";

let scriptHandle: ReturnType<typeof useScriptStore> | null = null;
const script = (): ReturnType<typeof useScriptStore> => (scriptHandle ??= useScriptStore(pinia));

const FALLBACK_KINDS = ["dialog", "narration", "think", "option", "lore"];

let pending: Promise<WordCountPack | null> | null = null;

const kinds = (): string[] => {
  const pack = dataset.getWordCount();
  return pack.kinds && pack.kinds.length ? pack.kinds : FALLBACK_KINDS;
};

const loadWordCount = (): Promise<WordCountPack | null> => {
  const current = dataset.getWordCount();
  if (current && Object.keys(current).length) return Promise.resolve(current);
  if (pending) return pending;
  pending = loadScript(dataset.assetUrl("wordcount"))
    .then(() => dataset.getWordCount())
    .catch(() => null);
  return pending;
};

const wordPack = (): WordPack | null => {
  const all: WordCountPack = dataset.getWordCount();
  if (!all || !all.langs) return null;
  return all.langs[script().textLang()] || all.langs[Object.keys(all.langs)[0]] || null;
};

const countsOf = (row: WordRow | undefined, kind: string): WordCount => {
  const total: WordCount = [0, 0];
  if (!row) return total;
  const labels = kinds();
  for (let index = 0; index < labels.length; index++) {
    if (kind !== "all" && labels[index] !== kind) continue;
    const counts = row[index];
    if (!counts) continue;
    total[ZH_INDEX] += counts[ZH_INDEX] || 0;
    total[EN_INDEX] += counts[EN_INDEX] || 0;
  }
  return total;
};

export const wordCount = {
  countsOf,
  kinds,
  load: loadWordCount,
  pack: wordPack,
};
