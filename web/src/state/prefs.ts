import { reactive, ref } from "vue";
import type {
  FontScope, FontTarget, PrefEntry, PrefPatch, PrefState, ResolvedTypeStyle,
} from "../types/font";
import {
  BASE_FONT, FONTS, FOLLOW_BASE, FOLLOW_GROUP, fontLabelKey, fontPreset, fontStackOf,
} from "./fontFamilies";
import { GROUPS, TYPE_SLOTS, groupById, slotById } from "./fontTypes";
import { keys, readJson, writeJson } from "./storage";

const KEY = keys.prefs;

const BASE_SIZE = 16;
const BASE_LEADING = 1.6;
const BASE_WEIGHT = 400;

const WEIGHTS = [400, 500, 600];

const MEASURE_MIN = 520;
const MEASURE_MAX = 1400;
const MEASURE_DEFAULT = 860;
const SCALE_MIN = 25;
const SCALE_MAX = 300;
const SCALE_STEP = 5;
const LEADING_MIN = 50;
const LEADING_MAX = 250;
const LEADING_STEP = 5;

const GROUP_DEFAULT = { scale: 100, leading: 100, weight: BASE_WEIGHT };
const SLOT_DEFAULT = { scale: 100, leading: 100, weight: null as number | null };

const LABELS = {
  followBase: "pref.followBase",
  followGroup: "pref.followGroup",
  groupAll: "pref.groupAll",
  customFont: "pref.customFont",
};

const state = reactive<PrefState>({ groups: {}, slots: {}, measure: MEASURE_DEFAULT });

const clampNumber = (value: unknown, min: number, max: number, fallback: number): number => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
};

const clampScale = (value: unknown, fallback: number): number => (
  Math.round(clampNumber(value, SCALE_MIN, SCALE_MAX, fallback) / SCALE_STEP) * SCALE_STEP
);

const clampLeading = (value: unknown, fallback: number): number => (
  Math.round(clampNumber(value, LEADING_MIN, LEADING_MAX, fallback) / LEADING_STEP) * LEADING_STEP
);

const clampWeight = (value: unknown, fallback: number | null): number | null => {
  if (value === null) return fallback;
  const weight = Number(value);
  return WEIGHTS.indexOf(weight) >= 0 ? weight : fallback;
};

const defaultGroups = (): Record<string, PrefEntry> => {
  const out: Record<string, PrefEntry> = {};
  for (const group of GROUPS) {
    out[group.id] = {
      font: group.font || FOLLOW_BASE,
      scale: typeof group.scale === "number" ? group.scale : GROUP_DEFAULT.scale,
      leading: GROUP_DEFAULT.leading,
      weight: GROUP_DEFAULT.weight,
    };
  }
  return out;
};

const defaultSlots = (): Record<string, PrefEntry> => {
  const out: Record<string, PrefEntry> = {};
  for (const slot of TYPE_SLOTS) {
    out[slot.id] = {
      font: slot.font,
      scale: typeof slot.scale === "number" ? slot.scale : SLOT_DEFAULT.scale,
      leading: typeof slot.leading === "number" ? slot.leading : SLOT_DEFAULT.leading,
      weight: slot.weight,
    };
  }
  return out;
};

const normalizeEntry = (
  raw: unknown,
  base: PrefEntry,
  fallbackWeight: number | null,
): PrefEntry => {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    font: typeof item.font === "string" ? item.font : base.font,
    scale: clampScale(item.scale, base.scale),
    leading: clampLeading(item.leading, base.leading),
    weight: clampWeight(
      item.weight === undefined ? fallbackWeight : item.weight, fallbackWeight),
  };
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const groupStack = (groupId: string): string => (
  fontStackOf((state.groups[groupId] || GROUP_DEFAULT).font)
);

const slotStack = (slotId: string): string => {
  const slot = slotById(slotId);
  if (!slot) return BASE_FONT;
  const entry = state.slots[slotId];
  if (!entry || !entry.font || entry.font === FOLLOW_GROUP) return groupStack(slot.group);
  return fontStackOf(entry.font);
};

const resolveWeight = (slotId: string): number | null => {
  const slot = slotById(slotId);
  if (!slot) return BASE_WEIGHT;
  const entry = state.slots[slotId];
  const group = state.groups[slot.group];
  if (entry && entry.weight !== null && entry.weight !== undefined) return entry.weight;
  if (group && group.weight !== null && group.weight !== undefined) return group.weight;
  return BASE_WEIGHT;
};

const resolveEntry = (scope: FontScope, id: string): ResolvedTypeStyle | null => {
  if (scope === "group") {
    const group = state.groups[id];
    if (!group) return null;
    return {
      scope: "group",
      id,
      group: id,
      scale: group.scale,
      leading: group.leading,
      px: BASE_SIZE * (group.scale / 100),
      lineHeight: BASE_LEADING * (group.leading / 100),
      weight: group.weight,
      font: group.font,
      fontStack: groupStack(id),
    };
  }
  const slot = slotById(id);
  if (!slot) return null;
  const entry = state.slots[id];
  const group = state.groups[slot.group];
  if (!entry || !group) return null;
  return {
    scope: "slot",
    id,
    group: slot.group,
    scale: entry.scale,
    leading: entry.leading,
    px: BASE_SIZE * (group.scale / 100) * (entry.scale / 100),
    lineHeight: BASE_LEADING * (group.leading / 100) * (entry.leading / 100),
    weight: resolveWeight(id),
    font: entry.font,
    fontStack: slotStack(id),
  };
};

const applyToDocument = (): void => {
  const root = document.documentElement;
  root.style.setProperty("--font-base", BASE_FONT);
  root.style.setProperty("--reader-measure", `${state.measure}px`);
  for (const slot of TYPE_SLOTS) {
    const entry = resolveEntry("slot", slot.id);
    if (!entry) continue;
    root.style.setProperty(`--rd-fs-${slot.id}`, `${entry.px.toFixed(2)}px`);
    root.style.setProperty(`--rd-lh-${slot.id}`, entry.lineHeight.toFixed(3));
    root.style.setProperty(`--rd-fw-${slot.id}`, String(entry.weight));
    root.style.setProperty(`--rd-ff-${slot.id}`, entry.fontStack);
  }
};

const persist = (): void => {
  writeJson(KEY, state);
};

const get = (): PrefState => clone(state);

const resetDefaults = (): void => {
  state.groups = defaultGroups();
  state.slots = defaultSlots();
  state.measure = MEASURE_DEFAULT;
};

const restoreFromStorage = (): void => {
  resetDefaults();
  const saved = readJson<Partial<PrefState>>(KEY);
  const source = saved && typeof saved === "object" ? saved : null;
  if (!source) return;
  state.measure = Math.round(
    clampNumber(source.measure, MEASURE_MIN, MEASURE_MAX, MEASURE_DEFAULT));
  const groups = source.groups && typeof source.groups === "object" ? source.groups : null;
  if (groups) {
    for (const group of GROUPS) {
      state.groups[group.id] = normalizeEntry(
        groups[group.id], state.groups[group.id], GROUP_DEFAULT.weight);
    }
  }
  const slots = source.slots && typeof source.slots === "object" ? source.slots : null;
  if (slots) {
    for (const slot of TYPE_SLOTS) {
      state.slots[slot.id] = normalizeEntry(slots[slot.id], state.slots[slot.id], null);
    }
  }
};

const set = (patch: PrefPatch): PrefState => {
  if (patch && typeof patch === "object") {
    if (patch.measure !== undefined) {
      state.measure = Math.round(
        clampNumber(patch.measure, MEASURE_MIN, MEASURE_MAX, state.measure));
    }
    if (patch.groups && typeof patch.groups === "object") {
      for (const groupId of Object.keys(patch.groups)) {
        const current = state.groups[groupId];
        if (!current) continue;
        const next = patch.groups[groupId] || {};
        if (typeof next.font === "string") current.font = next.font;
        if (next.scale !== undefined) current.scale = clampScale(next.scale, current.scale);
        if (next.leading !== undefined) {
          current.leading = clampLeading(next.leading, current.leading);
        }
        if (next.weight !== undefined) current.weight = clampWeight(next.weight, current.weight);
      }
    }
    if (patch.slots && typeof patch.slots === "object") {
      for (const slotId of Object.keys(patch.slots)) {
        const current = state.slots[slotId];
        if (!current) continue;
        const next = patch.slots[slotId] || {};
        if (typeof next.font === "string") current.font = next.font;
        if (next.scale !== undefined) current.scale = clampScale(next.scale, current.scale);
        if (next.leading !== undefined) {
          current.leading = clampLeading(next.leading, current.leading);
        }
        if (next.weight !== undefined) {
          current.weight = next.weight === null
            ? null
            : clampWeight(next.weight, current.weight);
        }
      }
    }
  }
  applyToDocument();
  persist();
  return get();
};

const fontLabelKeyOf = (target: FontTarget): string => {
  if (target.scope === "group") {
    const group = state.groups[target.id];
    return fontLabelKey(group ? group.font : FOLLOW_BASE);
  }
  const entry = state.slots[target.id];
  return fontLabelKey(entry ? entry.font : FOLLOW_GROUP);
};

export const customFontOpen = ref(false);

export const prefs = {
  labels: LABELS,
  presets: {
    fonts: FONTS,
    groups: GROUPS,
    slots: TYPE_SLOTS,
    weights: WEIGHTS.slice(),
  },
  limits: {
    measure: { min: MEASURE_MIN, max: MEASURE_MAX, fallback: MEASURE_DEFAULT },
    scale: { min: SCALE_MIN, max: SCALE_MAX, step: SCALE_STEP },
    leading: { min: LEADING_MIN, max: LEADING_MAX, step: LEADING_STEP },
  },
  groupById,
  slotById,
  resolveEntry,
  get,
  set,
  reset: (): PrefState => {
    resetDefaults();
    applyToDocument();
    persist();
    return get();
  },
  fontLabelKeyOf,
  isCustomFont: (value: string): boolean => (
    !!value && value !== FOLLOW_BASE && value !== FOLLOW_GROUP && !fontPreset(value)
  ),
};

restoreFromStorage();
applyToDocument();
