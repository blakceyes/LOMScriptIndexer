export type CondNode =
  | { tag: "const"; value: unknown }
  | { tag: "random"; min: number; max: number }
  | { tag: "dice" }
  | { tag: "var"; kind: string; key: string; negative?: boolean }
  | { tag: "check"; kind: string; key: string; negative?: boolean }
  | { tag: "group"; op?: string; name?: string; items?: CondNode[]; negative?: boolean }
  | { tag: "compare"; op?: string; left?: CondNode; right?: CondNode }
  | { tag: "logic"; op?: string; items?: CondNode[] };

export type CondBranch = {
  result?: number | null;
  expr?: CondNode | null;
};

export type DiceAddition = {
  kind?: string;
  key?: string;
  rate?: number;
  negative?: boolean;
  hide?: boolean;
};

export type CountItem = {
  value: number;
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
  branches?: CondBranch[];
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

export type LookupTarget = {
  kind: string;
  key: string;
  type?: string;
  label?: string;
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
  t: "term";
  field: string;
  op: string;
  value: string | number;
  at: number;
};

export type QueryNode =
  | { t: "or" | "and" | "xor"; l: QueryNode; r: QueryNode }
  | { t: "not"; x: QueryNode }
  | QueryTerm;

export type QueryContext = {
  count: number;
  nodes: {
    id: string;
    chapter: number;
    out: number;
    in: number;
    say: number;
    systemIn: number;
    entry: string;
  }[];
  chapters: { id: string; count: number; [key: string]: unknown }[];
  facets: unknown[];
  edgeGroup: (index: number, group: string) => boolean;
  names: Record<string, Record<string, string>>;
  textOf: (index: number) => string;
  _all?: Set<number>;
  _index?: Record<string, Map<string, Set<number>>>;
  _values?: Record<string, QueryValue[]>;
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
