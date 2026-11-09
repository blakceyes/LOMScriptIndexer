import { graph } from "../data/graph";
import { wordCount } from "../data/wordcount";
import { chapterTitle } from "../i18n";
import type { WordCount, WordPack } from "../types/text";
import { EN_INDEX, ZH_INDEX } from "../types/text";

const zero = (): WordCount => [0, 0];

const addInto = (total: WordCount, counts: WordCount): void => {
  total[ZH_INDEX] += counts[ZH_INDEX];
  total[EN_INDEX] += counts[EN_INDEX];
};

const sum = (counts: WordCount): number => counts[ZH_INDEX] + counts[EN_INDEX];

export type StatsTableRow =
  | {
      type: "chapter";
      id: string;
      title: string;
      ordinal: string;
      color: string;
      isOpen: boolean;
      scriptCount: number;
      counts: WordCount;
    }
  | { type: "script"; id: string; counts: WordCount };

export const statsTableRows = (
  pack: WordPack | null,
  kind: string,
  openChapter: string,
): StatsTableRow[] => {
  if (!pack) return [];
  const byChapter = graph.nodesByChapter();
  const out: StatsTableRow[] = [];
  graph.chapters.forEach((chapter, index) => {
    const ids = (byChapter[index] || []).map((node) => node.id);
    out.push({
      type: "chapter",
      id: chapter.id,
      title: chapterTitle(chapter),
      ordinal: String(index + 1).padStart(2, "0"),
      color: chapter.color,
      isOpen: openChapter === chapter.id,
      scriptCount: ids.length,
      counts: wordCount.countsOf((pack.chapters || {})[chapter.id], kind),
    });
    if (openChapter !== chapter.id) return;
    ids
      .map((id) => ({ id, counts: wordCount.countsOf((pack.scripts || {})[id], kind) }))
      .filter((item) => sum(item.counts) > 0)
      .sort((a, b) => sum(b.counts) - sum(a.counts))
      .forEach((item) => out.push({ type: "script", id: item.id, counts: item.counts }));
  });
  return out;
};

export const statsFilteredTotal = (pack: WordPack | null, kind: string): WordCount => {
  const total = zero();
  if (!pack) return total;
  for (const chapter of graph.chapters) {
    addInto(total, wordCount.countsOf((pack.chapters || {})[chapter.id], kind));
  }
  return total;
};
