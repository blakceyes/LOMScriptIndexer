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

export type PositionAdjustment = {
  rate: number;
  condition?: ConditionNode | null;
};

export type PositionCandidate = {
  name?: string;
  rate: number;
  active?: boolean;
  activeCondition?: ConditionNode | null;
  activeEmpty?: boolean;
  adjustments?: PositionAdjustment[];
};

export type CheckpointModel = {
  kind: string;
  branches?: CheckpointBranch[];
  fallback?: number | null;
  additions?: DiceAddition[];
  useCount?: boolean;
  countItems?: CountItem[];
  prefix?: string;
  candidates?: PositionCandidate[];
  default?: unknown;
  variants?: CheckpointModel[];
};
