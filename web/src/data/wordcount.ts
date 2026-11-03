import { loadScript } from "../lib/dom";
import { store } from "../state/store";
import { data } from "./schema";

export type WordPair = [number, number];

export type WordPack = {
  stories: Record<string, (WordPair | null)[]>;
  chapters: Record<string, (WordPair | null)[]>;
};

type WordCount = {
  langs?: Record<string, WordPack>;
};

export const KINDS = ["dialog", "narration", "think", "option", "lore"];

let pending: Promise<unknown> | null = null;

const ensure = (): Promise<unknown> => {
  const current = data.wordcount() as WordCount;
  if (current && Object.keys(current).length) return Promise.resolve(current);
  if (pending) return pending;
  pending = loadScript(data.asset("wordcount"))
    .then(() => data.wordcount())
    .catch(() => null);
  return pending;
};

const pack = (): WordPack | null => {
  const all = data.wordcount() as WordCount;
  if (!all || !all.langs) return null;
  return all.langs[store.textLang()] || all.langs[Object.keys(all.langs)[0]] || null;
};

const counts = (row: (WordPair | null)[] | undefined, kind: string): WordPair => {
  const total: WordPair = [0, 0];
  if (!row) return total;
  for (let index = 0; index < KINDS.length; index++) {
    if (kind !== "all" && KINDS[index] !== kind) continue;
    const pair = row[index];
    if (!pair) continue;
    total[0] += pair[0] || 0;
    total[1] += pair[1] || 0;
  }
  return total;
};

export const wordcount = { ensure, pack, counts };
