export type Facets = {
  speakers: string[];
  flags: string[];
  checks: string[];
  stats: string[];
  rels: string[];
  options: number;
  locks: number;
  dice: number;
};

export type GraphNodeFlags = {
  empty?: boolean;
  [key: string]: unknown;
};

export type GraphNode = {
  id: string;
  chapter: number;
  out: number;
  in: number;
  say: number;
  systemIn: number;
  flags: GraphNodeFlags;
  facets: Facets;
  entry: string;
  time: number | null;
};

export type GraphEdge = {
  id: number;
  from: string;
  to: string;
  kind: string;
  label: string;
  data: Record<string, unknown> | null;
};

export type Chapter = {
  id: string;
  kind: string;
  number: number | null;
  color: string;
  count: number;
};

export type Shard = {
  key: string;
  nodes: number;
  bytes: number;
  chapters: string[];
};

export type GameInfo = {
  version?: string;
  build?: string;
  updated?: string;
};

export type Assets = Record<string, string>;

export type Vocab = {
  beatTags: string[];
  sayModes: string[];
  edgeKinds: string[];
  edgeGroups: Record<string, string>;
  facetKinds: string[];
  checkKinds: string[];
  valueKinds: string[];
  compareOps: string[];
  groupOps: string[];
  metaKinds: string[];
  [key: string]: unknown;
};

export type GraphMeta = {
  generated?: string;
  game?: GameInfo;
  langs: string[];
  defaultLang: string;
  textSource: string;
  vocab: Vocab;
  assets: Assets;
  calendar: { roundsPerYear?: number; roundsPerMonth?: number };
  counts: Record<string, number>;
  shards: Shard[];
  entries: unknown[];
  shardOf: Record<string, string>;
  checkpointShards: Record<string, number>;
  fullText?: boolean;
  [key: string]: unknown;
};

export type ChapterEntry = {
  id?: string;
  name?: string;
  [key: string]: unknown;
};

export type RawGraph = {
  schema: number;
  meta: Record<string, unknown>;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  chapters: Record<string, unknown>[];
};

export type DataLayer = {
  meta: GraphMeta;
  vocab: Vocab;
  assets: Assets;
  calendar: { roundsPerYear?: number; roundsPerMonth?: number };
  nodes: GraphNode[];
  edges: GraphEdge[];
  chapters: Chapter[];
  langs: string[];
  entries: unknown[];
  shardOf: Record<string, string>;
  checkpointShards: Record<string, number>;
  asset: (key: string, vars?: Record<string, string | number>) => string;
  textPack: () => Record<string, unknown>;
  checkpoints: () => Record<string, unknown>;
  wordcount: () => Record<string, unknown>;
};
