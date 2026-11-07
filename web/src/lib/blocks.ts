import { names } from "../data/names";
import { textStore } from "../data/text";
import { t } from "../i18n";
import { pinia } from "../stores";
import { useScriptStore } from "../stores/script";

import type { BeatRow, BranchView, MetaChip, MetaView, ReaderBlock } from "../types/beats";
import type { GraphEdge, GraphNode } from "../types/graph";
import * as beatRows from "./beatRows";
import { condText, metaDisplay, metaTarget } from "./conditions";
import { stripMarkup } from "./richText";

let scriptHandle: ReturnType<typeof useScriptStore> | null = null;
const script = (): ReturnType<typeof useScriptStore> => (scriptHandle ??= useScriptStore(pinia));

export const speakerName = (id: string): string => {
  if (!id) return "";
  const name = names.speaker(id);
  const title = names.title(id);
  return title ? t("nameWithTitle", { name, title }) : name;
};

export const edgeLabelOf = (edge: GraphEdge): string =>
  textStore.edgeLabel(script().textLang(), String(edge.index), edge.label);

export const branchLabel = (branch: BranchView): string =>
  condText(branch.condition) || branch.source || "";

const MATCH_KINDS: Record<string, string> = {
  stat: "stat",
  setstat: "stat",
  rel: "rel",
  setrel: "rel",
  flag: "flag",
  setflag: "flag",
  dice: "check",
};

const matchOf = (meta: MetaView): MetaChip["match"] => {
  const kind = MATCH_KINDS[meta.kind];
  if (!kind || !meta.key) return null;
  return { kind, key: meta.key };
};

const metaChipOf = (meta: MetaView): { chip: MetaChip | null; isDice: boolean } => {
  const display = metaDisplay(meta.kind, meta.key, meta.value);
  if (!display.text) return { chip: null, isDice: false };
  const target =
    meta.kind === "dice"
      ? meta.key
        ? { kind: "check", key: meta.key }
        : null
      : metaTarget(meta.kind, meta.key);
  const chip: MetaChip = { text: display.text, target, match: matchOf(meta) };
  if (display.title) chip.title = display.title;
  if (display.seal) chip.seal = display.seal;
  if (meta.hidden) chip.hidden = true;
  return { chip, isDice: !!target && meta.kind === "dice" };
};

export const buildReaderBlocks = (input: unknown): ReaderBlock[] => {
  const rows = Array.isArray(input) ? (input as BeatRow[]) : [];
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
      const meta = beatRows.parseMeta(row);
      if (meta.kind === "time" && typeof meta.value === "number") {
        flushMeta();
        flushDice();
        out.push({ kind: "time", rounds: meta.value });
        continue;
      }
      metaBuffer.push(meta);
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
      const lines = stripMarkup(beatRows.parseLore(row))
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      out.push({ kind: "lore", lines });
      continue;
    }

    if (beatRows.isBeat(row, "battle")) {
      out.push({ kind: "battle", battle: beatRows.parseBattle(row) });
      continue;
    }

    if (beatRows.isBeat(row, "ending")) {
      out.push({ kind: "ending", ending: beatRows.parseEnding(row) });
      continue;
    }

    if (beatRows.isBeat(row, "scene")) {
      out.push({ kind: "scene", scene: beatRows.parseScene(row) });
      continue;
    }

    if (beatRows.isBeat(row, "say")) {
      const said = beatRows.parseSay(row);
      out.push({
        kind: "say",
        mode: said.mode,
        speaker: said.speaker,
        text: said.text,
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

export const firstSayTextOf = (node: GraphNode | null): string => {
  if (!node) return "";
  const rows = textStore.beatRows(script().textLang(), node.id);
  if (!rows) return "";
  const first = beatRows.firstSay(rows);
  if (!first) return "";
  if (!first.speaker) return first.text;
  return t("lineSpeaker", { name: speakerName(first.speaker), text: first.text });
};
