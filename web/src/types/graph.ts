import type { CheckpointModel } from "./condition";
import type { TextPack, WordCountPack } from "./text";

export type Facets = {
  speakers: string[];
  flags: string[];
  checks: string[];
  stats: string[];
  relations: string[];
  optionCount: number;
  lockCount: number;
  diceCheckCount: number;
};

export type ScriptFlags = {
  isEmpty?: boolean;
  isSimplifiedOnly?: boolean;
  hasNoOutgoing?: boolean;
  hasNoIncoming?: boolean;
};

export type GraphNode = {
  id: string;
  chapterIndex: number;
  outDegree: number;
  inDegree: number;
  sayCount: number;
  positionInDegree: number;
  flags: ScriptFlags;
  facets: Facets;
  entry: string;
  time: number | null;
};

export type GraphEdge = {
  index: number;
  source: string;
  target: string;
  kind: string;
  label: string;
};

export type Chapter = {
  id: string;
  kind: string;
  number: number | null;
  color: string;
  scriptCount: number;
};

export type Shard = {
  key: string;
  nodeCount: number;
  bytes: number;
  chapterIds: string[];
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
  edgeGroupByKind: Record<string, string>;
  facetKinds: string[];
  checkKinds: string[];
  valueKinds: string[];
  compareSymbols: string[];
  groupKinds: string[];
  metaKinds: string[];
  itemKinds: string[];
  entryKinds: string[];
  chapterKinds: string[];
  [key: string]: unknown;
};

export type GraphMeta = {
  generated?: string;
  game?: GameInfo;
  langs: string[];
  defaultLang: string;
  sourceLang: string;
  vocab: Vocab;
  assets: Assets;
  calendar: { roundsPerYear?: number; roundsPerMonth?: number };
  counts: Record<string, number>;
  shards: Shard[];
  systemEntries: unknown[];
  shardByNode: Record<string, string>;
  checkpointShardByKey: Record<string, number>;
  [key: string]: unknown;
};

export type RawGraph = {
  schema: number;
  meta: Record<string, unknown>;
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
  chapters: Record<string, unknown>[];
};

export type Dataset = {
  meta: GraphMeta;
  vocab: Vocab;
  assets: Assets;
  calendar: { roundsPerYear?: number; roundsPerMonth?: number };
  nodes: GraphNode[];
  edges: GraphEdge[];
  chapters: Chapter[];
  langs: string[];
  systemEntries: unknown[];
  shardByNode: Record<string, string>;
  checkpointShardByKey: Record<string, number>;
  assetUrl: (key: string, vars?: Record<string, string | number>) => string;
  getTextPack: () => Record<string, TextPack>;
  getCheckpoints: () => Record<string, CheckpointModel>;
  getWordCount: () => WordCountPack;
};
