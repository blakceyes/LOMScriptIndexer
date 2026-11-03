import { format } from "../lib/format";
import type {
  Assets, Chapter, DataLayer, Facets, GameInfo, GraphEdge, GraphMeta, GraphNode, RawGraph,
  Shard, Vocab,
} from "../types/graph";
import { checkpointModels, rawGraph, textPacks, wordCountPack } from "./wire";

const SCHEMA = 16;

export const DEFAULT_CHAPTER_COLOR = "#8A8578";

export const EMPTY_CHAPTER: Chapter = {
  id: "",
  kind: "other",
  number: null,
  color: DEFAULT_CHAPTER_COLOR,
  count: 0,
};

const EMPTY_FACETS: Facets = {
  speakers: [], flags: [], checks: [], stats: [], rels: [],
  options: 0, locks: 0, dice: 0,
};

const arrays = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

const num = (value: unknown, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value) ? value : fallback
);

const text = (value: unknown, fallback = ""): string => (
  typeof value === "string" && value ? value : fallback
);

const record = (value: unknown): Record<string, unknown> => (
  value && typeof value === "object" ? value as Record<string, unknown> : {}
);

const normalizeFacets = (value: unknown): Facets => {
  if (!value || typeof value !== "object") return { ...EMPTY_FACETS };
  const raw = value as Record<string, unknown>;
  return {
    speakers: arrays<string>(raw.speakers),
    flags: arrays<string>(raw.flags),
    checks: arrays<string>(raw.checks),
    stats: arrays<string>(raw.stats),
    rels: arrays<string>(raw.rels),
    options: num(raw.options, 0),
    locks: num(raw.locks, 0),
    dice: num(raw.dice, 0),
  };
};

const normalizeChapter = (chapter: Record<string, unknown>): Chapter => ({
  id: String(chapter.id ?? ""),
  kind: text(chapter.kind, "other"),
  number: typeof chapter.number === "number" ? chapter.number : null,
  color: text(chapter.color, DEFAULT_CHAPTER_COLOR),
  count: num(chapter.count, 0),
});

const normalizeEdge = (edge: Record<string, unknown>): GraphEdge => ({
  id: num(edge.id, 0),
  from: String(edge.from ?? ""),
  to: String(edge.to ?? ""),
  kind: text(edge.kind, "jump"),
  label: text(edge.label),
  data: edge.data && typeof edge.data === "object"
    ? edge.data as Record<string, unknown> : null,
});

const normalizeNode = (node: Record<string, unknown>): GraphNode => ({
  id: String(node.id ?? ""),
  chapter: num(node.chapter, 0),
  out: num(node.out, 0),
  in: num(node.in, 0),
  say: num(node.say, 0),
  systemIn: num(node.systemIn, 0),
  flags: node.flags && typeof node.flags === "object"
    ? node.flags as GraphNode["flags"] : {},
  facets: normalizeFacets(node.facets),
  entry: text(node.entry),
  time: typeof node.time === "number" ? node.time : null,
});

const buildMeta = (raw: RawGraph): GraphMeta => {
  const source = record(raw.meta);
  const langs = arrays<string>(source.langs);
  return {
    generated: text(source.generated),
    game: record(source.game) as GameInfo,
    langs,
    defaultLang: text(source.defaultLang),
    textSource: text(source.textSource, langs[0] || ""),
    vocab: record(source.vocab) as Vocab,
    assets: record(source.assets) as Assets,
    calendar: record(source.calendar) as GraphMeta["calendar"],
    counts: record(source.counts) as Record<string, number>,
    shards: arrays<Shard>(source.shards),
    entries: arrays<unknown>(source.entries),
    shardOf: record(source.shardOf) as Record<string, string>,
    checkpointShards: record(source.checkpointShards) as Record<string, number>,
  };
};

const build = (): DataLayer => {
  const graph = rawGraph();
  if (!graph || typeof graph !== "object") {
    throw new Error("window.SR_DATA is missing; run build.py and load data/graph.js");
  }
  if (graph.schema !== SCHEMA) {
    throw new Error(`unsupported data schema ${graph.schema}; expected ${SCHEMA}, rebuild the data`);
  }
  const meta = buildMeta(graph);
  return {
    meta,
    vocab: meta.vocab,
    assets: meta.assets,
    calendar: meta.calendar,
    nodes: arrays<Record<string, unknown>>(graph.nodes).map(normalizeNode),
    edges: arrays<Record<string, unknown>>(graph.edges).map(normalizeEdge),
    chapters: arrays<Record<string, unknown>>(graph.chapters).map(normalizeChapter),
    langs: meta.langs,
    entries: meta.entries,
    shardOf: meta.shardOf,
    checkpointShards: meta.checkpointShards,
    asset: (key, vars) => format(meta.assets[key] || "", vars),
    textPack: textPacks,
    checkpoints: checkpointModels,
    wordcount: wordCountPack,
  };
};

export const data: DataLayer = build();
