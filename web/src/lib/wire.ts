import type {
  BattleEvent, BattleLine, BattlePart, BattleRow, BattleView, BattleWhen,
  BeatRow, BranchView, CheckRef, JumpView, MetaView, OptionView, SceneView,
} from "../types/beats";
import type { CondNode } from "../types/cond";
import { stripRich } from "./rich";

export const BEAT_CODES = {
  say: "s",
  choice: "c",
  branch: "br",
  jump: "j",
  meta: "m",
  lore: "lore",
  scene: "sc",
  battle: "bt",
} as const;

export type BeatKind = keyof typeof BEAT_CODES;

const record = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null
);

const list = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

const str = (value: unknown): string => (typeof value === "string" ? value : "");

const num = (value: unknown, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value) ? value : fallback
);

const isBeat = (row: unknown, kind: BeatKind): boolean => (
  Array.isArray(row) && row.length > 0 && row[0] === BEAT_CODES[kind]
);

const say = (row: BeatRow): { speaker: string; text: string; mode: string } => ({
  speaker: str(row[1]),
  text: str(row[2]),
  mode: str(row[3]) || "dialog",
});

const check = (value: unknown): CheckRef | null => {
  const hit = record(value);
  if (!hit || !str(hit.key)) return null;
  return {
    key: str(hit.key),
    kind: str(hit.kind),
    result: typeof hit.result === "number" ? hit.result : null,
  };
};

const option = (item: unknown): OptionView => {
  const row = list(item);
  return {
    text: str(row[0]),
    cond: record(row[1]),
    beats: list<BeatRow>(row[2]),
    lock: str(row[3]),
    detail: record(row[4]),
  };
};

const choice = (row: BeatRow): OptionView[] => (
  list<unknown>(row[1]).filter(Array.isArray).map(option)
);

const branch = (row: BeatRow): BranchView => ({
  check: check(row[1]),
  cond: record(row[2]) as CondNode | null,
  text: str(row[3]),
  beats: list<BeatRow>(row[4]),
  group: num(row[5], 0),
});

const jump = (row: BeatRow): JumpView => ({
  target: str(row[1]),
  label: str(row[2]),
});

const scene = (row: BeatRow): SceneView => ({
  name: str(row[1]),
  key: str(row[2]),
  next: str(row[3]),
  after: str(row[4]),
});

const meta = (row: BeatRow): MetaView => ({
  kind: str(row[1]),
  key: str(row[2]),
  value: typeof row[3] === "number" ? row[3] as number : null,
});

const battleLine = (value: unknown): BattleLine => {
  const row = record(value) || {};
  return {
    kind: str(row.kind),
    speaker: str(row.speaker),
    mode: str(row.mode) || "dialog",
    target: str(row.target),
    key: str(row.key),
    scene: str(row.scene),
    text: str(row.text),
  };
};

const battlePart = (value: unknown): BattlePart => {
  const item = record(value) || {};
  return { text: str(item.text), kind: str(item.kind), key: str(item.key) };
};

const battleWhen = (value: unknown): BattleWhen => {
  const row = record(value) || {};
  return { logic: str(row.logic), parts: list<unknown>(row.parts).map(battlePart) };
};

const battle = (row: BeatRow): BattleView => {
  const info = record(row[4]) || {};
  return {
    name: str(row[1]),
    key: str(row[2]),
    next: str(row[3]),
    after: str(row[5]),
    kind: str(info.kind),
    title: str(info.title),
    speaker: str(info.speaker),
    note: str(info.note),
    goals: list<unknown>(info.goals).map(str),
    facts: list<unknown>(info.facts).map(str),
    rows: list<unknown>(info.rows).map((item) => {
      const entry = record(item) || {};
      return { label: str(entry.label), value: str(entry.value) } as BattleRow;
    }),
    events: list<unknown>(info.events).map((item) => {
      const entry = record(item) || {};
      return {
        when: battleWhen(entry.when),
        lines: list<unknown>(entry.lines).map(battleLine),
      } as BattleEvent;
    }),
  };
};

const lore = (row: BeatRow): string => str(row[1]);

const walk = (rows: unknown, visit: (row: BeatRow) => void): void => {
  for (const row of list<BeatRow>(rows)) {
    if (!Array.isArray(row) || !row.length) continue;
    visit(row);
    if (isBeat(row, "choice")) {
      for (const item of choice(row)) walk(item.beats, visit);
    } else if (isBeat(row, "branch")) {
      walk(branch(row).beats, visit);
    }
  }
};

const textOf = (rows: unknown): string => {
  const parts: string[] = [];
  walk(rows, (row) => {
    if (isBeat(row, "say")) parts.push(stripRich(say(row).text));
    else if (isBeat(row, "choice")) {
      for (const item of choice(row)) parts.push(stripRich(item.text));
    } else if (isBeat(row, "lore")) parts.push(stripRich(lore(row)));
    else if (isBeat(row, "battle")) {
      for (const event of battle(row).events) {
        for (const line of event.lines) {
          if (line.kind !== "say" && line.kind !== "status" && line.kind !== "support") continue;
          if (line.text) parts.push(stripRich(line.text));
        }
      }
    }
  });
  return parts.join("\n");
};

const firstSay = (rows: unknown): { speaker: string; text: string } | null => {
  let hit: { speaker: string; text: string } | null = null;
  walk(rows, (row) => {
    if (hit || !isBeat(row, "say")) return;
    const said = say(row);
    hit = { speaker: said.speaker, text: stripRich(said.text) };
  });
  return hit;
};

export const wire = {
  BEAT_CODES,
  battle,
  branch,
  choice,
  firstSay,
  isBeat,
  jump,
  lore,
  meta,
  say,
  scene,
  textOf,
  walk,
};
