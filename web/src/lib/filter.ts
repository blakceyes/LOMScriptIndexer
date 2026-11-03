import { graph } from "../data/graph";
import { text } from "../data/text";
import { t } from "../i18n";
import { store } from "../state/store";
import type { QueryContext, QueryError } from "../types/cond";
import { query } from "./query";
import { wire } from "./wire";

export const RESULT_LIMIT = 50;

export const FIELD_LABEL_KEYS: Record<string, string> = {
  speaker: "fieldSpeaker", flag: "fieldFlag", check: "fieldCheck", stat: "fieldStat",
  rel: "fieldRel", option: "fieldOption", lock: "fieldLock", dice: "fieldDice",
  out: "fieldOut", in: "fieldIn", saycount: "fieldSay", id: "fieldId",
  chapter: "fieldChapter", text: "fieldText", kind: "fieldKind", via: "fieldVia",
};

export const EXAMPLES: { key: string; expr: string }[] = [
  { key: "exLock", expr: "lock >= 1" },
  { key: "exDice", expr: "dice >= 1" },
  { key: "exOptions", expr: "option >= 5" },
  { key: "exSpeaker", expr: "speaker:master" },
  { key: "exLeaf", expr: "out = 0" },
  { key: "exEntry", expr: "in = 0" },
  { key: "exSystem", expr: "kind:sys" },
  { key: "exVia", expr: "via:free" },
  { key: "exChapter", expr: "chapter:ch1" },
  { key: "exCombo", expr: "speaker:master AND (dice:yes OR lock:yes)" },
];

let textCache = { lang: "", count: -1, map: new Map<number, string>() };
let contextCache: QueryContext | null = null;

const nodeText = (index: number): string => {
  const lang = store.textLang();
  const pack = text.pack(lang);
  const count = pack && pack.stories ? Object.keys(pack.stories).length : 0;
  if (textCache.lang !== lang || textCache.count !== count) {
    textCache = { lang, count, map: new Map() };
    contextCache = null;
  }
  const hit = textCache.map.get(index);
  if (hit !== undefined) return hit;
  const node = graph.nodes[index];
  const rows = pack && pack.stories ? pack.stories[node.id] : null;
  const value = rows ? wire.textOf(rows).toLowerCase() : "";
  textCache.map.set(index, value);
  return value;
};

const buildContext = (): QueryContext => {
  if (contextCache) return contextCache;
  const names = text.names(store.textLang());
  contextCache = {
    count: graph.nodes.length,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      chapter: node.chapter,
      out: node.out,
      in: node.in,
      say: node.say,
      systemIn: node.systemIn,
      entry: node.entry,
    })),
    chapters: graph.chapters,
    facets: graph.nodes.map((node) => node.facets),
    edgeGroup: graph.hasEdgeGroup,
    names: {
      speaker: text.characters(store.textLang()),
      flag: names.flag || {},
      check: names.check || {},
      stat: names.stat || {},
      rel: names.rel || {},
    },
    textOf: nodeText,
  };
  return contextCache;
};

export const filterContext = (): QueryContext => buildContext();

export const resetFilterContext = (): void => {
  textCache = { lang: "", count: -1, map: new Map() };
  contextCache = null;
};

export const filterErrorText = (error: QueryError): string => t("filterSyntax", {
  column: error.column,
  message: query.messageOf(error),
});

export type ApplyResult = { ok: boolean; count: number | null };

export const applyFilter = (source: string): ApplyResult => {
  const value = source || "";
  if (!value.trim()) {
    store.applyFilter({ source: "", set: null, error: "", loading: false });
    return { ok: true, count: null };
  }
  const loading = query.needsText(value) && !text.progress().done;
  const result = query.compile(value, buildContext());
  if (!result.ok) {
    store.applyFilter({
      source: value,
      set: null,
      error: filterErrorText(result.error),
      loading: false,
    });
    return { ok: false, count: 0 };
  }
  store.applyFilter({ source: value, set: result.set, error: "", loading });
  if (loading) {
    text.ensureAll(store.textLang()).then(() => {
      resetFilterContext();
      if (store.state.filterSource !== value) return;
      const later = query.compile(value, buildContext());
      store.applyFilter({
        set: later.ok ? later.set : null,
        error: later.ok ? "" : filterErrorText(later.error),
        loading: false,
      });
    });
  }
  return { ok: true, count: result.set ? result.set.size : 0 };
};
