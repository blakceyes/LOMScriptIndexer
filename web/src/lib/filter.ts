import { graph } from "../data/graph";
import { textStore } from "../data/text";
import { t } from "../i18n";
import { pinia } from "../stores";
import { useScriptStore } from "../stores/script";

import type { QueryContext, QueryError } from "../types/query";
import * as beatRows from "./beatRows";
import { createIndex, query, type QueryIndex } from "./query";

let scriptHandle: ReturnType<typeof useScriptStore> | null = null;
const script = (): ReturnType<typeof useScriptStore> => (scriptHandle ??= useScriptStore(pinia));

export const RESULT_LIMIT = 50;

export const FIELD_LABEL_KEYS: Record<string, string> = {
  speaker: "fieldSpeaker",
  flag: "fieldFlag",
  check: "fieldCheck",
  stat: "fieldStat",
  rel: "fieldRel",
  option: "fieldOption",
  lock: "fieldLock",
  dice: "fieldDice",
  out: "fieldOut",
  in: "fieldIn",
  saycount: "fieldSay",
  id: "fieldId",
  chapter: "fieldChapter",
  text: "fieldText",
  kind: "fieldKind",
};

export const EXAMPLES: { key: string; expr: string }[] = [
  { key: "exLock", expr: "lock >= 1" },
  { key: "exDice", expr: "dice >= 1" },
  { key: "exOptions", expr: "option >= 5" },
  { key: "exSpeaker", expr: "speaker:master" },
  { key: "exLeaf", expr: "out = 0" },
  { key: "exEntry", expr: "in = 0" },
  { key: "exChapter", expr: "chapter:ch1" },
  { key: "exCombo", expr: "speaker:master AND (dice:yes OR lock:yes)" },
];

let nodeTextCache = { lang: "", count: -1, map: new Map<number, string>() };
let compileCache: QueryIndex | null = null;

const nodeText = (index: number): string => {
  const lang = script().textLang();
  const pack = textStore.pack(lang);
  const count = pack && pack.scripts ? Object.keys(pack.scripts).length : 0;
  if (nodeTextCache.lang !== lang || nodeTextCache.count !== count) {
    nodeTextCache = { lang, count, map: new Map() };
    compileCache = null;
  }
  const cached = nodeTextCache.map.get(index);
  if (cached !== undefined) return cached;
  const node = graph.nodes[index];
  const rows = pack && pack.scripts ? pack.scripts[node.id] : null;
  const value = rows ? beatRows.plainTextOf(rows).toLowerCase() : "";
  nodeTextCache.map.set(index, value);
  return value;
};

const buildIndex = (): QueryIndex => {
  if (compileCache) return compileCache;
  const lang = script().textLang();
  const names = textStore.names(lang);
  const context: QueryContext = {
    nodeCount: graph.nodes.length,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      chapterIndex: node.chapterIndex,
      outDegree: node.outDegree,
      inDegree: node.inDegree,
      sayCount: node.sayCount,
    })),
    chapters: graph.chapters,
    facets: graph.nodes.map((node) => node.facets),
    edgeGroup: graph.hasEdgeGroup,
    names: {
      speakers: textStore.characters(lang),
      flags: names.flag || {},
      checks: names.check || {},
      stats: names.stat || {},
      relations: names.rel || {},
    },
    textAt: nodeText,
  };
  compileCache = createIndex(context);
  return compileCache;
};

export const queryIndex = (): QueryIndex => buildIndex();

export const resetFilterContext = (): void => {
  nodeTextCache = { lang: "", count: -1, map: new Map() };
  compileCache = null;
};

export const filterErrorText = (error: QueryError): string =>
  t("filterSyntax", {
    column: error.column,
    message: query.errorTextOf(error),
  });

export type ApplyResult = { ok: boolean; matchCount: number | null };

export const applyFilter = (source: string): ApplyResult => {
  const value = source || "";
  if (!value.trim()) {
    script().applyFilterPatch({ source: "", set: null, error: "", loading: false });
    return { ok: true, matchCount: null };
  }
  const loading = query.needsText(value) && !textStore.progress().done;
  const result = query.compile(value, buildIndex());
  if (!result.ok) {
    script().applyFilterPatch({
      source: value,
      set: null,
      error: filterErrorText(result.error),
      loading: false,
    });
    return { ok: false, matchCount: 0 };
  }
  script().applyFilterPatch({ source: value, set: result.set, error: "", loading });
  if (loading) {
    textStore.ensureAll(script().textLang()).then(() => {
      resetFilterContext();
      if (script().filterSource !== value) return;
      const later = query.compile(value, buildIndex());
      script().applyFilterPatch({
        set: later.ok ? later.set : null,
        error: later.ok ? "" : filterErrorText(later.error),
        loading: false,
      });
    });
  }
  return { ok: true, matchCount: result.set ? result.set.size : 0 };
};
