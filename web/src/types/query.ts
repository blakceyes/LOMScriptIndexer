import type { Facets } from "./graph";

export type QueryField = {
  id: string;
  kind: string;
  node?: string;
  aliases: string[];
};

export type QueryError = {
  key: string;
  params: Record<string, unknown>;
  message: string;
  column: number;
};

export type QueryTerm = {
  type: "term";
  field: string;
  op: string;
  value: string | number;
  offset: number;
};

export type QueryNode =
  | { type: "or" | "and" | "xor"; left: QueryNode; right: QueryNode }
  | { type: "not"; operand: QueryNode }
  | QueryTerm;

export type QueryContext = {
  nodeCount: number;
  nodes: {
    id: string;
    chapterIndex: number;
    outDegree: number;
    inDegree: number;
    sayCount: number;
    positionInDegree: number;
    entry: string;
  }[];
  chapters: { id: string; scriptCount: number; [key: string]: unknown }[];
  facets: Facets[];
  edgeGroup: (index: number, group: string) => boolean;
  names: Record<string, Record<string, string>>;
  textAt: (index: number) => string;
};

export type QueryValue = {
  value: string;
  label: string;
  count: number;
};

export type QuerySuggestion = {
  value: string;
  label: string;
  count: number | null;
  insert?: string;
  kind?: string;
};
