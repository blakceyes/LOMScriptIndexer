import { graph } from "../data/graph";
import { data } from "../data/schema";
import { text } from "../data/text";
import { store } from "../state/store";
import { metaText } from "./cond";
import { normalizeQuery } from "./dom";
import { wire } from "./wire";

export type SearchHit = {
  id: string;
  index: number;
  chapter: { id: string; kind: string; number: number | null; color: string; count: number } | null;
  snippet: string;
};

export type SearchResult = {
  hits: SearchHit[];
  total: number;
  outside: number;
};

type IndexEntry = {
  id: string;
  order: number;
  chapter: SearchHit["chapter"];
  text: string;
};

type SearchIndex = {
  lang: string;
  seen: Set<string>;
  entries: IndexEntry[];
  sorted: boolean;
};

const empty = (): SearchIndex => ({ lang: "", seen: new Set(), entries: [], sorted: true });

let index: SearchIndex = empty();

const itemKinds = new Set(data.vocab.itemKinds || []);

const itemText = (rows: unknown): string => {
  const parts: string[] = [];
  wire.walk(rows, (row) => {
    if (!wire.isBeat(row, "meta")) return;
    const meta = wire.meta(row);
    if (!itemKinds.has(meta.kind)) return;
    const label = metaText(meta.kind, meta.key, meta.value);
    if (label) parts.push(label);
  });
  return parts.join("\n");
};

const buildIndex = (): SearchIndex => {
  const lang = store.textLang();
  if (index.lang !== lang) index = empty();
  index.lang = lang;
  const pack = text.pack(lang);
  const scripts = (pack && pack.scripts) || {};
  const ids = Object.keys(scripts);
  let added = false;
  for (const id of ids) {
    if (index.seen.has(id)) continue;
    index.seen.add(id);
    added = true;
    const nodeIndex = graph.indexById.get(id);
    const node = nodeIndex === undefined ? null : graph.nodes[nodeIndex];
    index.entries.push({
      id,
      order: nodeIndex === undefined ? -1 : nodeIndex,
      chapter: node ? graph.chapterOf(node) : null,
      text: `${wire.textOf(scripts[id])}\n${itemText(scripts[id])}`.toLowerCase(),
    });
  }
  if (added) index.sorted = false;
  if (!index.sorted) {
    index.entries.sort((a, b) => a.order - b.order);
    index.sorted = true;
  }
  return index;
};

const invalidate = (): void => {
  index = empty();
};

const search = (input: string): SearchResult => {
  const lower = normalizeQuery(input);
  const result: SearchResult = { hits: [], total: 0, outside: 0 };
  if (lower.length < 2) return result;
  const data = buildIndex();
  let outside = 0;
  for (const entry of data.entries) {
    const position = entry.text.indexOf(lower);
    if (position < 0) continue;
    if (entry.order < 0) continue;
    if (!graph.passes(entry.order, store.state.filterSet)) {
      outside++;
      continue;
    }
    result.hits.push({
      id: entry.id,
      index: entry.order,
      chapter: entry.chapter,
      snippet: entry.text.slice(Math.max(0, position - 16), position + 46),
    });
  }
  result.total = result.hits.length + outside;
  result.outside = outside;
  return result;
};

export const searchIndex = { invalidate, search };
