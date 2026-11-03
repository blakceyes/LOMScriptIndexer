import type { BeatRow } from "./beats";

export type NameTable = Record<string, Record<string, string>>;

export type TextPack = {
  schema?: number;
  lang?: string;
  source?: string;
  missing?: unknown;
  missingKeys?: string[];
  shardKeys?: string[];
  characters: Record<string, string>;
  titles: Record<string, string>;
  names: NameTable;
  edgeLabels: Record<string, string>;
  stories: Record<string, BeatRow[]>;
};

export type TextProgress = {
  head: string;
  loaded: number;
  total: number;
  done: boolean;
  headError: string;
  shardError: string;
};

export type ShardState = "idle" | "loading" | "ready" | "failed" | "missing";
