import { names } from "../data/names";
import { text } from "../data/text";
import { t } from "../i18n";
import { store } from "../state/store";
import type {
  BeatRow, BranchView, MetaChip, MetaView, PreviewLine, PreviewResult, ReaderBlock,
} from "../types/beats";
import type { GraphEdge, GraphNode } from "../types/graph";
import { condText, metaTarget, metaText } from "./cond";
import { stripRich } from "./rich";
import { wire } from "./wire";

const PREVIEW_LINES = 6;
const PREVIEW_CHARS = 220;
const PREVIEW_BRANCH_LINES = 3;
const PREVIEW_TOTAL_LINES = 6;

export const speakerName = (id: string): string => {
  if (!id) return "";
  const name = names.speaker(id);
  const title = names.title(id);
  return title ? t("nameWithTitle", { name, title }) : name;
};

export const entryLabel = (node: GraphNode | null): string => {
  if (!node || !node.entry) return "";
  return t(`entry.${node.entry}`, { defaultValue: "" });
};

export const entryClass = (node: GraphNode | null): string => (
  node && node.entry === "combat" ? "entry-badge badge badge-danger" : "entry-badge badge"
);

export const edgeLabelOf = (edge: GraphEdge): string => (
  text.edgeLabel(store.textLang(), String(edge.id), edge.label)
);

export const branchLabel = (data: BranchView): string => condText(data.cond) || data.text || "";

const metaChipOf = (meta: MetaView): { chip: MetaChip | null; dice: boolean } => {
  const value = metaText(meta.kind, meta.key, meta.value);
  if (!value) return { chip: null, dice: false };
  const target = meta.kind === "dice"
    ? (meta.key ? { kind: "check", key: meta.key } : null)
    : metaTarget(meta.kind, meta.key);
  const chip: MetaChip = { text: value, target };
  if (value.length > 24) chip.title = value;
  return { chip, dice: !!target && meta.kind === "dice" };
};

export const buildBlocks = (input: unknown): ReaderBlock[] => {
  const rows = Array.isArray(input) ? input as BeatRow[] : [];
  const out: ReaderBlock[] = [];
  let metaBuffer: MetaView[] = [];
  let branchBuffer: BranchView[] = [];
  let branchGroup: number | null = null;
  let diceChips: MetaChip[] = [];

  const flushMeta = () => {
    if (!metaBuffer.length) return;
    const chips: MetaChip[] = [];
    for (const meta of metaBuffer) {
      const { chip, dice } = metaChipOf(meta);
      if (!chip) continue;
      if (dice) diceChips.push(chip);
      else chips.push(chip);
    }
    metaBuffer = [];
    if (!chips.length) return;
    out.push({ kind: "meta", chips });
  };

  const flushDice = () => {
    if (!diceChips.length) return;
    const chips = diceChips;
    diceChips = [];
    out.push({ kind: "dice", chips });
  };

  const flushBranches = () => {
    if (!branchBuffer.length) return;
    const boxes = branchBuffer;
    branchBuffer = [];
    branchGroup = null;
    flushDice();
    const filled = boxes.filter((box) => !!box.blocks && box.blocks.length > 0);
    if (!filled.length) return;
    out.push({ kind: "branches", branches: filled });
  };

  for (const row of rows) {
    if (!Array.isArray(row) || !row.length) continue;

    if (wire.isBeat(row, "branch")) {
      flushMeta();
      const data = wire.branch(row);
      if (branchBuffer.length && data.group !== branchGroup) flushBranches();
      branchGroup = data.group;
      data.blocks = buildBlocks(data.beats);
      branchBuffer.push(data);
      continue;
    }

    flushBranches();

    if (wire.isBeat(row, "meta")) {
      metaBuffer.push(wire.meta(row));
      continue;
    }
    flushMeta();

    if (wire.isBeat(row, "choice")) {
      const options = wire.choice(row).map((item, index) => ({ ...item, index }));
      const dice = diceChips;
      diceChips = [];
      out.push({ kind: "choice", options, dice });
      continue;
    }
    flushDice();

    if (wire.isBeat(row, "lore")) {
      const lines = stripRich(wire.lore(row)).split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      out.push({ kind: "lore", lines });
      continue;
    }

    if (wire.isBeat(row, "battle")) {
      out.push({ kind: "battle", battle: wire.battle(row) });
      continue;
    }

    if (wire.isBeat(row, "scene")) {
      out.push({ kind: "scene", scene: wire.scene(row) });
      continue;
    }

    if (wire.isBeat(row, "say")) {
      const data = wire.say(row);
      out.push({ kind: "say", mode: data.mode, speaker: data.speaker, text: data.text });
      continue;
    }

    if (wire.isBeat(row, "jump")) {
      out.push({ kind: "jump", jump: wire.jump(row) });
    }
  }

  flushMeta();
  flushBranches();
  flushDice();
  return out;
};

export const beatsPreview = (
  rows: unknown,
  budget?: { lines: number; chars: number },
): PreviewResult => {
  const limits = budget || { lines: PREVIEW_LINES, chars: PREVIEW_CHARS };
  const out: PreviewResult = { lines: [], more: 0 };
  let used = 0;
  let stop = false;

  const push = (kind: string, value: unknown, who?: string) => {
    const clean = stripRich(value ?? "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    if (stop || out.lines.length >= limits.lines || used + clean.length > limits.chars) {
      out.more++;
      if (out.lines.length >= limits.lines) stop = true;
      return;
    }
    out.lines.push({ kind, text: clean, who: who || "" });
    used += clean.length;
  };

  const walk = (list: unknown) => {
    for (const row of Array.isArray(list) ? list as BeatRow[] : []) {
      if (!Array.isArray(row)) continue;
      if (wire.isBeat(row, "say")) {
        const data = wire.say(row);
        push(
          data.mode === "narration" ? "narration" : data.mode === "think" ? "think" : "say",
          data.text,
          data.mode === "dialog" && data.speaker ? speakerName(data.speaker) : "",
        );
      } else if (wire.isBeat(row, "meta")) {
        const data = wire.meta(row);
        push("meta", metaText(data.kind, data.key, data.value));
      } else if (wire.isBeat(row, "jump")) {
        push("jump", `→ ${wire.jump(row).target || ""}`);
      } else if (wire.isBeat(row, "battle")) {
        const data = wire.battle(row);
        const label = t(data.kind === "combat" ? "battleDuel" : "battleCampaign");
        const detail = data.note || data.title || "";
        push("jump", `${label} ${detail}`.trim());
      } else if (wire.isBeat(row, "scene")) {
        const data = wire.scene(row);
        push("jump", `↩ ${data.name}${data.next ? ` → ${data.next}` : ""}`);
      } else if (wire.isBeat(row, "choice")) {
        const options = wire.choice(row);
        const first = options[0] && options[0].text
          ? t("colonPrefix", { text: options[0].text }) : "";
        push("choice", t("previewChoice", { n: options.length }) + first);
      } else if (wire.isBeat(row, "branch")) {
        walk(wire.branch(row).beats);
      }
    }
  };

  walk(rows);
  return out;
};

export const previewOfBranches = (list: BeatRow[]): PreviewResult => {
  let lines: PreviewLine[] = [];
  let hidden = 0;
  const rows = (list || []).slice(0, PREVIEW_BRANCH_LINES);
  rows.forEach((row) => {
    const data = wire.branch(row);
    const label = branchLabel(data).trim();
    if (label) lines.push({ kind: "cond", text: label, who: "" });
    const sub = beatsPreview(data.beats, { lines: 1, chars: 60 });
    sub.lines.forEach((line) => lines.push(line));
  });
  if ((list || []).length > PREVIEW_BRANCH_LINES) hidden = list.length - PREVIEW_BRANCH_LINES;
  if (lines.length > PREVIEW_TOTAL_LINES) {
    hidden += lines.length - PREVIEW_TOTAL_LINES;
    lines = lines.slice(0, PREVIEW_TOTAL_LINES);
  }
  return { lines, more: hidden };
};

export const firstLineOf = (node: GraphNode | null): string => {
  if (!node) return "";
  const rows = text.story(store.textLang(), node.id);
  if (!rows) return "";
  const first = wire.firstSay(rows);
  if (!first) return "";
  if (!first.speaker) return first.text;
  return t("lineSpeaker", { name: speakerName(first.speaker), text: first.text });
};
