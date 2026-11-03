import type {
  Assets, Chapter, DataLayer, Facets, GraphEdge, GraphMeta, GraphNode, RawGraph, Vocab,
} from "../types/graph";
import {
  checkpointsOf, fillAsset, rawGraph, textPackOf, wordcountOf,
} from "./globals";

const SCHEMA = 16;

const EMPTY_FACETS: Facets = {
  speakers: [], flags: [], checks: [], stats: [], rels: [],
  options: 0, locks: 0, dice: 0,
};

const arrays = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

const num = (value: unknown, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value) ? value : fallback
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
  kind: typeof chapter.kind === "string" && chapter.kind ? chapter.kind : "other",
  number: typeof chapter.number === "number" ? chapter.number : null,
  color: typeof chapter.color === "string" && chapter.color ? chapter.color : "#8A8578",
  count: num(chapter.count, 0),
});

const normalizeEdge = (edge: Record<string, unknown>): GraphEdge => ({
  id: num(edge.id, 0),
  from: String(edge.from ?? ""),
  to: String(edge.to ?? ""),
  kind: typeof edge.kind === "string" && edge.kind ? edge.kind : "jump",
  label: typeof edge.label === "string" ? edge.label : "",
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
  entry: typeof node.entry === "string" ? node.entry : "",
  time: typeof node.time === "number" ? node.time : null,
});

const buildMeta = (raw: RawGraph): GraphMeta => {
  const source = { ...raw.meta } as Record<string, unknown>;
  const meta = source as unknown as GraphMeta;
  meta.langs = arrays<string>(source.langs);
  meta.shards = arrays<GraphMeta["shards"][number]>(source.shards);
  meta.entries = arrays<unknown>(source.entries);
  meta.counts = (source.counts && typeof source.counts === "object"
    ? source.counts : {}) as Record<string, number>;
  meta.shardOf = source.shardOf && typeof source.shardOf === "object"
    ? source.shardOf as Record<string, string> : {};
  meta.checkpointShards = source.checkpointShards && typeof source.checkpointShards === "object"
    ? source.checkpointShards as Record<string, number> : {};
  meta.textSource = typeof source.textSource === "string" && source.textSource
    ? source.textSource : (meta.langs[0] || "");
  meta.vocab = (source.vocab && typeof source.vocab === "object"
    ? source.vocab : {}) as Vocab;
  meta.assets = (source.assets && typeof source.assets === "object"
    ? source.assets : {}) as Assets;
  meta.calendar = (source.calendar && typeof source.calendar === "object"
    ? source.calendar : {}) as GraphMeta["calendar"];
  meta.defaultLang = typeof source.defaultLang === "string" ? source.defaultLang : "";
  return meta;
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
    asset: (key, vars) => fillAsset(meta.assets[key] || "", vars),
    textPack: textPackOf,
    checkpoints: checkpointsOf,
    wordcount: wordcountOf,
  };
};

export const data: DataLayer = build();
