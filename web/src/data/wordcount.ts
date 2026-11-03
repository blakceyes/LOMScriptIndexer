import { loadScript } from "../lib/dom";
import { store } from "../state/store";
import type { WordCountPack, WordPack, WordPair, WordRow } from "../types/text";
import { data } from "./schema";

const FALLBACK_KINDS = ["dialog", "narration", "think", "option", "lore"];

let pending: Promise<unknown> | null = null;

const kinds = (): string[] => {
  const pack = data.wordcount();
  return pack.kinds && pack.kinds.length ? pack.kinds : FALLBACK_KINDS;
};

const ensure = (): Promise<unknown> => {
  const current = data.wordcount();
  if (current && Object.keys(current).length) return Promise.resolve(current);
  if (pending) return pending;
  pending = loadScript(data.asset("wordcount"))
    .then(() => data.wordcount())
    .catch(() => null);
  return pending;
};

const pack = (): WordPack | null => {
  const all: WordCountPack = data.wordcount();
  if (!all || !all.langs) return null;
  return all.langs[store.textLang()] || all.langs[Object.keys(all.langs)[0]] || null;
};

const counts = (row: WordRow | undefined, kind: string): WordPair => {
  const total: WordPair = [0, 0];
  if (!row) return total;
  const labels = kinds();
  for (let index = 0; index < labels.length; index++) {
    if (kind !== "all" && labels[index] !== kind) continue;
    const pair = row[index];
    if (!pair) continue;
    total[0] += pair[0] || 0;
    total[1] += pair[1] || 0;
  }
  return total;
};

export const wordcount = { ensure, kinds, pack, counts };
