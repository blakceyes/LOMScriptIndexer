import type { Facets } from "./graph";

export type ConditionNode =
  | { tag: "const"; value: unknown }
  | { tag: "random"; min: number; max: number }
  | { tag: "dice" }
  | { tag: "var"; kind: string; key: string; negative?: boolean }
  | { tag: "check"; kind: string; key: string; negative?: boolean }
  | { tag: "group"; op?: string; name?: string; items?: ConditionNode[]; negative?: boolean }
  | { tag: "compare"; op?: string; left?: ConditionNode; right?: ConditionNode }
  | { tag: "logic"; op?: string; items?: ConditionNode[] };

export type CheckpointBranch = {
  result?: number | null;
  expr?: ConditionNode | null;
};

export type DiceAddition = {
  kind?: string;
  key?: string;
  rate?: number;
  negative?: boolean;
  hide?: boolean;
};

export type CountItem = {
  threshold: number;
  op: string;
  result: number;
};

export type DiceCandidate = {
  name?: string;
  note?: string;
  rate: number;
};

export type CheckpointModel = {
  kind: string;
  branches?: CheckpointBranch[];
  fallback?: number | null;
  additions?: DiceAddition[];
  useCount?: boolean;
  countItems?: CountItem[];
  prefix?: string;
  candidates?: DiceCandidate[];
  default?: unknown;
  note?: string;
  variants?: CheckpointModel[];
};

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
