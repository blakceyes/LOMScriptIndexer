import { data } from "../data/schema";
import type {
  BattleEvent, BattleLine, BattlePart, BattleRow, BattleView, BattleWhen,
  BeatRow, BranchView, CheckRef, JumpView, MetaView, OptionView, SceneView,
} from "../types/beats";
import type { CondNode } from "../types/cond";

const DEFAULT_TAGS = ["s", "c", "br", "j", "m", "lore", "sc", "bt"];
const DEFAULT_MODES = ["dialog", "narration", "think"];
const RICH_TAG = /\{[^{}]*\}/g;

const record = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null
);

const list = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

const str = (value: unknown): string => (typeof value === "string" ? value : "");

const num = (value: unknown, fallback: number): number => (
  typeof value === "number" && Number.isFinite(value) ? value : fallback
);

const tags = (data.vocab.beatTags && data.vocab.beatTags.length)
  ? data.vocab.beatTags : DEFAULT_TAGS;
const modes = (data.vocab.sayModes && data.vocab.sayModes.length)
  ? data.vocab.sayModes : DEFAULT_MODES;

const TAGS = {
  say: tags[0],
  choice: tags[1],
  branch: tags[2],
  jump: tags[3],
  meta: tags[4],
  lore: tags[5],
  scene: tags[6],
  battle: tags[7],
};

const is = (row: unknown, name: keyof typeof TAGS): boolean => (
  Array.isArray(row) && row.length > 0 && row[0] === TAGS[name]
);

const say = (row: BeatRow): { speaker: string; text: string; mode: string; modeIndex: number } => {
  const modeIndex = num(row[3], 0);
  return {
    speaker: str(row[1]),
    text: str(row[2]),
    mode: modes[modeIndex] || modes[0],
    modeIndex,
  };
};

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

const choice = (row: BeatRow): OptionView[] => list<unknown>(row[1]).filter(Array.isArray).map(option);

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

const battleLine = (line: unknown): BattleLine => {
  if (Array.isArray(line)) {
    const kind = str(line[0]);
    if (kind === "j") {
      return { kind: "jump", target: str(line[2]), text: "", speaker: "", mode: 0, key: "", scene: "" };
    }
    if (kind === "a") {
      return { kind: "action", target: "", speaker: "", mode: 0, key: "", scene: "", text: str(line[1]) };
    }
    const mode = kind === "t" ? 2 : kind === "n" ? 1 : 0;
    return { kind: "say", speaker: str(line[1]), mode, target: "", key: "", scene: "", text: str(line[2]) };
  }
  const row = record(line) || {};
  return {
    kind: str(row.kind),
    speaker: str(row.speaker),
    mode: num(row.mode, 0),
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
  if (typeof value === "string") {
    return { logic: "", parts: [{ text: value, kind: "", key: "" }] };
  }
  const row = record(value) || {};
  if (Array.isArray(row.parts)) {
    return { logic: str(row.logic), parts: list<unknown>(row.parts).map(battlePart) };
  }
  const parts: BattlePart[] = [];
  if (row.text) parts.push({ text: str(row.text), kind: "", key: "" });
  list<unknown>(row.chips).forEach((chip) => parts.push(battlePart(chip)));
  return { logic: "", parts };
};

const battle = (row: BeatRow): BattleView => {
  const info = record(row[4]) || {};
  const facts = info.facts !== undefined
    ? list<unknown>(info.facts).map(str)
    : list<unknown>(info.chips).map(str);
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
    facts,
    rows: list<unknown>(info.rows).map((item) => {
      const row = record(item) || {};
      return { label: str(row.label), value: str(row.value) } as BattleRow;
    }),
    events: list<unknown>(info.events).map((event) => {
      const item = record(event) || {};
      return {
        when: battleWhen(item.when),
        lines: list<unknown>(item.lines).map(battleLine),
      } as BattleEvent;
    }),
  };
};

const lore = (row: BeatRow): string => str(row[1]);

const walk = (rows: unknown, visit: (row: BeatRow) => void): void => {
  for (const row of list<BeatRow>(rows)) {
    if (!Array.isArray(row) || !row.length) continue;
    visit(row);
    if (is(row, "choice")) {
      for (const item of choice(row)) walk(item.beats, visit);
    } else if (is(row, "branch")) {
      walk(branch(row).beats, visit);
    }
  }
};

const stripRich = (value: unknown): string => (value ? String(value).replace(RICH_TAG, "") : "");

const textOf = (rows: unknown): string => {
  const parts: string[] = [];
  walk(rows, (row) => {
    if (is(row, "say")) parts.push(stripRich(say(row).text));
    else if (is(row, "choice")) {
      for (const item of choice(row)) parts.push(stripRich(item.text));
    } else if (is(row, "lore")) parts.push(stripRich(lore(row)));
    else if (is(row, "battle")) {
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
    if (hit || !is(row, "say")) return;
    const said = say(row);
    hit = { speaker: said.speaker, text: stripRich(said.text) };
  });
  return hit;
};

export const beat = {
  TAGS,
  battle,
  branch,
  choice,
  firstSay,
  is,
  jump,
  lore,
  meta,
  say,
  scene,
  stripRich,
  textOf,
  walk,
};
