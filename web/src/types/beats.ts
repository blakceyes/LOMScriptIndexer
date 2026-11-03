import type { CondNode } from "./cond";

export type BeatRow = unknown[];

export type CheckRef = { key: string; kind: string; result?: number | null };

export type OptionView = {
  text: string;
  cond: Record<string, unknown> | null;
  beats: BeatRow[];
  lock: string;
  detail: Record<string, unknown> | null;
};

export type BranchView = {
  check: CheckRef | null;
  cond: CondNode | null;
  detail?: Record<string, unknown> | null;
  text: string;
  beats: BeatRow[];
  group: number;
  blocks?: ReaderBlock[];
};

export type JumpView = {
  target: string;
  label: string;
};

export type SceneView = {
  name: string;
  key: string;
  next: string;
  after: string;
};

export type MetaView = {
  kind: string;
  key: string;
  value: number | null;
};

export type BattleLine = {
  kind: string;
  speaker: string;
  mode: string;
  target: string;
  key: string;
  scene: string;
  text: string;
};

export type BattlePart = {
  text: string;
  kind: string;
  key: string;
};

export type BattleWhen = {
  logic: string;
  parts: BattlePart[];
};

export type BattleEvent = {
  when: BattleWhen;
  lines: BattleLine[];
};

export type BattleRow = {
  label: string;
  value: string;
};

export type BattleView = {
  name: string;
  key: string;
  next: string;
  after: string;
  kind: string;
  title: string;
  speaker: string;
  note: string;
  goals: string[];
  facts: string[];
  rows: BattleRow[];
  events: BattleEvent[];
};

export type MetaChip = {
  text: string;
  target: { kind: string; key: string; method?: string } | null;
  title?: string;
};

export type ChoiceOption = OptionView & { index: number };

export type ReaderBlock =
  | { kind: "say"; mode: string; speaker: string; text: string }
  | { kind: "meta"; chips: MetaChip[] }
  | { kind: "dice"; chips: MetaChip[] }
  | { kind: "choice"; options: ChoiceOption[]; dice: MetaChip[] }
  | { kind: "branches"; branches: BranchView[] }
  | { kind: "lore"; lines: string[] }
  | { kind: "battle"; battle: BattleView }
  | { kind: "scene"; scene: SceneView }
  | { kind: "jump"; jump: JumpView };

export type RichSegment = {
  text: string;
  scale: number;
};

export type PreviewLine = {
  kind: string;
  text: string;
  who: string;
};

export type PreviewResult = {
  lines: PreviewLine[];
  more: number;
};
