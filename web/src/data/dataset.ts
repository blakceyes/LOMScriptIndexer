import { fillTemplate } from "../lib/template";
import type {
  Assets,
  Chapter,
  Dataset,
  Facets,
  GameInfo,
  GraphEdge,
  GraphMeta,
  GraphNode,
  RawGraph,
  ScriptFlags,
  Shard,
  VarReads,
  Vocab,
} from "../types/graph";
import {
  readCheckpointModels,
  readRawGraph,
  readTextPacks,
  readVarReads,
  readWordCountPack,
} from "./globals";
import { DATA_SCHEMA } from "./schema";

const DEFAULT_CHAPTER_COLOR = "#8A8578";

export const EMPTY_CHAPTER: Chapter = {
  id: "",
  kind: "other",
  number: null,
  color: DEFAULT_CHAPTER_COLOR,
  scriptCount: 0,
};

const EMPTY_FACETS: Facets = {
  speakers: [],
  flags: [],
  checks: [],
  stats: [],
  relations: [],
  endings: [],
  optionCount: 0,
  lockCount: 0,
  diceCheckCount: 0,
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value ? value : fallback;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const normalizeFacets = (value: unknown): Facets => {
  if (!value || typeof value !== "object") return { ...EMPTY_FACETS };
  const raw = value as Record<string, unknown>;
  return {
    speakers: asArray<string>(raw.speakers),
    flags: asArray<string>(raw.flags),
    checks: asArray<string>(raw.checks),
    stats: asArray<string>(raw.stats),
    relations: asArray<string>(raw.relations),
    endings: asArray<string>(raw.endings),
    optionCount: asNumber(raw.optionCount, 0),
    lockCount: asNumber(raw.lockCount, 0),
    diceCheckCount: asNumber(raw.diceCheckCount, 0),
  };
};

const normalizeFlags = (value: unknown): ScriptFlags => {
  const raw = asRecord(value);
  return {
    isEmpty: raw.isEmpty === true,
    isSimplifiedOnly: raw.isSimplifiedOnly === true,
    hasNoOutgoing: raw.hasNoOutgoing === true,
    hasNoIncoming: raw.hasNoIncoming === true,
  };
};

const normalizeReads = (value: unknown): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const [key, list] of Object.entries(asRecord(value))) {
    if (!key) continue;
    const keys = asArray<string>(list).filter((item) => typeof item === "string" && item);
    if (keys.length) out[key] = keys;
  }
  return out;
};

const normalizeVarReads = (value: Record<string, unknown>): VarReads => ({
  flag: normalizeReads(value.flag),
  stat: normalizeReads(value.stat),
  rel: normalizeReads(value.rel),
});

const normalizeChapter = (chapter: Record<string, unknown>): Chapter => ({
  id: String(chapter.id ?? ""),
  kind: asString(chapter.kind, "other"),
  number: typeof chapter.number === "number" ? chapter.number : null,
  color: asString(chapter.color, DEFAULT_CHAPTER_COLOR),
  scriptCount: asNumber(chapter.scriptCount, 0),
});

const normalizeEdge = (edge: Record<string, unknown>): GraphEdge => ({
  index: asNumber(edge.index, 0),
  source: String(edge.source ?? ""),
  target: String(edge.target ?? ""),
  kind: asString(edge.kind, "jump"),
  label: asString(edge.label),
});

const normalizeNode = (node: Record<string, unknown>): GraphNode => ({
  id: String(node.id ?? ""),
  chapterIndex: asNumber(node.chapterIndex, 0),
  outDegree: asNumber(node.outDegree, 0),
  inDegree: asNumber(node.inDegree, 0),
  sayCount: asNumber(node.sayCount, 0),
  flags: normalizeFlags(node.flags),
  facets: normalizeFacets(node.facets),
  time: typeof node.time === "number" ? node.time : null,
});

const buildMeta = (raw: RawGraph): GraphMeta => {
  const source = asRecord(raw.meta);
  const langs = asArray<string>(source.langs);
  return {
    generated: asString(source.generated),
    game: asRecord(source.game) as GameInfo,
    langs,
    defaultLang: asString(source.defaultLang),
    sourceLang: asString(source.sourceLang, langs[0] || ""),
    vocab: asRecord(source.vocab) as Vocab,
    assets: asRecord(source.assets) as Assets,
    calendar: asRecord(source.calendar) as GraphMeta["calendar"],
    counts: asRecord(source.counts) as Record<string, number>,
    shards: asArray<Shard>(source.shards),
    systemEntries: asArray<unknown>(source.systemEntries),
    shardByNode: asRecord(source.shardByNode) as Record<string, string>,
    checkpointShardByKey: asRecord(source.checkpointShardByKey) as Record<string, number>,
  };
};

const build = (): Dataset => {
  const graph = readRawGraph();
  if (!graph || typeof graph !== "object") {
    throw new Error("window.SR_DATA is missing; run build.py and load data/graph.js");
  }
  if (graph.schema !== DATA_SCHEMA) {
    throw new Error(
      `unsupported data schema ${graph.schema}; expected ${DATA_SCHEMA},` +
        " rebuild the data and hard refresh to clear cached data",
    );
  }
  const meta = buildMeta(graph);
  return {
    meta,
    vocab: meta.vocab,
    assets: meta.assets,
    calendar: meta.calendar,
    nodes: asArray<Record<string, unknown>>(graph.nodes).map(normalizeNode),
    edges: asArray<Record<string, unknown>>(graph.edges).map(normalizeEdge),
    chapters: asArray<Record<string, unknown>>(graph.chapters).map(normalizeChapter),
    varReads: normalizeVarReads(readVarReads()),
    langs: meta.langs,
    systemEntries: meta.systemEntries,
    shardByNode: meta.shardByNode,
    checkpointShardByKey: meta.checkpointShardByKey,
    assetUrl: (key, vars) => {
      const url = fillTemplate(meta.assets[key] || "", vars);
      return meta.generated ? `${url}?v=${encodeURIComponent(meta.generated)}` : url;
    },
    getTextPack: readTextPacks,
    getCheckpoints: readCheckpointModels,
    getWordCount: readWordCountPack,
  };
};

export const dataset: Dataset = build();
