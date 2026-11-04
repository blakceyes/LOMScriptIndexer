import type { BeatRow } from "./beats";

export type NameTable = Record<string, Record<string, string>>;

export type WordPair = [number, number];

export type WordRow = (WordPair | null)[];

export type WordPack = {
  scripts: Record<string, WordRow>;
  chapters: Record<string, WordRow>;
};

export type WordCountPack = {
  kinds?: string[];
  langs?: Record<string, WordPack>;
};

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
  scripts: Record<string, BeatRow[]>;
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
