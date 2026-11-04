import { names } from "../data/names";
import { textStore } from "../data/text";
import { t } from "../i18n";
import { store } from "../state/store";
import type {
  BeatRow, BranchView, MetaChip, MetaView, PreviewLine, PreviewResult, ReaderBlock,
} from "../types/beats";
import type { GraphEdge, GraphNode } from "../types/graph";
import * as beatRows from "./beatRows";
import { condText, metaTarget, metaText } from "./conditions";
import { stripSizeTags } from "./sizeTags";

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
  textStore.edgeLabel(store.textLang(), String(edge.index), edge.label)
);

export const branchLabel = (branch: BranchView): string => (
  condText(branch.condition) || branch.source || ""
);

const metaChipOf = (meta: MetaView): { chip: MetaChip | null; isDice: boolean } => {
  const text = metaText(meta.kind, meta.key, meta.value);
  if (!text) return { chip: null, isDice: false };
  const target = meta.kind === "dice"
    ? (meta.key ? { kind: "check", key: meta.key } : null)
    : metaTarget(meta.kind, meta.key);
  const chip: MetaChip = { text, target };
  if (text.length > 24) chip.title = text;
  return { chip, isDice: !!target && meta.kind === "dice" };
};

export const buildReaderBlocks = (input: unknown): ReaderBlock[] => {
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
      const { chip, isDice } = metaChipOf(meta);
      if (!chip) continue;
      if (isDice) diceChips.push(chip);
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
    const pending = branchBuffer;
    branchBuffer = [];
    branchGroup = null;
    flushDice();
    const filled = pending.filter((branch) => !!branch.blocks && branch.blocks.length > 0);
    if (!filled.length) return;
    out.push({ kind: "branches", branches: filled });
  };

  for (const row of rows) {
    if (!Array.isArray(row) || !row.length) continue;

    if (beatRows.isBeat(row, "branch")) {
      flushMeta();
      const branch = beatRows.parseBranch(row);
      if (branchBuffer.length && branch.group !== branchGroup) flushBranches();
      branchGroup = branch.group;
      branch.blocks = buildReaderBlocks(branch.beats);
      branchBuffer.push(branch);
      continue;
    }

    flushBranches();

    if (beatRows.isBeat(row, "meta")) {
      metaBuffer.push(beatRows.parseMeta(row));
      continue;
    }
    flushMeta();

    if (beatRows.isBeat(row, "choice")) {
      const options = beatRows.parseChoice(row).map((item, index) => ({ ...item, index }));
      const chips = diceChips;
      diceChips = [];
      out.push({ kind: "choice", options, diceChips: chips });
      continue;
    }
    flushDice();

    if (beatRows.isBeat(row, "lore")) {
      const lines = stripSizeTags(beatRows.parseLore(row)).split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      out.push({ kind: "lore", lines });
      continue;
    }

    if (beatRows.isBeat(row, "battle")) {
      out.push({ kind: "battle", battle: beatRows.parseBattle(row) });
      continue;
    }

    if (beatRows.isBeat(row, "scene")) {
      out.push({ kind: "scene", scene: beatRows.parseScene(row) });
      continue;
    }

    if (beatRows.isBeat(row, "say")) {
      const said = beatRows.parseSay(row);
      out.push({
        kind: "say", mode: said.mode, speaker: said.speaker, text: said.text,
      });
      continue;
    }

    if (beatRows.isBeat(row, "jump")) {
      out.push({ kind: "jump", jump: beatRows.parseJump(row) });
    }
  }

  flushMeta();
  flushBranches();
  flushDice();
  return out;
};

export const rowsPreview = (
  rows: unknown,
  budget?: { lines: number; chars: number },
): PreviewResult => {
  const limits = budget || { lines: PREVIEW_LINES, chars: PREVIEW_CHARS };
  const out: PreviewResult = { lines: [], omittedCount: 0 };
  let used = 0;
  let stopped = false;

  const push = (kind: string, value: unknown, speaker?: string) => {
    const clean = stripSizeTags(value ?? "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    if (stopped || out.lines.length >= limits.lines || used + clean.length > limits.chars) {
      out.omittedCount++;
      if (out.lines.length >= limits.lines) stopped = true;
      return;
    }
    out.lines.push({ kind, text: clean, speaker: speaker || "" });
    used += clean.length;
  };

  const walk = (list: unknown) => {
    for (const row of Array.isArray(list) ? list as BeatRow[] : []) {
      if (!Array.isArray(row)) continue;
      if (beatRows.isBeat(row, "say")) {
        const said = beatRows.parseSay(row);
        push(
          said.mode === "narration" ? "narration" : said.mode === "think" ? "think" : "say",
          said.text,
          said.mode === "dialog" && said.speaker ? speakerName(said.speaker) : "",
        );
      } else if (beatRows.isBeat(row, "meta")) {
        const meta = beatRows.parseMeta(row);
        push("meta", metaText(meta.kind, meta.key, meta.value));
      } else if (beatRows.isBeat(row, "jump")) {
        push("jump", `→ ${beatRows.parseJump(row).target || ""}`);
      } else if (beatRows.isBeat(row, "battle")) {
        const battle = beatRows.parseBattle(row);
        const label = t(battle.kind === "combat" ? "battleDuel" : "battleCampaign");
        const detail = battle.note || battle.title || "";
        push("jump", `${label} ${detail}`.trim());
      } else if (beatRows.isBeat(row, "scene")) {
        const scene = beatRows.parseScene(row);
        push("jump", `↩ ${scene.scene}${scene.nextScene ? ` → ${scene.nextScene}` : ""}`);
      } else if (beatRows.isBeat(row, "choice")) {
        const options = beatRows.parseChoice(row);
        const first = options[0] && options[0].text
          ? t("colonPrefix", { text: options[0].text }) : "";
        push("choice", t("previewChoice", { n: options.length }) + first);
      } else if (beatRows.isBeat(row, "branch")) {
        walk(beatRows.parseBranch(row).beats);
      }
    }
  };

  walk(rows);
  return out;
};

export const branchesPreview = (branches: BeatRow[]): PreviewResult => {
  let lines: PreviewLine[] = [];
  let omitted = 0;
  const rows = (branches || []).slice(0, PREVIEW_BRANCH_LINES);
  rows.forEach((row) => {
    const branch = beatRows.parseBranch(row);
    const label = branchLabel(branch).trim();
    if (label) lines.push({ kind: "cond", text: label, speaker: "" });
    const sub = rowsPreview(branch.beats, { lines: 1, chars: 60 });
    sub.lines.forEach((line) => lines.push(line));
  });
  if ((branches || []).length > PREVIEW_BRANCH_LINES) {
    omitted = branches.length - PREVIEW_BRANCH_LINES;
  }
  if (lines.length > PREVIEW_TOTAL_LINES) {
    omitted += lines.length - PREVIEW_TOTAL_LINES;
    lines = lines.slice(0, PREVIEW_TOTAL_LINES);
  }
  return { lines, omittedCount: omitted };
};

export const firstSayTextOf = (node: GraphNode | null): string => {
  if (!node) return "";
  const rows = textStore.beatRows(store.textLang(), node.id);
  if (!rows) return "";
  const first = beatRows.firstSay(rows);
  if (!first) return "";
  if (!first.speaker) return first.text;
  return t("lineSpeaker", { name: speakerName(first.speaker), text: first.text });
};
