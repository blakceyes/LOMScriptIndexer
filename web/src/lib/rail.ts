import { graph } from "../data/graph";
import { specialScriptName, specialScripts } from "../data/special";
import { chapterTitle } from "../i18n";
import type { Chapter, GraphNode } from "../types/graph";
import { toNeedle } from "./browser";

export const SEARCH_MEMBER_LIMIT = 200;

export type ChapterRow = {
  index: number;
  chapter: Chapter;
  title: string;
  ordinal: string;
  members: GraphNode[];
  total: number;
  hidden: number;
  open: boolean;
};

export type BookmarkRow = {
  id: string;
  chapter: string;
  index: number;
  known: boolean;
};

export type SpecialRow = {
  id: string;
  name: string;
  known: boolean;
};

export const nodeIndexOf = (id: string): number => graph.indexById.get(id) ?? -1;

const containsNeedle = (value: string, needle: string): boolean =>
  value.toLowerCase().indexOf(needle) >= 0;

export const outlineRows = (query: string, openChapter: number): ChapterRow[] => {
  const needle = toNeedle(query);
  const byChapter = graph.nodesByChapter();
  const rows: ChapterRow[] = [];
  graph.chapters.forEach((chapter, index) => {
    const title = chapterTitle(chapter);
    let members = byChapter[index] || [];
    if (needle) {
      const hit = containsNeedle(title, needle) || containsNeedle(chapter.id, needle);
      if (!hit) members = members.filter((node) => containsNeedle(node.id, needle));
      if (!members.length) return;
    }
    const total = members.length;
    const shown = needle ? members.slice(0, SEARCH_MEMBER_LIMIT) : members;
    rows.push({
      index,
      chapter,
      title,
      ordinal: String(index + 1).padStart(2, "0"),
      members: shown,
      total,
      hidden: total - shown.length,
      open: needle ? true : openChapter === index,
    });
  });
  return rows;
};

export const bookmarkRows = (query: string, ids: string[]): BookmarkRow[] => {
  const needle = toNeedle(query);
  const rows: BookmarkRow[] = [];
  for (const id of ids) {
    const node = graph.nodeById.get(id);
    const chapter = node ? chapterTitle(graph.chapterOf(node)) : "";
    if (needle && !containsNeedle(id, needle) && !containsNeedle(chapter, needle)) continue;
    rows.push({ id, chapter, index: nodeIndexOf(id), known: !!node });
  }
  return rows;
};

export const specialRows = (query: string, lang: string): SpecialRow[] => {
  const needle = toNeedle(query);
  return specialScripts
    .map((entry) => ({
      id: entry.id,
      name: specialScriptName(entry, lang),
      known: graph.nodeById.has(entry.id),
    }))
    .filter((row) => !needle || containsNeedle(row.name, needle) || containsNeedle(row.id, needle));
};

export const chapterMatchCount = (rows: ChapterRow[]): number =>
  rows.reduce((sum, row) => sum + row.total, 0);
